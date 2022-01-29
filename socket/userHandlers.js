const { addOnlineUser, removeOnlineuser ,findUser} = require("../controllers/socketControllers")
const db =require('../config/connection')
const {USER_COLLECTION,CONVERSATION_COLLECTION,MESSAGE_COLLECTION,NOTIFICATIONS_COLLECTION} =require('../config/collections')
const { ObjectId } = require("mongodb")
const { NetworkContext } = require("twilio/lib/rest/supersim/v1/network")




module.exports = (io, socket) => {

    const adding = (payload) => {
       
        if(payload.id && payload.userId){
            console.log("create paylod", payload);

           let value= addOnlineUser({ socketId: payload.id, userId: payload.userId })
            io.to(payload.id).emit("save", "added in to db");
        }
    }

    const  LikeNotification=async ({NotificationId})=>{
        let notifications= await db.get().collection(NOTIFICATIONS_COLLECTION).aggregate([
            {
                $match: { "_id": ObjectId(NotificationId) }
            },
            {
                $lookup: {
                    from: USER_COLLECTION,
                    localField: "from",
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
                    from: 1,
                    to : 1,
                    type:1,
                    postId:1,
                    read:1,
                    date: 1,
                    user: {
                        name: 1,
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }
                    }
    
                }
    
            },
    
        ]).toArray()

        let OnlineUserExist= await findUser({userId:notifications[0].to})
        console.log(">>",OnlineUserExist);

        if(OnlineUserExist){
            const  unReadNotifications= await db.get().collection(NOTIFICATIONS_COLLECTION).find({$and:[
                {to:ObjectId(notifications[0].to)},
                {read:false}
                ]}).toArray()    
                socket.to(OnlineUserExist.socketId).emit("sendLikeNotification",{notifications:notifications[0] ,unReadNotificationsCount:unReadNotifications.length} );

           
        }

    }

    const CommentNotification=async ({NotificationId})=>{
        let notifications= await db.get().collection(NOTIFICATIONS_COLLECTION).aggregate([
            {
                $match: { "_id": ObjectId(NotificationId) }
            },
            {
                $lookup: {
                    from: USER_COLLECTION,
                    localField: "from",
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
                    from: 1,
                    to : 1,
                    type:1,
                    postId:1,
                    read:1,
                    date: 1,
                    user: {
                        name: 1,
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }
                    }
    
                }
    
            },
    
        ]).toArray()

        let OnlineUserExist= await findUser({userId:notifications[0].to})

        if(OnlineUserExist){
          const  unReadNotifications= await db.get().collection(NOTIFICATIONS_COLLECTION).find({$and:[
            {to:ObjectId(notifications[0].to)},
            {read:false}
            ]}).toArray()            

            socket.to(OnlineUserExist.socketId).emit("sendCommentNotification",{notifications:notifications[0] ,unReadNotificationsCount:unReadNotifications.length} );
        }
        
    }

    const sendMessage=async({message,sender,receiver})=>{

        console.log("sendMessage");

        let messageId


        try {

           let conversation =  await  db.get().collection(CONVERSATION_COLLECTION).aggregate([
                {
                    $match :{ users: { $all: [sender, receiver] } } 
                 
                }
                
            ]).toArray()

            if(conversation[0]){
                
              await  db.get().collection(MESSAGE_COLLECTION).insertOne({createdAt:new Date(),sender,message,conversation:conversation[0]._id,read:false}).then((result)=>{

                    messageId=result.insertedId

                    console.log("result.insertedId",result.insertedId);
                    
                    
                    
                })
                
            }
            
            
            if(!conversation[0]){
                await  db.get().collection(CONVERSATION_COLLECTION).insertOne({users:[sender,receiver],createdAt:new Date(),}).then((result)=>{
                    
                    console.log(result);
                    
                    db.get().collection(MESSAGE_COLLECTION).insertOne({createdAt:new Date(),sender,message,conversation:result.insertedId}).then((result)=>{
                        
                        messageId=result.insertedId
                        console.log("result.insertedId",result.insertedId);

                    })


                })
            }

            let OnlineUserExist= await findUser({userId:receiver})
            console.log(">>",OnlineUserExist,messageId);
    
            if(OnlineUserExist){
                const  message= await db.get().collection(MESSAGE_COLLECTION).find({_id:messageId}).toArray()  

                if(message){

                    socket.to(OnlineUserExist.socketId).emit("doReceiveMessage",message );
                }

               
            }


            
        } catch (error) {

            console.log(error);
            
        }

    }

    const notificationSeen= async(userId)=>{


        try {
            db.get().collection(NOTIFICATIONS_COLLECTION).updateMany({"to":ObjectId(userId),"read":false},{$set:{read:true}}).then(async(data)=>{

                let OnlineUserExist= await findUser({userId:userId})

                if(OnlineUserExist){
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>repeat");

                    io.to(OnlineUserExist.socketId).emit("notificationCound",notification=0)

                }

            })
        } catch (error) {

            console.log(error);
            
        }

    }


    const getNotificationCound= async({userId})=>{


        try {
           let Notifications = await db.get().collection(NOTIFICATIONS_COLLECTION).find({"to":ObjectId(userId),"read":false}).toArray()

                let OnlineUserExist= await findUser({userId:userId})

                if(OnlineUserExist){
                    console.log(Notifications.length , OnlineUserExist.socketId);
                    io.to(OnlineUserExist.socketId).emit("notificationCound",{notification:Notifications.length})

                }

            
        } catch (error) {

            console.log(error);
            
        }

    }

    

    socket.on("login",adding);
    socket.on("test",adding)
   
    socket.on('dolike', LikeNotification)
    socket.on('docomment', CommentNotification)
    socket.on('doSendMessage', sendMessage)
    socket.on('notificationSeen', notificationSeen)
    socket.on('getNotificationCound', getNotificationCound)
    

}



