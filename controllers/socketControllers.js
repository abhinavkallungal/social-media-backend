


const { ONLINE_USERS_COLLECTION } = require("../config/collections")
const db = require('../config/connection')

const { ObjectId } = require("mongodb")
const { ObjectID } = require("bson")








module.exports = {
    addOnlineUser: async ({ socketId, userId }) => {

        let userExist = await db.get().collection(ONLINE_USERS_COLLECTION).findOne({ userId: ObjectId(userId) })


        if (!userExist) {


            db.get().collection(ONLINE_USERS_COLLECTION).insertOne({ socketId, userId: ObjectId(userId) }).then(() => {


            }).catch(() => {

            })
        } else {
            db.get().collection(ONLINE_USERS_COLLECTION).updateOne({ userId: ObjectID(userId) }, { $set: { socketId } }).then(() => {


            }).catch(() => {

            })
        }







    },
    removeOnlineuser: async ({ socketId }) => {


        db.get().collection(ONLINE_USERS_COLLECTION).deleteOne({ socketId: socketId }).then(() => {
            console.log("deleted");


        }).catch(() => {

        })



    },
    findUser: async ({ userId }) => {

        let values = await db.get().collection(ONLINE_USERS_COLLECTION).findOne({ userId: ObjectId(userId) })



        

        return values


    }
}