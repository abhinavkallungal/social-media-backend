const db = require('../config/connection')
const {ONLINE_USERS_COLLECTION} =require('../config/collections')

module.exports={
    addOnlineUser:({soketId,userId})=>{
        return new Promise(async(resolve,reject)=>{
            let user =await db.get().collection(ONLINE_USERS_COLLECTION).findOne({userId:userId})
            if(user){
                db.get().collection(ONLINE_USERS_COLLECTION).updateOne({userId:userId},{
                    $set:{
                        soketId:soketId
                    }
                }).then(()=>{
                
                }).catch(()=>{
                    
                })

            }else{
                
                db.get().collection(ONLINE_USERS_COLLECTION).insertOne({soketId,userId}).then(()=>{
                
                }).catch(()=>{
                    
                })

            }

            
        })
    }
}