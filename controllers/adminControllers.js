const { ADMIN_COLLECTION, USER_COLLECTION ,BANNER_COLLECTION} = require("../config/collections")
const db = require('../config/connection')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ObjectId = require('mongodb').ObjectId

const { uploadFile  } = require('./awsS3Controllers')



module.exports = {
    

    login: async (req, res) => {

        const { email, password } = req.body
      

        try {
           
            let admin = await db.get().collection(ADMIN_COLLECTION).findOne({ email: email })
            
            if (admin === null) return res.status(400).json({ message: "invalid username" })
           
            let isPasswordCorrect = await bcrypt.compare(password, admin.password)
           
            if (!isPasswordCorrect) return res.status(400).json({ message: "invalid Password" })
            


            let token = await jwt.sign({ email: admin.email, id: admin._id, isAdmin: true }, "AdminSecret", { expiresIn: "1h" })

            return res.status(200).json({ admin, token })




        } catch (err) {

            res.status(500).json({ err: err.message })

        }
    },

    getAllusers: async (req, res) => {

        try {
            const users = await db.get().collection(USER_COLLECTION).find().toArray()

            if (users === null) return res.status(204).json({ message: "user collection are empty" })

            res.status(200).json({ users })

        } catch (err) {
            res.status(500).json({ err: err.message })

        }

    },

    deleteUser: async (req, res) => {

        const { userId } = req.body


        try {
            await db.get().collection(USER_COLLECTION).deleteOne({ "_id": ObjectId(userId) }).then(async (data) => {

                const users = await db.get().collection(USER_COLLECTION).find().toArray()


               

                res.status(200).json({ message: "the user was deleted", users })

            }).catch((err) => {

         

                res.status(500).json({ err: err.message })

            })
            

        } catch (error) {
           

            res.status(500).json({ err: err.message })

        }

    },
    edituser: async (req, res) => {

        const { userId, status } = req.body

        try {

            await db.get().collection(USER_COLLECTION).updateOne({ "_id": ObjectId(userId) }, { $set: { isActive: status } }).then(async (data) => {

                const users = await db.get().collection(USER_COLLECTION).find().toArray()

                res.status(200).json({ users })


            }).catch((err) => {

                res.status(500).json({ err: err.message })


            })

        } catch (err) {

            res.status(500).json({ err: err.message })


        }



    },
    addBanner: async (req, res) => {

       
        let result
        let files = []
      
        let {  description,days} = req.body

       
     

        const savePost = () => {


            db.get().collection(BANNER_COLLECTION).insertOne({

                files,
                description,
                days,
                createdAt: Date.now(),
                expireAt:new Date(Date.now() + (1000 * 60 * 60 * 24 * days))
                

            }).then(async (data) => {
                

                const post = await db.get().collection(BANNER_COLLECTION).findOne({ "_id": data.insertedId })

                res.status(200).json({ message: "post added", post })


            }).catch((err) => {

                res.status(403).json({ message: err })

            })



        }
    
        if (req.files.length > 0) {
            req.files.map(async (file) => {
               
                result = await uploadFile(file)
                files.push(result.Location)


                if (req.files.length === files.length) {

                    savePost()


                }
            })


        } 


    },
    getAllBanners: async (req, res) => {

        try {
            let Banner = await db.get().collection(BANNER_COLLECTION).aggregate([
               
                { $sort: { createdAt: -1 } }

                
            ]).toArray()

            res.status(200).json({ message: "get All Banner", Banner })

        } catch (err) {

            res.status(500).json({ err: err.message })


        }

    },

    deleteBanner: async (req, res) => {

        let id = req.params.id
       
        try {
          db.get().collection(BANNER_COLLECTION).deleteOne({_id:ObjectId(id)}).then(async()=>{

            let Banner = await db.get().collection(BANNER_COLLECTION).aggregate([
               
                { $sort: { createdAt: -1 } }

                
            ]).toArray()

            

            res.status(200).json({ message: "get All Banner", Banner })
          })

        } catch (err) {

           

            res.status(500).json({ err: err.message })


        }

    },









}