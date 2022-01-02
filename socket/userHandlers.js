const { addOnlineUser, removeOnlineuser ,findUser} = require("../controllers/socketControllers")
const db =require('../config/connection')
const {POST_COLLECTION,USER_COLLECTION, ONLINE_USERS_COLLECTION,NOTIFICATIONS_COLLECTION} =require('../config/collections')
const { ObjectId } = require("mongodb")



module.exports = (io, socket) => {

    const adding = (payload) => {
        console.log(payload);
        if(payload.id && payload.userId){
            console.log("create paylod", payload);

            addOnlineUser({ socketId: payload.id, userId: payload.userId })
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

   

    const disconnect = (socketId) => {
        console.log(socketId, ">>>>>>>>>>>>>>>");
        removeOnlineuser({ socketId })
    }
    const DoPostLike= async({ postId, userId }) => {
        console.log(postId, userId);

        try {
            let post = await db.get().collection(POST_COLLECTION).findOne({ _id: ObjectId(postId) })
            let LikeExist = post?.likes.findIndex((like) => like == userId)
            if (LikeExist === -1) {
                db.get().collection(POST_COLLECTION).updateOne({ _id: ObjectId(postId) }, { $push: { likes: ObjectId(userId) } }).then(() => {

                  

                })
            } else {
                db.get().collection(POST_COLLECTION).updateOne({ _id: ObjectId(postId) }, { $pull: { likes: ObjectId(userId) } }).then(() => {

                })

            }
        } catch (error) {

        }






    }

    doLike = () => {
        console.log("fsdfasd");
    }

    socket.on("login",adding);
   
    socket.on('dolike', LikeNotification)
    socket.on('docomment', CommentNotification)

}



