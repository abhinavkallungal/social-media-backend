const db = require('../config/connection')
const {ONLINE_USERS_COLLECTION} =require('../config/collections')
const { ObjectId } = require('mongodb')

module.exports={
    addOnlineUser:({socketId,userId})=>{
        console.log("add online user");
        return new Promise(async(resolve,reject)=>{
            let userexist =await db.get().collection(ONLINE_USERS_COLLECTION).findOne({userId:ObjectId(userId)})
            console.log("sc9",userexist);
            if(userexist){
                console.log("if");
                db.get().collection(ONLINE_USERS_COLLECTION).updateOne({userId:ObjectId(userId)},{
                    $set:{
                        socketId:socketId
                    }
                }).then(()=>{
                
                }).catch(()=>{
                    
                })

            }else{
                console.log("else");
                
                db.get().collection(ONLINE_USERS_COLLECTION).insertOne({socketId,userId:ObjectId(userId)}).then(()=>{
                
                }).catch(()=>{
                    
                })

            }

            
        })
    },
    removeOnlineuser:({socketId})=>{
        console.log("sc35 disconnected",socketId);
        return new Promise(async(resolve,reject)=>{
            let userexist =await db.get().collection(ONLINE_USERS_COLLECTION).findOne({socketId:socketId})
            console.log("sock control 38",userexist);
            if(userexist){
                db.get().collection(ONLINE_USERS_COLLECTION).deleteOne({socketId:socketId}).then(()=>{
                
                }).catch(()=>{
                    
                })

            }

        })
    }
}