const { POST_COLLECTION, USER_COLLECTION, COMMENT_COLLECTION, REPORTS_COLLECTION, NOTIFICATIONS_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
const moment = require('moment')
const objectId = require('mongodb').ObjectID


const { uploadFile ,videoUpload } = require('./awsS3Controllers')

const fs =require("fs")
const md5 =require('md5')






module.exports = {
    getFriends: async (req, res) => {
        const { userId } = req.params
       

        try {
            if (userId === undefined || userId === null) return res.status(204).json({ message: "insufficient content " })

            let friends = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $project: {
                        common: { $setIntersection: ["$followings", "$followers"] }

                    }
                },
                {
                    $unwind: "$common"
                },
                {
                    $lookup: {
                        from: USER_COLLECTION,
                        localField: "common",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user"
                },
                {
                    $project: {
                        _id: 0,
                        user: {
                            _id: 1,
                            name: 1,
                            profilePhotos: { $last: "$user.ProfilePhotos" }
                        }


                    }

                },



            ]).toArray()

         
            res.status(200).json({ friends, message: "sussess" })

        } catch (error) {

            res.status(500).json({ message: error.message })


        }
    },

    addPost: async (req, res) => {
       
        let result
        let files = []
      
        let { desc, Accessibility, userId, location, tag } = req.body

        if (tag === undefined) {
            tag = new Array()
        } else {
            tag = JSON.parse(tag)
        }

        const savePost = () => {


            db.get().collection(POST_COLLECTION).insertOne({
                desc,
                files,
                location,
                tag,
                Accessibility,
                likes: new Array(),
                comments: new Array(),
                userId: objectId(userId),
                status: "active",
                report: 0,
                postedDate:new Date() 

            }).then(async (data) => {
                

                const post = await db.get().collection(POST_COLLECTION).findOne({ "_id": data.insertedId })

                res.status(200).json({ message: "post added", post })


            }).catch((err) => {

                res.status(403).json({ message: err })

            })



        }
    
        if (req.files.length > 0) {
            req.files.map(async (file) => {
               
                result = await uploadFile(file)
                files.push(result.Location)


                if (req.files.length === files.length) {

                    savePost()


                }
            })


        } else {

            savePost()


        }


    },

    videoUpload: async (req, res) => {
        const { name, currentChunkIndex, totalChunks,postId } = req.query;
        const firstChunk = parseInt(currentChunkIndex) === 0;
        const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
        const ext = name.split('.').pop();
        const data = req.body.toString().split(',')[1];
        const buffer = new Buffer.from(data, 'base64');
        const tmpFilename = 'tmp_' + md5(name + req.ip) + '.' + ext;
        if (firstChunk && fs.existsSync('./uploads/' + tmpFilename)) {
            fs.unlinkSync('./uploads/' + tmpFilename);
        }
        fs.appendFileSync('./uploads/' + tmpFilename, buffer);
        if (lastChunk) {
            const finalFilename = postId+'.' + ext;
            fs.renameSync('./uploads/' + tmpFilename, './uploads/' + finalFilename);
            
            let result = await videoUpload( finalFilename)

            await db.get().collection(POST_COLLECTION).updateOne({_id:objectId(postId)},{$set:{video:result.Location}},{ upsert: true } )

           let post = await db.get().collection(POST_COLLECTION).findOne({_id:objectId(postId)})
         
            res.json({ finalFilename ,post });
        } else {
            res.json('ok');
        }
    },

    
    getAllPosts: async (req, res) => {

        try {
            let posts = await db.get().collection(POST_COLLECTION).aggregate([
                {
                    $match: { status: "active" },
                },
                {
                    $lookup: {
                        from: USER_COLLECTION,
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user",
                },

                { $sort: { postedDate: -1 } }

                



            ]).toArray()

            res.status(200).json({ message: "get All posts", posts })

        } catch (err) {

            res.status(500).json({ err: err.message })


        }

    },
    getFeedPosts: async (req, res) => {
        let { userId, page } = req.body


        try {
            let posts = await db.get().collection(USER_COLLECTION).aggregate([

                {
                    $match: { _id: objectId(userId) },
                },
                {
                    $project: {
                        "followings": 1,
                    }

                },
                { $set: { followings: { $concatArrays: ["$followings", [objectId(userId)]] } } },
                {
                    $lookup: {
                        from: POST_COLLECTION,
                        localField: "followings",
                        foreignField: "userId",
                        as: "post",
                    },
                },
                {
                    $unwind: "$post"

                },
                {

                    $project: {
                        _id: '$post._id',
                        desc: '$post.desc',
                        files: '$post.files',
                        location: '$post.location',
                        tag: '$post.tag',
                        Accessibility: '$post.Accessibility:',
                        likes: '$post.likes',
                        comments: '$post.comments',
                        status: '$post.status',
                        report: '$post.report',
                        postedDate: '$post.postedDate',
                        userId: '$post.userId',
                        video:'$post.video'


                    }

                },

                {
                    $lookup: {
                        from: USER_COLLECTION,
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user",
                },
                {

                    $project: {
                        _id: 1,
                        desc: 1,
                        files: 1,
                        location: 1,
                        tag: 1,
                        Accessibility: 1,
                        likes: 1,
                        comments: 1,
                        status: 1,
                        report: 1,
                        postedDate: 1,
                        userId: 1,
                        video:1,
                        user: {
                            _id: 1,
                            name: 1,
                            ProfilePhotos: { $last: "$user.ProfilePhotos" }
                        }

                    }

                },
                { $sort: { postedDate: -1 } },



            ]).toArray()



            if (posts.length > page * 10) {

                posts = posts.slice((page * 10) - 10, page * 10);
            } else {

                posts = posts.slice((page * 10) - 10, posts.length);

            }




            res.status(200).json({ message: "get allposts", posts })

        } catch (err) {

            res.status(500).json({ err: err.message })


        }

    },
    getTrendingPost:async (req,res)=>{

        try {
            
           let trendingPost= await  db.get().collection(POST_COLLECTION).aggregate([
       
            
            {
                $match: { "postedDate": { $gt:  new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            },
            {
                $addFields: { likeCound: {$size: { "$ifNull": [ "$likes", [] ] } } }
            }, 
            {
                $addFields: { commentCound: {$size: { "$ifNull": [ "$comments", [] ] } } }
            }, 
            {
                $addFields: { trending: true }
            }, 
            {
                $sort:{likeCound:-1,commentCound:-1}
            },
            {
                $limit:1
            },
            {
                $lookup: {
                    from: USER_COLLECTION,
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {

                $project: {
                    _id: 1,
                    desc: 1,
                    files: 1,
                    location: 1,
                    tag: 1,
                    Accessibility: 1,
                    likes: 1,
                    comments: 1,
                    status: 1,
                    report: 1,
                    postedDate: 1,
                    userId: 1,
                    likeCound:1,
                    commentCound:1,
                    trending:1,
                    video:1,
                    user: {
                        _id: 1,
                        name: 1,
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }
                    }

                }

            },
            
   
                
            ]).toArray()

           

            res.status(200).json(trendingPost)
            
        } catch (error) {

          
            
        }

    },

    getTagsDetailes: async (req, res) => {
      
        const { postId } = req.body

        try {

            const tagWith = await db.get().collection(POST_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(postId) }
                },
                {
                    $unwind: "$tag"
                },
                {
                    $project: {
                        _id: 0,
                        tag: { $toObjectId: "$tag._id" }
                    }
                },
                {
                    $lookup: {
                        from: USER_COLLECTION,
                        localField: "tag",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user"
                },
                {
                    $project: {

                        _id: "$user._id",
                        name: "$user.name",
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }

                    }
                },


            ]).toArray()

            res.status(200).json({ tagWith })



        } catch (error) {

            res.status(500).json({ message: error.message })


        }

    },
    editPost: (req, res) => {
        const update = req.body

        try {

            db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(update.id) }, {
                $set: {
                    text: update.text,
                    fiels: update.fiels,
                    Accessibility: update.Accessibility,
                    UpdatedDate: moment().format()

                }
            }).then(() => {

                res.status(204).json({ message: "updated successfully" })


            })


        } catch (err) {
            res.status(500).json({ err: err.message })

        }

    },
    deletePost: (req, res) => {

        const { postId } = req.body

        try {

            db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, {
                $set: {
                    status: "deleted"
                }
            }).then(() => {
                res.status(204).json({ message: "updated successfully" })
            })

        } catch (err) {

            res.status(500).json({ err: err.message })

        }

    },

    DoPostLike: async (req, res) => {
        const { postId, userId } = req.body

        try {
            let post = await db.get().collection(POST_COLLECTION).findOne({ _id: objectId(postId) })
            let LikeExist = post?.likes?.findIndex((like) => like == userId)
            console.log(LikeExist);
            if (LikeExist === -1) {
                db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, { $push: { likes: objectId(userId) } }).then(() => {

                    if (userId == post.userId+"") {
                      
                        return res.status(200).json({ message: "Liked", likes: post.likes.length+1, liked: true })

                    } else {

                        db.get().collection(NOTIFICATIONS_COLLECTION).insertOne(
                            {
                                from: objectId(userId),
                                to: objectId(post.userId),
                                type: "like",
                                postId: objectId(post._id),
                                date: moment().format(),
                                read: false
                            }
                        ).then((result) => {

                            db.get().collection(POST_COLLECTION).findOne({ _id: objectId(postId) }).then((post) => {
                                let likes = post.likes
                                res.status(200).json({ message: "liked", likes: likes.length, liked: true, NotificationId: result.insertedId })
                            })
                        })


                    }




                })
            } else {
                db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, { $pull: { likes: objectId(userId) } }).then(() => {
                    db.get().collection(POST_COLLECTION).findOne({ _id: objectId(postId) }).then((post) => {
                        let likes = post.likes

                        res.status(200).json({ message: "Un Liked", likes: likes.length, liked: false })

                    })

                })

            }
        } catch (error) {

            res.status(500).json({ err: err.message })


        }






    },
    DoPostSave: async (req, res) => {
        const { postId, userId } = req.body
    
        try {
            let user = await db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) })
            let SavedExist = user?.SavedPost?.findIndex((SavedPost) => SavedPost == postId)
       
            if (SavedExist === -1 || SavedExist === undefined) {
                db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $push: { SavedPost: objectId(postId) } }).then(() => {
                    db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                       
                        res.status(200).json({ message: "saved", user, saved: true })
                    })



                })
            } else {
                db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $pull: { SavedPost: objectId(postId) } }).then(() => {
                    db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {

                        res.status(200).json({ message: "UnSaved", user, saved: false })

                    })

                })

            }
        } catch (error) {

            res.status(500).json({ error: error.message })


        }






    },
    DoDeletepost: async (req, res) => {
        const { postId, userId } = req.body
      

        try {
            let post = await db.get().collection(POST_COLLECTION).findOne({ _id: objectId(postId) })
          
            if (post.userId == userId) {
            
                db.get().collection(POST_COLLECTION).deleteOne({ _id: objectId(postId) }).then((result) => {

                    res.status(200).json({ message: "post is  successfully deleted" })

                })
            } else {
               

                res.status(401).json({ message: "you are not owner of the post so you cant delete the post" })

            }
        } catch (error) {
         
            res.status(500).json({ err: err.message })


        }






    },

    DoComment: async (req, res) => {
        const { postId, userId, comment } = req.body

        if (comment.trim() == "") return res.status(204).json({ message: "Comment Is Empty" })


        try {
            db.get().collection(COMMENT_COLLECTION).insertOne({ postId: objectId(postId), userId: objectId(userId), comment, date: moment().format() }).then((result) => {
                db.get().collection(POST_COLLECTION).findOneAndUpdate({ _id: objectId(postId) }, { $push: { comments: result.insertedId } }).then(async (result) => {


                    let post = result.value


                    let comments = await db.get().collection(COMMENT_COLLECTION).aggregate([
                        {
                            $match: { postId: objectId(postId) }
                        },
                        {
                            $lookup: {
                                from: USER_COLLECTION,
                                localField: "userId",
                                foreignField: "_id",
                                as: "user",
                            },
                        },
                        {
                            $unwind: "$user"
                        },
                        {
                            $project: {
                                _id: 1,
                                comment: 1,
                                postId: 1,
                                date: 1,
                                user: {
                                    name: 1,
                                    ProfilePhotos: { $last: "$user.ProfilePhotos" }
                                }

                            }

                        },
                        { $sort: { date: -1 } },



                    ]).toArray()

                    if (userId === post.userId) {
                        return res.status(200).json({ message: "comment added", comments: comments })


                    } else {

                        db.get().collection(NOTIFICATIONS_COLLECTION).insertOne(
                            {
                                from: objectId(userId),
                                to: objectId(post.userId),
                                type: "comment",
                                postId: objectId(postId),
                                date: moment().format(),
                                read: false
                            }
                        ).then((result) => {

                            return res.status(200).json({ message: "comment added", comments: comments, NotificationId: result.insertedId })


                        }).catch((error) => {


                            res.status(500).json({ message: err.message })

                        })


                    }

                })

            })



        } catch (error) {
           
            res.status(500).json({ err: err.message })


        }






    },

    getPostComments: async (req, res) => {
        const { postId } = req.body
      

        try {

            let comments = await db.get().collection(COMMENT_COLLECTION).aggregate([
                {
                    $match: { postId: objectId(postId) }
                },
                {
                    $lookup: {
                        from: USER_COLLECTION,
                        localField: "userId",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                {
                    $unwind: "$user"
                },
                {
                    $project: {
                        _id: 1,
                        comment: 1,
                        postId: 1,
                        date: 1,
                        user: {
                            name: 1,
                            ProfilePhotos: { $last: "$user.ProfilePhotos" }
                        }

                    }

                },
                { $sort: { date: -1 } },



            ]).toArray()
            if (comments.length === 0) return res.status(204).json({ message: "No comment Found" })

            res.status(200).json({ message: "comments found", comments })



        } catch (error) {

            res.status(500).json({ message: error.message })

        }
    },

    DoReport: async (req, res) => {
        const { userId, postId, optoion, message } = req.body

        if (message.trim() == "") return res.status(204).json({ message: "Message Is Empty" })


        try {
            db.get().collection(REPORTS_COLLECTION).insertOne({ postId: objectId(postId), userId: objectId(userId), message, date: moment().format(), optoion }).then(async (result) => {
                let post = await db.get().collection(POST_COLLECTION).findOne({ _id: objectId(postId) })
                let noOfReport = post?.report
                if (noOfReport >= 9) {

                    db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, { $set: { status: "Block" }, $inc: { report: 1 } }).then(() => {

                        res.status(200).json({ message: " Post Reported ", })
                    })

                } else {
                    db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, { $inc: { report: 1 } }).then(() => {

                        res.status(200).json({ message: " Post Reported ", })
                    })

                }



            })



        } catch (error) {
          

            res.status(500).json({ err: err.message })


        }






    },
    gteAllPostFiles: async (req, res) => {
        let userId = req.params.id

        try {
            let allPostFiles = await db.get().collection(POST_COLLECTION).aggregate([
                {
                    $match: { userId: objectId(userId) }
                },
            ]).toArray()


            res.status(200).json({ allPostFiles })
        } catch (error) {

        }
    }


}