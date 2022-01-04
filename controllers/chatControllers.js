const db = require("../config/connection")
const {CONVERSATION_COLLECTION,MESSAGE_COLLECTION} =require('../config/collections')
const { ObjectId } = require("mongodb")
const {io,socket} =require('../app')

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

        },

        sendMessage:async(req,res)=>{
            const {message,sender,receiver} =req.body

            console.log(req.body);

            try {

               let conversation =  await  db.get().collection(CONVERSATION_COLLECTION).aggregate([
                    {
                        $match :{ users: { $all: [sender, receiver] } } 
                     
                    }
                    
                ]).toArray()

                if(conversation[0]){
                    
                    db.get().collection(MESSAGE_COLLECTION).insertOne({createdAt:new Date(),sender,message,conversation:conversation[0]._id,read:false}).then((data)=>{
                        
                          res.status(200).json({message:"message saved"})

                    })

                }


                if(!conversation[0]){
                    db.get().collection(CONVERSATION_COLLECTION).insertOne({users:[sender,receiver],createdAt:new Date(),}).then((result)=>{

                        console.log(result);

                        db.get().collection(MESSAGE_COLLECTION).insertOne({createdAt:new Date(),sender,message,conversation:result.insertedId}).then((data)=>{
                        
                            res.status(200).json({message:"message saved"})
  
                        })


                    })
                }


                
            } catch (error) {

                console.log(error);
                
            }

        },

        getmessages:async(req,res)=>{
            const {sender,receiver}=req.body

            try {

                let conversation =  await  db.get().collection(CONVERSATION_COLLECTION).aggregate([
                    {
                        $match :{ users: { $all: [sender, receiver] } } 
                     
                    }
                    
                ]).toArray()

                if(conversation[0]){

                    let messages= await db.get().collection(MESSAGE_COLLECTION).aggregate([
                        {
                            $match :{conversation:ObjectId(conversation[0]._id)}
                        },
                       
                        
                    ]).toArray()

                    res.status(200).json({messages})

                }else{

                    res.status(204).json({message:" previous message not fond "})

                }




                
            } catch (error) {

                console.log(error);

                res.status(500).json({message:error.message})
                
            }


        },

        
    }
    
