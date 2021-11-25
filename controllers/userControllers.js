const { USER_COLLECTION, OTP_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
const { sendEmailOtp } = require('../controllers/emailControllers')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const bcrypt = require('bcrypt')
const moment = require('moment')
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const twilioClient = require('twilio')("ACd5ee46f39f1c73c489ff0b97f5a2a698", "ff8b35fdae8c9aa15a7690599a0a12e1")
const objectId = require('mongodb').ObjectID



module.exports = {

    test: (req, res) => {
        const value = Math.floor(Math.random() * Math.pow(10, 6))

        let unix = moment().valueOf();

        db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 10 });

        sendEmailOtp("abhinavkallungal15@gmail.com", value)

        db.get().collection(OTP_COLLECTION).insertOne({ value, createdAt: unix })

        res.json({ message: "test request" })

    },

    Signup: async (req, res) => {

        const { email, password } = req.body


        const date = moment().format();



        try {

            let emailExist = await db.get().collection(USER_COLLECTION).findOne({ email: email })
            console.log(emailExist);

            if (emailExist !== null) return res.status(400).json({ message: "user already exist" })

            const hashpassword = await bcrypt.hash(password, 10)

            let result = await db.get().collection(USER_COLLECTION).insertOne({ email, password: hashpassword, date })

            let user = await db.get().collection(USER_COLLECTION).findOne({ _id: result.insertedId })

            let token = jwt.sign({ email: user.email, id: user._id }, "secret", { expiresIn: "1h" })

            res.status(200).json({ user, token })


        } catch (err) {


            res.status(500).json({ err: err.message })

        }

    },
    login: async (req, res) => {

        const { email, password } = req.body

        try {

            let user = await db.get().collection(USER_COLLECTION).findOne({ email })

            if (user === null) return res.status(400).json({ message: "invalid username" })

            let isPasswordCorrect = await bcrypt.compare(password, user.password)

            if (!isPasswordCorrect) return res.status(400).json({ message: "invalid Password" })

            let token = await jwt.sign({ email: user.email, id: user._id }, "secret", { expiresIn: "1h" })

            return res.status(200).json({ user, token })




        } catch (err) {

            res.status(500).json({ err: err.message })

        }
    },

    sendEmailOtp: (req, res) => {

        const emailto = req.body.emailto

        try {

            const value = Math.floor(Math.random() * Math.pow(10, 6))

            let unix = new moment().valueOf();

            db.get().collection(OTP_COLLECTION).remove({ emailto: emailto })

            db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });


            db.get().collection(OTP_COLLECTION).insertOne({ value, emailto, createdAt: new Date() })

            let status = sendEmailOtp(emailto, value)

            console.log("status", status);

            res.json({ message: "test request" })
        } catch (err) {

            res.status(500).json({ err: err.message })

        }

    },


    varifyEmailOtp: async (req, res) => {
        const { emailto, otp } = req.body
        console.log(emailto, otp);

        try {

            const value = await db.get().collection(OTP_COLLECTION).findOne({ emailto: emailto })

            if (value === null) return res.status(400).json({ message: "invalid otp or otp expired " })

            if (value.value !== otp) return res.status(400).json({ message: " otp can't match " })

            db.get().collection(OTP_COLLECTION).deleteOne({_id:value._id}).then(()=>{    
                
                return res.status(200).json({ message: "otp varified" })
                
            })



        } catch (err) {

            res.status(500).json({ err: err.message })

        }

    },
    sendMobileOtp: (req, res) => {


        let { mobile } = req.body

        try {
            twilioClient.verify
                .services("VA9683c9cb08943c515f6c651ef4ac0e0c")
                .verifications.create({
                    to: `+91${mobile}`,
                    channel: "sms"
                }).then((response) => {
                    res.status(200).json({ status: 'send' })
                })

        } catch (error) {

            res.status(500).json({ error: error.message });


        }


    },
    verifyMobileOtp: (req, res) => {
        const { mobile, otp, userId } = req.body

        try {
            twilioClient.verify
                .services("VA9683c9cb08943c515f6c651ef4ac0e0c")
                .verificationChecks
                .create({
                    to: `+91${mobile}`,
                    code: otp
                }).then((data) => {

                    if (data.status === "approved") {

                        db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { mobile, mobileVarifyed: true } }).then(() => {

                            return res.status(200).json({ message: "phone number varifyed" })

                        })


                    } else {

                        return res.status(200).json({ message: "incorrect OTP" })


                    }

                }).catch((err) => {

                    return res.status(500).json({ error: error.message });

                })
        } catch (error) {

            return res.status(500).json({ error: error.message });


        }
    }






}