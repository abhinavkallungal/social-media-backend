const {addOnlineUser,removeOnlineuser} =require("../controllers/socketControllers")


module.exports = (io, socket) => {
    const adding = (payload) => {
        console.log("create paylod",payload);
        addOnlineUser({soketId:payload.id,userId:payload.userId})
        io.to(payload.id).emit("save","added in to db");
    }
  
    const readOrder = (orderId, callback) => {

    }

    const disconnect=(soketId)=>{
        console.log(soketId,">>>>>>>>>>>>>>>");
        removeOnlineuser({soketId})
    }
  
    socket.on("login", adding);
    socket.on("test",(msg)=>{
        console.log(msg);
        io.emit("broadcast",msg)
    })
  }