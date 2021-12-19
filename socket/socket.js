
let socket
let io

module.exports = {
    
     


    socketIo : (socketIo,Io) => {
        socket=socketIo
        io=Io
    },
    test:()=>{
        io.emit("likemsg", "liked")


    },



}

