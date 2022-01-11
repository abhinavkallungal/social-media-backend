const { POST_COLLECTION, STORIES_COLLECTION, USER_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
const moment = require('moment')
const ObjectID = require('mongodb').ObjectID
const userHandlers = require("../socket/userHandlers")
const { test } = require('../socket/socket')
const multer = require('multer')
const upload = multer({ dest: 'uploads/' })
const { videoUpload } = require('./awsS3Controllers')
const { post } = require("../routers/User")
const { response } = require("express")
const md5 = require('md5')
const fs = require('fs')







module.exports = {


    addStory: async (req, res) => {
        const { name, currentChunkIndex, totalChunks, userId } = req.query;
        console.log(userId);
        const firstChunk = parseInt(currentChunkIndex) === 0;
        const lastChunk = parseInt(currentChunkIndex) === parseInt(totalChunks) - 1;
        const ext = name.split('.').pop();
        const data = req.body.toString().split(',')[1];
        const buffer = new Buffer.from(data, 'base64');
        const tmpFilename = 'tmp_' + md5(name + req.ip) + '.' + ext;
        if (firstChunk && fs.existsSync('./uploads/' + tmpFilename)) {
            fs.unlinkSync('./uploads/' + tmpFilename);
        }
        fs.appendFileSync('./uploads/' + tmpFilename, buffer);
        if (lastChunk) {
            let time = Date.now()
            const finalFilename = time + userId + '.' + ext;
            fs.renameSync('./uploads/' + tmpFilename, './uploads/' + finalFilename)

            let result = await videoUpload(finalFilename)

            db.get().collection(STORIES_COLLECTION).insertOne({ userId:ObjectID (userId), createdAt: new Date(), file: result.Location }).then(async (data) => {
                console.log(data.insertedId);
                let story = await db.get().collection(STORIES_COLLECTION).findOne({ _id: data.insertedId })
                console.log(result);
                res.json({ finalFilename, story });
            })


        } else {
            res.json('ok');
        }
    },

    getALLStories:async (req,res)=>{
        console.log("getALLStories");
        const stories = await db.get().collection(STORIES_COLLECTION).aggregate([
            {
                    $match:{"createdAt":{$gt:new Date(Date.now() - 24*60*60 * 1000)}}
            },
            {
                $group: {
                    _id: "$userId",
                    files:{$push:"$file"}
                 }
            },
        
            {
                $lookup:{
                    from: USER_COLLECTION,
                        localField: "_id",
                        foreignField: "_id",
                        as: "user",

                }
            },
            {
                $unwind:"$files"
            },
            {
                $unwind:"$user"
            },
            {
                $project:{
                    _id:1,
                    files:1,
                    createdAt:1,
                    user:{
                        _id:"$user._id",
                        name:"$user.name",
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }


                    }
                }
            }
           
        ]).toArray()
        console.log(stories);

        res.json({stories})
    },

    getStoriesSideBar:async (req,res)=>{
        console.log("getALLStories");
        const stories = await db.get().collection(STORIES_COLLECTION).aggregate([
            {
                    $match:{"createdAt":{$gt:new Date(Date.now() - 24*60*60 * 1000)}}
            },
            {
                $sort:{createdAt:-1}
            },
            {
                $group: {
                    _id: "$userId",
                    files:{$push:"$file"}
                 }
            },
        
            {
                $lookup:{
                    from: USER_COLLECTION,
                        localField: "_id",
                        foreignField: "_id",
                        as: "user",

                }
            },
            {
                $unwind:"$user"
            },
            {
                $project:{
                    _id:1,
                    files:1,
                    createdAt:1,
                    user:{
                        _id:"$user._id",
                        name:"$user.name",
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }


                    }
                }
            },
           
           
        ]).toArray()
        console.log(stories);

        res.json({stories})
    }




}