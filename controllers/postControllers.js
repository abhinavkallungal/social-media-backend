const { POST_COLLECTION, USER_COLLECTION, COMMENT_COLLECTION, REPORTS_COLLECTION, NOTIFICATIONS_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
const moment = require('moment')
const objectId = require('mongodb').ObjectID
const userHandlers = require("../socket/userHandlers")
const { test } = require('../socket/socket')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { uploadFile } = require('./awsS3Controllers')






module.exports = {
    getFriendsForTag:async(req,res)=>{
        const {userId} =req.body
        console.log("userId",req.body);

        try {
            if(userId===undefined ||userId===null) return res.status(204).json({message:"insufficient content "})

            let friends = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match :{_id:objectId(userId)}
                },
                {
                    $project :{
                        common:{ $setIntersection: [ "$followings","$followers" ]}
    
                    }
                },
                {
                    $unwind : "$common"
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
                        _id:0,
                        user: {
                            _id:1,
                            name: 1,
                        }
    
                    }
    
                },
    
               
    
            ]).toArray()
    
            console.log(friends);

            res.status(200).json({friends,message:"sussess"})
            
        } catch (error) {

            res.status(500).json({ message: error.message })

            
        }

       





    },

    addPost: async (req, res) => {
        let result
        let files = []
        console.log("call",req.body);

        let { desc, save, Accessibility, userId,location,tag } = req.body

        if(tag===undefined){
            tag=new Array(  )
        }else{
            tag=JSON.parse(tag)
        }

        const  savePost = () => {


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
                postedDate: moment().format()

            }).then(async (data) => {
                console.log(data);

                const post = await db.get().collection(POST_COLLECTION).findOne({ "_id": data.insertedId })

                res.status(200).json({ message: "post added", post })


            })



        }
        console.log(req.files.length);

        if(req.files.length > 0){
            req.files.map(async (file) => {
                result = await uploadFile(file)
                files.push(result.Location)
    
    
                if (req.files.length === files.length) {
    
                    savePost()
    
    
                }
            })

            
        }else{
            
            savePost()
           

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

            res.status(200).json({ message: "post added", posts })

        } catch (err) {

            res.status(500).json({ err: err.message })


        }

    },
    getFeedPosts: async (req, res) => {
        let { userId } = req.body
        console.log(">>>>>>>>>>>", req.body);

        try {
            let posts = await db.get().collection(USER_COLLECTION).aggregate([

                {
                    $match: { _id: objectId(userId) },
                },
                {
                    $unwind: "$followings"
                },
                {
                    $project: {
                        "followings": 1,
                    }

                },
                {
                    $lookup: {
                        from: POST_COLLECTION,
                        localField: "followings",
                        foreignField: "userId",
                        as: "post",
                    },
                },
                {
                    $unwind:"$post"

                },
                {

                    $project:{
                        _id:'$post._id',
                        desc:'$post.desc',
                        files:'$post.files',
                        location:'$post.location',
                        tag:'$post.tag',
                        Accessibility:'$post.Accessibility:',
                        likes:'$post.likes',
                        comments:'$post.comments',
                        status:'$post.status',
                        report:'$post.report',
                        postedDate:'$post.postedDate',
                        userId:'$post.userId',
                       
                        
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

                    $project:{
                        _id:1,
                        desc:1,
                        files:1,
                        location:1,
                        tag:1,
                        Accessibility:1,
                        likes:1,
                        comments:1,
                        status:1,
                        report:1,
                        postedDate:1,
                        userId:1,
                        user: {
                            _id:1,
                            name: 1,
                            ProfilePhotos: { $last: "$user.ProfilePhotos" }
                        }
                        
                    }

                },
                { $sort: { postedDate: -1 } }
               
              
            

            ]).toArray()

            res.status(200).json({ message: "post added", posts })

        } catch (err) {

            res.status(500).json({ err: err.message })


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

        const { id } = req.body

        try {

            db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(id) }, {
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
            let LikeExist = post?.likes.findIndex((like) => like == userId)
            if (LikeExist === -1) {
                db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, { $push: { likes: objectId(userId) } }).then(() => {

                    if (userId === post.userId) {

                        res.status(200).json({ message: "Un Liked", likes: likes.length, liked: false })

                    }

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
        console.log(postId, userId);

        try {
            let user = await db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) })
            let SavedExist = user?.SavedPost?.findIndex((SavedPost) => SavedPost == postId)
            console.log(SavedExist);
            if (SavedExist === -1 || SavedExist === undefined) {
                db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $push: { SavedPost: objectId(postId) } }).then(() => {
                    db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                        console.log(user);
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
        console.log(postId, userId);

        try {
            let post = await db.get().collection(POST_COLLECTION).findOne({ _id: objectId(postId) })
            console.log(post);
            if (post.userId == userId) {
                console.log("if");
                db.get().collection(POST_COLLECTION).deleteOne({ _id: objectId(postId) }).then((result) => {

                    res.status(200).json({ message: "post is  successfully deleted" })

                })
            } else {
                console.log("else");

                res.status(401).json({ message: "you are not owner of the post so you cant delete the post" })

            }
        } catch (error) {
            console.log(error);

            res.status(500).json({ err: err.message })


        }






    },

    DoComment: async (req, res) => {
        const { postId, userId, comment } = req.body

        if (comment.trim() == "") return res.status(204).json({ message: "Comment Is Empty" })


        try {
            db.get().collection(COMMENT_COLLECTION).insertOne({ postId, userId: objectId(userId), comment, date: moment().format() }).then((result) => {
                db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(postId) }, { $push: { comments: result.insertedId } }).then(async () => {
                    let newcomment = await db.get().collection(COMMENT_COLLECTION).aggregate([
                        {
                            $match: { _id: objectId(result.insertedId) }
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


                    ]).toArray()
                    console.log(newcomment);
                    res.status(200).json({ message: "comment added", comment: newcomment })
                })

            })



        } catch (error) {
            console.log(error);

            res.status(500).json({ err: err.message })


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
            console.log(error);

            res.status(500).json({ err: err.message })


        }






    },


}