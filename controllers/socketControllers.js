
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./db.json')
const db = low(adapter)
db.defaults({
    ONLINE_USERS: []
});


let ONLINE_USERS = db.get('ONLINE_USERS');
console.log(ONLINE_USERS.value());




module.exports = {
    addOnlineUser: ({ socketId, userId }) => {
        console.log(socketId, userId);

        let exist = db.get('ONLINE_USERS').find({ userId: userId }).value()

        if (exist) {

            db.get('ONLINE_USERS').find({ userId: userId}).assign({ socketId: socketId }).write()
        }else{

            db.get('ONLINE_USERS').push({ userId, socketId}).write()

        }

    },
    removeOnlineuser: ({ socketId }) => {

        db.get('ONLINE_USERS').remove({ socketId: socketId }).write()


    },
    findUser:async({userId})=>{

        console.log('usrid',userId+'');

        let user =await db.get("ONLINE_USERS").filter({ userId:userId+''}).value()

        console.log(user);

        return user[0]   


    }
}