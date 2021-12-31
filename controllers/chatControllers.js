const db = require("../config/connection")
const {CONVERSATION_COLLECTION} =require('../config/collections')
const { ObjectId } = require("mongodb")

module.exports={
        createConversation:(req,res)=>{
            const {currentUser,userId} =req.body


            let conversation={
                createdAt:new Date(),
                users:[ObjectId(currentUser),ObjectId(userId)]
            }

            try{
                db.get().collection(CONVERSATION_COLLECTION).insertOne(conversation).then((result)=>{

                }).catch((err)=>{
                    

                })

            }catch(err){

            }

        }
}