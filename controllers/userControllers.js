const { USER_COLLECTION, OTP_COLLECTION, POST_COLLECTION ,NOTIFICATIONS_COLLECTION} = require("../config/collections")
const db = require('../config/connection')
const { sendEmailOtp } = require('../controllers/emailControllers')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const bcrypt = require('bcrypt')
const moment = require('moment')
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_SERVICE_ID = process.env.TWILIO_SERVICE_ID
const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
const objectId = require('mongodb').ObjectID


module.exports = {

    test: (req, res) => {
    
        res.json({ message: "test request" })

    },

    //checkuser name available   this api take  username  on  req.body and 
    //return if user not exist  status code 200 and and usernameExist false  
    // if username already exist then return status code 400 usernameExist true

    checkUserName: async (req, res) => {
        const { username } = req.body

        try {

            let usernameExist = await db.get().collection(USER_COLLECTION).findOne({ username: username })

            if (usernameExist === null) {

                res.status(200).json({ usernameExist: false, message: "username can't exist" })

            } else {

                res.status(400).json({ usernameExist: true, message: "username can exist" })

            }
        }
        catch (err) {

            res.status(500).json({ err: err.message })

        }


    },
    // this api for signup . this api take email or phone  and name username password  on req.body object
    // if email send otp through nodemailer and if the phone send otp th rough twilio 
    // if success return statuscode  200  and satatus true

    Signup: async (req, res) => {
        console.log(1);

        const { email, password, name, username, phone } = req.body


        const date = moment().format();


        try {

            if (email !== undefined && phone === undefined) {
                let emailExist = await db.get().collection(USER_COLLECTION).findOne({ email: email })
                if (emailExist !== null && emailExist.emailVerified === true) return res.status(400).json({ message: "Email already exist" })
                const hashpassword = await bcrypt.hash(password, 10)
                if (emailExist !== null && emailExist.emailVerified === false) {
                    await db.get().collection(USER_COLLECTION).updateOne({ _id: emailExist._id }, { $set: { password: hashpassword, name, username } })
                } else {
                    await db.get().collection(USER_COLLECTION).insertOne({ email, password: hashpassword, date, name, username, emailVerified: false, isActive: true, followings: [], followers: [] })
                }


                const value = Math.floor(Math.random() * Math.pow(10, 4))

                let unix = new moment().valueOf();

                await db.get().collection(OTP_COLLECTION).deleteMany({ email: email })

                await db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });

                await db.get().collection(OTP_COLLECTION).insertOne({ value, email, createdAt: new Date() })

                let status = sendEmailOtp(email, value)

                res.status(200).json({ message: "Email Otp send", status })




            }


            if (email === undefined && phone !== undefined) {

                let phoneExist = await db.get().collection(USER_COLLECTION).findOne({ phone: phone })

                if (phoneExist !== null && phoneExist.phoneVerified === true) return res.status(400).json({ message: "phone number   already exist" })

                const hashpassword = await bcrypt.hash(password, 10)

                if (phoneExist !== null && phoneExist.phoneVerified === false) {

                    await db.get().collection(USER_COLLECTION).updateOne({ _id: phoneExist._id }, { $set: { password: hashpassword, name, username } })

                } else {

                    await db.get().collection(USER_COLLECTION).insertOne({ phone, password: hashpassword, date, name, username, phoneVerified: false, isActive: true })
                }

                twilioClient.verify
                    .services(TWILIO_SERVICE_ID)
                    .verifications.create({
                        to: `+91${phone}`,
                        channel: "sms"
                    }).then((response) => {

                        return res.status(200).json({ status: 'send' })
                    }).catch(() => {

                    })


            }


        } catch (err) {


            res.status(500).json({ err: err.message })

        }

    },

    
    login: async (req, res) => {

        const { email, password, username, phone } = req.body
        console.log(req.body.username);

        try {
            let user

            if (email) { user = await db.get().collection(USER_COLLECTION).findOne({ email: email }) }

            if (username) { user = await db.get().collection(USER_COLLECTION).findOne({ username: username }) }

            if (phone) { user = await db.get().collection(USER_COLLECTION).findOne({ phone: phone }) }

            if (user === null) return res.status(400).json({ message: "invalid username" })
            console.log(3);
            let isPasswordCorrect = await bcrypt.compare(password, user.password)
            console.log(4);
            if (!isPasswordCorrect) return res.status(400).json({ message: "invalid Password" })
            console.log(5);

            if (!user.isActive) return res.status(400).json({ message: "This Account was Blocked" })
            console.log(6);

            if (email) {

                if (!user.emailVerified) {

                    try {
                        const value = Math.floor(Math.random() * Math.pow(10, 6))

                        let unix = new moment().valueOf();

                        await db.get().collection(OTP_COLLECTION).deleteMany({ email: email })

                        await db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });


                        await db.get().collection(OTP_COLLECTION).insertOne({ value, email, createdAt: new Date() })

                        let status = sendEmailOtp(email, value)

                        res.status(200).json({ user, message: "email Otp send", status })



                    } catch (error) {

                        res.status(500).json({ error: error.message });

                    }



                } else {


                    let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                    return res.status(200).json({ user, token })

                }

            }

            if (phone) {

                if (!user.phoneVerified) {
                    try {
                        twilioClient.verify
                            .services(TWILIO_SERVICE_ID)
                            .verifications.create({
                                to: `+91${phone}`,
                                channel: "sms"
                            }).then((response) => {
                                res.status(200).json({ status: 'send' })
                            })

                    } catch (error) {

                        res.status(500).json({ error: error.message });


                    }


                } else {
                    console.log(8);


                    let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                    return res.status(200).json({ user, token })

                }


            }
            if (username) {

                if (user.phoneVerified || user.emailVerified) {

                    let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                    return res.status(200).json({ user, token })


                } else if (user.email) {

                    try {

                        email = user.email

                        const value = Math.floor(Math.random() * Math.pow(10, 6))

                        let unix = new moment().valueOf();

                        await db.get().collection(OTP_COLLECTION).deleteMany({ email: email })

                        await db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });


                        await db.get().collection(OTP_COLLECTION).insertOne({ value, email, createdAt: new Date() })

                        let status = sendEmailOtp(email, value)

                        res.status(200).json({ user, message: "otp send", status })

                    } catch (error) {

                        res.status(500).json({ error: error.message });

                    }



                } else if (user.phone) {

                    try {
                        twilioClient.verify
                            .services(TWILIO_SERVICE_ID)
                            .verifications.create({
                                to: `+91${phone}`,
                                channel: "sms"
                            }).then((response) => {
                                res.status(200).json({ status: 'send' })
                            })

                    } catch (error) {

                        res.status(500).json({ error: error.message });


                    }

                } else {

                    res.status(500).json({ error: "server error" });

                }



            }




            if (!user.emailVerified) {
                console.log(7);


                const value = Math.floor(Math.random() * Math.pow(10, 6))

                let unix = new moment().valueOf();

                await db.get().collection(OTP_COLLECTION).deleteMany({ email: email })

                await db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });


                await db.get().collection(OTP_COLLECTION).insertOne({ value, email, createdAt: new Date() })

                let status = sendEmailOtp(email, value)

                res.status(200).json({ user, message: "email send", status })


            } else {
                console.log(8);


                let token = await jwt.sign({ email: user.email, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                return res.status(200).json({ user, token })

            }


        } catch (err) {
            console.log(9);


            res.status(500).json({ err: err.message })

        }
    },

    

    sendEmailOtp: async (req, res) => {

        const emailto = req.body.email

        try {

            let emailExist = await db.get().collection(USER_COLLECTION).findOne({ email: email })
            console.log(emailExist);

            if (emailExist !== null) return res.status(400).json({ message: "Email id already exist" })


            const value = Math.floor(Math.random() * Math.pow(10, 6))

            let unix = new moment().valueOf();

            await db.get().collection(OTP_COLLECTION).remove({ emailto: emailto })

            await db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });


            await db.get().collection(OTP_COLLECTION).insertOne({ value, emailto, createdAt: new Date() })

            let status = sendEmailOtp(emailto, value)

            res.status(200).json({ message: "email send", status })

        } catch (err) {

            res.status(500).json({ err: err.message })

        }

    },


    varifyEmailOtp: async (req, res) => {
        const { email, otp } = req.body
        console.log(email, otp);

        try {
            console.log(">>>>>>>>1")

            const value = await db.get().collection(OTP_COLLECTION).findOne({ email: email })
            console.log(">>>>>>>>2")

            if (value === null) return res.status(400).json({ message: "invalid otp or otp expired " })
            console.log(">>>>>>>>3")

            if (value.value != otp) return res.status(400).json({ message: " otp can't match " })
            console.log(">>>>>>>>4")

            db.get().collection(OTP_COLLECTION).deleteOne({ _id: value._id }).then(() => {
                console.log(">>>>>>>>5")

                db.get().collection(USER_COLLECTION).updateOne({ email: email }, { $set: { emailVerified: true } }).then(async () => {

                    let user = await db.get().collection(USER_COLLECTION).findOne({ email: email })

                    let token = jwt.sign({ id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                    res.status(200).json({ user, token })


                }).catch((err) => {
                    console.log(">>>>>>>>8")

                    res.status(500).json({ err: err.message })

                })

                console.log(">>>>>>>>9")

            }).catch((err) => {
                console.log(">>>>>>>>10")

                res.status(500).json({ err: err.message })

            })



        } catch (err) {

            res.status(500).json({ err: err.message })

        }

    },


    sendMobileOtp: (phone) => {


        try {
            twilioClient.verify
                .services(TWILIO_SERVICE_ID)
                .verifications.create({
                    to: `+91${phone}`,
                    channel: "sms"
                }).then((response) => {
                    res.status(200).json({ status: 'send' })
                })

        } catch (error) {

            res.status(500).json({ error: error.message });


        }


    },
    verifyMobileOtp: (req, res) => {
        const { phone, otp } = req.body
        console.log("verify email otp", phone, otp);

        try {
            twilioClient.verify
                .services(TWILIO_SERVICE_ID)
                .verificationChecks
                .create({
                    to: `+91${phone}`,
                    code: otp
                }).then((data) => {
                    console.log(data);

                    if (data.status === "approved") {

                        db.get().collection(USER_COLLECTION).updateOne({ phone: phone }, { $set: { phoneVerified: true } }).then(async () => {

                            let user = await db.get().collection(USER_COLLECTION).findOne({ phone: phone })

                            let token = jwt.sign({ id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                            res.status(200).json({ user, token })


                        }).catch((err) => {
                            console.log(">>>>>>>>8")

                            res.status(500).json({ err: err.message })

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
    },
    getProfileDetails: async (req, res) => {
        console.log(1);
        const { userId } = req.body
        try {
            console.log(2);

            let user = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { "_id": objectId(userId) }
                }
            ]).toArray()


            let posts = await db.get().collection(POST_COLLECTION).aggregate([
                {
                    $match: { "userId": objectId(userId) },
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
                { $sort: { postedDate: -1 } }


            ]).toArray()


            res.status(200).json({ user, posts })






        } catch (error) {
            return res.status(500).json({ error: error.message });

        }

    },
    addAccountDetails: (req, res) => {
        const { userdata } = req.body
        console.log(userdata);
        try {
            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userdata._id) }, {
                $set: {
                    phone: userdata.phone,
                    address1: userdata.address1,
                    address2: userdata.address2,
                    hometown: userdata.hometown,
                    city: userdata.city,
                    state: userdata.state,
                    pincode: userdata.pincode,
                    highersecondary: userdata.highersecondary,
                    highschool: userdata.highschool,
                    qualification: userdata.qualification,
                    workingplace: userdata.workingplace,
                    college: userdata.college,
                    employstatus: userdata.employstatus

                }
            }).then((result) => {
                console.log(result);
                db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userdata._id) }).then((user) => {
                    res.status(200).json(user)
                }).catch((err) => {
                    res.status(500).json({ err })

                })


            }).catch(() => {
                return res.status(500).json({ error: error.message });

            })

        } catch (error) {

            return res.status(500).json({ error: error.message });

        }

    },
    DoSearch: async (req, res) => {

        const { keyword, userId } = req.body
        try {
            let user = await db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) })
            console.log(userId);
            let searchresult = await db.get().collection(USER_COLLECTION).aggregate([

                {
                    $match: { name: { $regex: `${keyword}`, $options: 'i' }, username: { $regex: `${keyword}`, $options: 'i' } }
                },

                {
                    $addFields: {
                        following: {
                            $cond: [
                                { $in: ["$_id", user.followings] },
                                true,
                                false
                            ]
                        }
                    }
                }


            ]).toArray()

           let users= searchresult.filter((item)=>{
              
                if(userId !== item._id+""){
                  
                    return item;
                }
            });

            
            res.status(200).json(users)

        } catch (error) {
            console.log(error);

        }

    },

    Dofollow: async (req, res) => {

        const { userId, currentuserId } = req.body
        console.log(req.body);


        try {


            const currentUser = await db.get().collection(USER_COLLECTION).findOne({ _id: objectId(currentuserId) })

            let followeExist = currentUser?.followings.findIndex((followings) => followings == userId)
            console.log(followeExist);
            if (followeExist === -1) {
                console.log("if");

                db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(currentuserId) }, { $push: { followings: objectId(userId) } }).then((data) => {

                    db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $push: { followers: objectId(currentuserId) } }).then(async() => {

                       let  NotificationExist=await db.get().collection(NOTIFICATIONS_COLLECTION).findOne({from: objectId(currentuserId),to: objectId(userId),type: "follow",})

                       if(NotificationExist) return  res.status(200).json({ follow: true })

                        db.get().collection(NOTIFICATIONS_COLLECTION).insertOne(
                            {
                                from: objectId(currentuserId),
                                to: objectId(userId),
                                type: "follow",
                                date: moment().format(),
                                read: false
                            }
                        ).then(()=>{

                            res.status(200).json({ follow: true })
                        })


                    }).catch((error) => {

                        console.log(error);
                        res.status(500).json({ message: error.message })

                    })

                }).catch((error) => {
                    console.log(error);

                    res.status(500).json({ message: error.message })
                })


            } else {
                console.log("here");

                await db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(currentuserId) }, { $pull: { followings: objectId(userId) } }).then(() => {


                    db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $pull: { followers: objectId(currentuserId) } }).then(() => {

                        res.status(200).json({ follow: false })
                    }).catch((error) => {

                        res.status(500).json({ message: error.message })
                    })
                }).catch((error) => {

                    res.status(500).json({ message: error.message })
                })


            }
            console.log("gjhgj");



        } catch (error) {
            console.log(error);
            res.status(500).json({ message: error.message })

        }

    },

    addProfilePhoto:(req,res)=>{
        console.log(req.body);
        const {profilePhoto,currentuserId}=req.body

        try {
            
            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(currentuserId) }, { $push: { ProfilePhotos: profilePhoto } }).then((data) => {
                console.log(data);

                db.get().collection(USER_COLLECTION).findOne({ _id: objectId(currentuserId) }).then((user)=>{

                    res.status(200).json({user, message:"profile photo updated"})

                })

            })

        } catch (error) {
            console.log(error);

            res.status(500).json({ message: error.message })

            
        }

    },
    addCoverPhoto:(req,res)=>{
        console.log(req.body);
        const {coverPhoto,currentuserId}=req.body

        try {
            
            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(currentuserId) }, { $set: { coverPhoto: coverPhoto } },{ upsert: true }  ).then((data) => {
                console.log(data);

                db.get().collection(USER_COLLECTION).findOne({ _id: objectId(currentuserId) }).then((user)=>{

                    res.status(200).json({user, message:"cover photo updated"})

                })

            })

        } catch (error) {
            console.log(error);

            res.status(500).json({ message: error.message })

            
        }

    },







}