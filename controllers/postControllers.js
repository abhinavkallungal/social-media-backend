const {POST_COLLECTION} =require("../config/collections")
const db =require('../config/connection')
const moment =require('moment')
const objectId=require('mongodb').ObjectID



module.exports={

    addPost:async(req,res)=>{
        //req.body  text fiels type  save Accessibility

        const {text ,fiels, type,  save, Accessibility,userId}=req.body


        try {

            db.get().collection(POST_COLLECTION).insertOne({
                text ,
                fiels, 
                type,  
                save, 
                Accessibility,
                likes: new Array(),
                comment: new Array(),
                userId,
                status:"active",
                report:0,
                postedDate:moment().format()

            }).then((data)=>{
                res.status(200).json({message:"post added"})
            })

            
        } catch (error) {

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