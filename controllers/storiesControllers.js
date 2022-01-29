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
const { ObjectId } = require("mongodb")







module.exports = {


    addStory: async (req, res) => {
        const { name, currentChunkIndex, totalChunks, userId } = req.query;
       
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

            db.get().collection(STORIES_COLLECTION).insertOne({ userId: ObjectID(userId), createdAt: new Date(), file: result.Location }).then(async (data) => {
                
                let story = await db.get().collection(STORIES_COLLECTION).findOne({ _id: data.insertedId })
               
                res.json({ finalFilename, story });
            })


        } else {
            res.json('ok');
        }
    },

    getALLStories: async (req, res) => {
      
        const stories = await db.get().collection(STORIES_COLLECTION).aggregate([
            {
                $match: { "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            },
            {
                $sort: { _id: -1 }
            },

            {
                $group: {
                    _id: "$userId",
                    files: { $push: { file: "$file", createdAt: "$createdAt",id:"$_id" } }
                }
            },

            {
                $lookup: {
                    from: USER_COLLECTION,
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",

                }
            },
            {
                $project: {
                    _id: 1,
                    storyId:1,
                    createdAt: { $max: "$files.createdAt" },
                    files: 1,
                    user: 1
                }
            },
            {
                $unwind: "$files"
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 1,
                    files: 1,
                    storyId:1,
                    createdAt:1,
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }


                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }
            

        ]).toArray()
     

        res.json({ stories })
    },

    getStoriesSideBar: async (req, res) => {
       
        const stories = await db.get().collection(STORIES_COLLECTION).aggregate([
            {
                $match: { "createdAt": { $gt:  new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            },
            {
                $sort: { _id: -1 }
            },
            {
                $group: {
                    _id: "$userId",
                    createdAt: { $push: "$createdAt" }

                }
            },
            {
                $lookup: {
                    from: USER_COLLECTION,
                    localField: "_id",
                    foreignField: "_id",
                    as: "user",

                }
            },
            {
                $unwind: "$user"
            },
            {
                $project: {
                    _id: 1,
                    createdAt: { $max: "$createdAt" },
                    user: {
                        _id: "$user._id",
                        name: "$user.name",
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }


                    }
                }
            },
            {
                $sort: { createdAt: -1 }
            }


        ]).toArray()

       


        res.json({ stories })
    },

    viewSroty:async(req,res)=>{

      
        const {storyId,ViewerId}=req.body

     

        try {

            let story = db.get().collection(STORIES_COLLECTION).findOne({_id:ObjectId(storyId)})
            
            let viewExist =story?.views?.findIndex((view)=> view==ViewerId)

            if(viewExist =-1){

                db.get().collection(STORIES_COLLECTION).updateOne({_id:ObjectId(storyId)},{$push :{views:ViewerId}}).then(()=>{
                    
                    res.status(200).json({message:"View List updated"})

                })
            }else{
                res.status(200).json({message:"Viewer Alredy View This Story"})
            }
            
        } catch (error) {

          
            
            res.status(500).json({message:error})
        }

    },

    getTrendingStories: async (req, res) => {
       
        const trendingStories = await db.get().collection(STORIES_COLLECTION).aggregate([
            {
                $match: { "createdAt": { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
            },
            {
                $addFields: { viewCound: {$size: { "$ifNull": [ "$views", [] ] } } }
            }, 
            {
                $sort: { viewCound: -1 }
            },
            {
                $lookup: {
                    from: USER_COLLECTION,
                    localField: "userId",
                    foreignField: "_id",
                    as: "user",
                },
            },
            {
                $unwind: "$user",
            },
            {
                $addFields: { trending: true }
            }, 
            {

                $project: {
                    _id: 1,
                    userId: 1,
                    createdAt: 1,
                    file: 1,
                    views: 1,
                    viewCound: 1,
                    trending:1,
                    user: {
                        _id: 1,
                        name: 1,
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }
                    }

                }

            },
            {
                $limit:2
            },
            
            

            

        ]).toArray()
       
        res.json({ trendingStories })
    },




}