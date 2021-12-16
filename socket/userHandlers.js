const {addOnlineUser} =require("../controllers/socketControllers")


module.exports = (io, socket) => {
    const createOrder = (payload) => {
        console.log("create paylod",payload);
        addOnlineUser({soketId:payload.id,userId:payload.userId})
        io.to(payload.id).emit("save","added in to db");


    }
  
    const readOrder = (orderId, callback) => {

    }
  
    socket.on("login", createOrder);
    socket.on("test",(msg)=>{
        console.log(msg);
        io.emit("broadcast",msg)
    })
  }