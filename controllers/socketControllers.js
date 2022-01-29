
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('./db.json')
const db = low(adapter)
db.defaults({
    ONLINE_USERS: []
});

const redis = require("redis");
const client = redis.createClient();



let ONLINE_USERS = db.get('ONLINE_USERS');





module.exports = {
    addOnlineUser: async({ socketId, userId }) => {
       
        client.on('error', (err) => console.log('Redis Client Error', err));


        await client.connect()
        await client.set(userId, socketId);
      

        let values=await client.get(userId)
        
        console.log("**********************",values);

        return value
        
       

    },
    removeOnlineuser: ({ socketId }) => {

        db.get('ONLINE_USERS').remove({ socketId: socketId }).write()


    },
    findUser: async ({ userId }) => {

        console.log('usrid', userId + '');

        let user = await db.get("ONLINE_USERS").filter({ userId: userId + '' }).value()

        console.log(user);

        return user[0]


    }
}