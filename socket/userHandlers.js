const { addOnlineUser, removeOnlineuser } = require("../controllers/socketControllers")
const db =require('../config/connection')
const {POST_COLLECTION} =require('../config/collections')
const { ObjectId } = require("mongodb")
const {socketIo}=require('./socket')



module.exports = (io, socket) => {
    socketIo(socket,io)

    const adding = (payload) => {
        console.log("create paylod", payload);
        addOnlineUser({ soketId: payload.id, userId: payload.userId })
        io.to(payload.id).emit("save", "added in to db");
    }

    const readOrder = (orderId, callback) => {

    }

    const disconnect = (socketId) => {
        console.log(soketId, ">>>>>>>>>>>>>>>");
        removeOnlineuser({ soketId })
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

    socket.on("login", adding);
    socket.on("test", (msg) => {
        console.log(msg);
        io.emit("broadcast", msg)
    })
    socket.on('dolike', ({ userId, socketId }) => {
        console.log(">>>>", userId);
    })

}



