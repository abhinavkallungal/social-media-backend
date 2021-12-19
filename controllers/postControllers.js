const {POST_COLLECTION,USER_COLLECTION} =require("../config/collections")
const db =require('../config/connection')
const moment =require('moment')
const objectId=require('mongodb').ObjectID
const userHandlers = require("../socket/userHandlers")
const {test} = require('../socket/socket')





module.exports={

    addPost:async(req,res)=>{
       
        const {desc ,files,save, Accessibility,userId}=req.body


        try {

            db.get().collection(POST_COLLECTION).insertOne({
                desc,
                files, 
                save, 
                Accessibility,
                likes: new Array(),
                comment: new Array(),
                userId:objectId(userId),
                status:"active",
                report:0,
                postedDate:moment().format()

            }).then(async(data)=>{
                console.log(data);

               const post= await db.get().collection(POST_COLLECTION).findOne({"_id":data.insertedId})

                res.status(200).json({message:"post added",post})
        

            })

            
        } catch (err) {
            console.log(err);

            res.status(500).json({err:err.message})
            
        }

    },
    getAllPosts:async(req,res)=>{

        try {
            let posts=await db.get().collection(POST_COLLECTION).aggregate([
                {
                    $match: {status:"active"},
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
                  { $sort : { postedDate:-1 } }

              
                
                 
              ]).toArray()

            res.status(200).json({message:"post added",posts})
            
        } catch (err) {

            res.status(500).json({err:err.message})

            
        }

    },
    editPost:(req,res)=>{
        const update=req.body

        try {
            
            db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(update.id) }, {
                $set: {
                    text:update.text,
                    fiels:update.fiels, 
                    Accessibility:update.Accessibility,
                    UpdatedDate:moment().format()
                   
                }
            }).then(()=>{
                
                res.status(204).json({message:"updated successfully"})


            })

            
        } catch (err) {
            res.status(500).json({err:err.message})

        }

    },
    deletePost:(req,res)=>{

        const {id}=req.body

        try {
            
            db.get().collection(POST_COLLECTION).updateOne({ _id: objectId(id) },{
                $set :{
                    status:"deleted"
                }
            }).then(()=>{
                res.status(204).json({message:"updated successfully"})
            })

        } catch (err) {

            res.status(500).json({err:err.message})
            
        }

    },

    DoPostLike:async(req,res)=>{
            const {postId,userId} =req.body
            console.log(postId,userId);

            try {
               let post= await db.get().collection(POST_COLLECTION).findOne({_id:objectId(postId)})
               let LikeExist = post?.likes.findIndex((like) => like == userId)
                if(LikeExist===-1){
                    db.get().collection(POST_COLLECTION).updateOne({_id:objectId(postId)}, { $push: { likes: objectId(userId) } }).then(()=>{
                        db.get().collection(POST_COLLECTION).findOne({_id:objectId(postId)}).then((post)=>{
                               let likes=post.likes
                              
                            res.status(200).json({message:"liked",likes:likes.length,liked:true})
                        })


                    })
                }else{
                    db.get().collection(POST_COLLECTION).updateOne({_id:objectId(postId)}, { $pull: { likes: objectId(userId) } }).then(()=>{
                        db.get().collection(POST_COLLECTION).findOne({_id:objectId(postId)}).then((post)=>{
                            let likes=post.likes

                            res.status(200).json({message:"Un Liked",likes:likes.length,liked:false})

                        })

                    })

                }
            } catch (error) {

                res.status(500).json({err:err.message})

                
            }
            
            

            
    

    },
    DoPostSave:async(req,res)=>{
        const {postId,userId} =req.body
        console.log(postId,userId);

        try {
           let user= await db.get().collection(USER_COLLECTION).findOne({_id:objectId(userId)})
           let SavedExist = user?.SavedPost?.findIndex((SavedPost) => SavedPost == postId)
           console.log(SavedExist);
            if(SavedExist===-1 || SavedExist===undefined){
                db.get().collection(USER_COLLECTION).updateOne({_id:objectId(userId)}, { $push: { SavedPost: objectId(postId) } }).then(()=>{
                    db.get().collection(USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{
                        console.log(user);
                        res.status(200).json({message:"saved",user,saved:true})
                    })
                   


                })
            }else{
                db.get().collection(USER_COLLECTION).updateOne({_id:objectId(userId)}, { $pull: { SavedPost: objectId(postId) } }).then(()=>{
                    db.get().collection(USER_COLLECTION).findOne({_id:objectId(userId)}).then((user)=>{

                        res.status(200).json({message:"UnSaved",user,saved:false})

                    })

                })

            }
        } catch (error) {

            res.status(500).json({error:error.message})

            
        }
        
        

        


}



    


}