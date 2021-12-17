const {POST_COLLECTION,USER_COLLECTION} =require("../config/collections")
const db =require('../config/connection')
const moment =require('moment')
const objectId=require('mongodb').ObjectID





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

    }



    


}