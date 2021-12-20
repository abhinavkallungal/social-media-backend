const db = require('../config/connection')
const {NOTIFICATIONS_COLLECTION,USER_COLLECTION} =require('../config/collections')
const { ObjectId } = require('mongodb')


module.exports={
    getAllNotification:async(req,res)=>{
        const{userId} =req.body
       let notifications= await db.get().collection(NOTIFICATIONS_COLLECTION).aggregate([
        {
            $match: { "to": ObjectId(userId) }
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
        { $sort: { date: -1 } }

       ]).toArray()
       res.status(200).json({notifications})
    }
  
}