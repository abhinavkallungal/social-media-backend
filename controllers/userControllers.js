const { USER_COLLECTION, OTP_COLLECTION, POST_COLLECTION, NOTIFICATIONS_COLLECTION, TOKEN_COLLECTION, BANNER_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
const { sendEmailOtp, sendPasswordResetLink } = require('../controllers/emailControllers')
const jwt = require('jsonwebtoken')
require('dotenv').config()
const bcrypt = require('bcrypt')
const moment = require('moment')
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN
const TWILIO_SERVICE_ID = process.env.TWILIO_SERVICE_ID
const twilioClient = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
const objectId = require('mongodb').ObjectID
const crypto = require("crypto")
const { existsSync } = require("fs")
const { ObjectId } = require("mongodb")
 

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

                res.status(200).json({ usernameExist: true, message: "username can exist" })

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
                    }).catch((error) => {
                        return res.status(400).json({ status: 'error' })

                    })


            }


        } catch (err) {


            res.status(500).json({ err: err.message })

        }

    },


    login: async (req, res) => {

        const { email, password, username, phone } = req.body


        try {
            let user

            if (email) { user = await db.get().collection(USER_COLLECTION).findOne({ email: email }) }

            if (username) { user = await db.get().collection(USER_COLLECTION).findOne({ username: username }) }

            if (phone) { user = await db.get().collection(USER_COLLECTION).findOne({ phone: phone }) }

            if (user === null) return res.status(400).json({ message: "invalid username" })

            let isPasswordCorrect = await bcrypt.compare(password, user.password)

            if (!isPasswordCorrect) return res.status(400).json({ message: "invalid Password" })

            if (!user.isActive) return res.status(400).json({ message: "This Account was Blocked" })


            const unReadNotifications = await db.get().collection(NOTIFICATIONS_COLLECTION).find({
                $and: [
                    { to: objectId(user._id) },
                    { read: false }
                ]
            }).toArray()


            let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

            if (email) {

                if (!user.emailVerified) {

                    res.status(401).json({ message: "Email not Exist" })

                } else {



                    return res.status(200).json({ user, token, unReadNotificationsCount: unReadNotifications.length })

                }

            }

            if (phone) {

                if (!user.phoneVerified) {

                    res.status(401).json({ message: "Email not Exist" })

                } else {


                    let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                    return res.status(200).json({ user, token, unReadNotificationsCount: unReadNotifications.length })

                }


            }
            if (username) {

                if (user.phoneVerified || user.emailVerified) {

                    let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

                    return res.status(200).json({ user, token, unReadNotificationsCount: unReadNotifications.length })


                } else {
                    res.status(401).json({ message: "Email not Exist" })

                }



            }




        } catch (err) {
            console.log(err);

            res.status(500).json({ err: err.message })

        }
    },



    reSendEmailOtp: async (req, res) => {

        const emailto = req.body.email
        console.log(emailto);

        try {

            let emailExist = await db.get().collection(USER_COLLECTION).findOne({ email: emailto })
            console.log(emailExist);
            if (emailExist !== null && emailExist?.emailVerified) return res.status(400).json({ message: "Email id already exist" })


            const value = Math.floor(Math.random() * Math.pow(10, 6))

            let unix = new moment().valueOf();

            await db.get().collection(OTP_COLLECTION).remove({ emailto: emailto })

            await db.get().collection(OTP_COLLECTION).createIndex({ createdAt: unix }, { expireAfterSeconds: 300 });


            await db.get().collection(OTP_COLLECTION).insertOne({ value, emailto, createdAt: new Date() })

            let status = sendEmailOtp(emailto, value)

            res.status(200).json({ message: "email send", status })

        } catch (err) {
            console.log(err);
            res.status(500).json({ err: err.message })

        }

    },


    varifyEmailOtp: async (req, res) => {
        const { email, otp } = req.body

        try {


            const value = await db.get().collection(OTP_COLLECTION).findOne({ email: email })


            if (value === null) return res.status(400).json({ message: "invalid otp or otp expired " })

            if (value.value != otp) return res.status(400).json({ message: " invalid OTP " })


            db.get().collection(OTP_COLLECTION).deleteOne({ _id: value._id }).then(() => {


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


    reSendMobileOtp: ({ phone }) => {


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

    forgotPassword: async (req, res) => {
        const { email, phone } = req.body
        const clientURL = 'http://localhost:3000'

        if (email !== undefined) {
            const user = await db.get().collection(USER_COLLECTION).findOne({ email: email })

            if (user === null || user.emailVerified === false) return res.status(401).json({ message: "invalid credentials " })

            let resetToken = crypto.randomBytes(32).toString("hex");

            const hash = await bcrypt.hash(resetToken, 12);

            await db.get().collection(TOKEN_COLLECTION).insertOne({ userId: user._id, token: hash, createdAt: Date.now() })

            const link = `${clientURL}/passwordReset?token=${resetToken}&id=${user._id}`;


            let status = sendPasswordResetLink({ emailto: user.email, link, name: user.name })


            res.status(200).json({ message: " Link send in to Your email ", status, sendTo: email })


        } else if (phone !== undefined) {
            const user = await db.get().collection(USER_COLLECTION).findOne({ phone: phone })

            if (user === null || user.phoneVerified !== true) return res.status(401).json({ message: "invalid credentials " })

            let resetToken = crypto.randomBytes(32).toString("hex");

            const hash = await bcrypt.hash(resetToken, 12);

            await db.get().collection(TOKEN_COLLECTION).insertOne({ userId: user._id, token: hash, createdAt: Date.now() })

            const link = `${clientURL}/passwordReset?token=${resetToken}&id=${user._id}`;






            twilioClient.messages
                .create({
                    to: `+91${phone}`,
                    from: '+17622525473',
                    body: ` Hello ${user.name},Don't worry, we got you! Click the link below to reset your password.  ${link}`,
                })
                .then(message => console.log(message.sid)).catch(err => console.log(err))


            res.status(200).json({ message: " Link send in to Your email " })


        }


        else {
            res.status(500).json({ message: "server Error" })
        }

    },

    forgotPasswordReset: async (req, res) => {
        const { password, ConfirmPassword, userId, Token } = req.body
        console.log(req.body);
        try {

            if (password === undefined || ConfirmPassword === undefined || userId === undefined || Token === undefined) return res.status(400).json({ message: "invalid data" })

            if (password !== ConfirmPassword) return res.status(400).json({ message: "Passwords are Not Match" })

            TokenExist = await db.get().collection(TOKEN_COLLECTION).findOne({ userId: objectId(userId) })

            if (!TokenExist) return res.status(400).json({ message: "Invalid Token" })

            let isTokenCorrect = await bcrypt.compare(Token, TokenExist.token)

            if (!isTokenCorrect) return res.status(400).json({ message: "Invalid Token" })



            if (password !== undefined) {

                const hashpassword = await bcrypt.hash(password, 10)


                await db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { password: hashpassword } })


                await db.get().collection(TOKEN_COLLECTION).deleteOne({ userId: objectId(userId) })


                res.status(200).json({ message: " Password Updated" })


            } else {
                console.log("dfaaaaaaa");
                res.status(500).json({ message: "server Error" })
            }


        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "server Error" })

        }


    },

    resetPassword: async (req, res) => {

        const { oldPassword, newPassword, confirmPassword, userId } = req.body
        console.log(req.body);

        try {

            const user = await db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) })

            console.log(user);

            if (!user) return res.status(400).json({ message: "User Can't Exist" })

            let isPasswordCorrect = await bcrypt.compare(oldPassword, user.password)

            console.log(isPasswordCorrect);

            if (!isPasswordCorrect) return res.status(400).json({ message: "Your Old Password Is incorrect" })

            if (newPassword !== confirmPassword) return res.status(400).json({ message: "Your new Password Don,t match" })

            const hashpassword = await bcrypt.hash(newPassword, 10)


            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: { password: hashpassword } }).then(() => {
                res.status(200).json({ message: 'Your Password Reset Successfully' })
            })
                .catch((err) => {
                    res.status(400).json({ message: RegExp.message })
                })


        } catch (error) {

            res.status(500).json({ message: error.message })

        }

    },

    thirdPartyLogin: async (req, res) => {
        const { email } = req.body

        const user = await db.get().collection(USER_COLLECTION).findOne({ email })

        if (!user?.isActive) return res.status(400).json({ message: "This Account was Blocked" })

        if (user) {



            const unReadNotifications = await db.get().collection(NOTIFICATIONS_COLLECTION).find({
                $and: [
                    { to: objectId(user._id) },
                    { read: false }
                ]
            }).toArray()


            let token = await jwt.sign({ username: user.username, id: user._id, isUser: true }, "secret", { expiresIn: "1h" })

            return res.status(200).json({ user, token, unReadNotificationsCount: unReadNotifications.length })
        } else {
            return res.status(401).json({ message: "user Can't Exist" })
        }



    },


    getProfileDetails: async (req, res) => {

        const { userId } = req.params
        try {

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
                {

                    $project: {
                        _id: 1,
                        desc: 1,
                        files: 1,
                        location: 1,
                        tag: 1,
                        Accessibility: 1,
                        likes: 1,
                        comments: 1,
                        status: 1,
                        report: 1,
                        postedDate: 1,
                        userId: 1,
                        video: 1,
                        user: {
                            _id: 1,
                            name: 1,
                            ProfilePhotos: { $last: "$user.ProfilePhotos" }
                        }

                    }

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

    AddSocialAccount: (req, res) => {

        const { socialAccounts, userId } = req.body
        console.log(socialAccounts, userId);

        if (userId === undefined) return res.status(401).json({ message: "id is undefiend" })


        try {
            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $set: socialAccounts }, { upsert: true }).then((result) => {
                console.log(result);
                db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) }).then((user) => {
                    res.status(200).json(user)
                }).catch((err) => {
                    res.status(500).json({ err })

                })


            }).catch((error) => {
                return res.status(500).json({ error: error.message });

            })

        } catch (error) {


            console.log(error);

            return res.status(500).json({ error: error.message });

        }

    },

    getSocialAccounts: async (req, res) => {

        const userId = req.params.userId

        console.log(userId);

        if (userId === undefined) return res.status(401).json({ message: "id is undefiend" })


        try {

            const socialAccounts = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $project: {
                        _id: 0,
                        Facebook: 1,
                        Twitter: 1,
                        LinkedIn: 1,
                        Instagram: 1

                    }
                }
            ]).toArray()

            console.log(socialAccounts);

            res.status(200).json({ socialAccounts })



        } catch (error) {

            console.log(error);

            res.status(500).json({ message: "" })

        }
    },


    DoSearch: async (req, res) => {

        const { keyword, userId } = req.params
        try {
            let user = await db.get().collection(USER_COLLECTION).findOne({ _id: objectId(userId) })
            console.log(userId);
            let searchresult = await db.get().collection(USER_COLLECTION).aggregate([

                {
                    $match: {
                        $and: [{
                            $or: [{
                                name: { $regex: `${keyword}`, $options: 'i' },
                            }, {

                                username: { $regex: `${keyword}`, $options: 'i' },
                            }
                            ]
                        }, {

                            $or: [{
                                phoneVerified: true
                            }, {

                                emailVerified: true
                            }
                            ]
                        }


                        ]


                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        followings: 1,
                        username: 1,
                        ProfilePhotos: { $last: "$ProfilePhotos" }


                    }

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
                },



            ]).toArray()

            console.log(searchresult);

            let users = searchresult.filter((item) => {

                if (userId !== item._id + "") {

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

                    db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(userId) }, { $push: { followers: objectId(currentuserId) } }).then(async () => {

                        let NotificationExist = await db.get().collection(NOTIFICATIONS_COLLECTION).findOne({ from: objectId(currentuserId), to: objectId(userId), type: "follow", })

                        if (NotificationExist) return res.status(200).json({ follow: true })

                        db.get().collection(NOTIFICATIONS_COLLECTION).insertOne(
                            {
                                from: objectId(currentuserId),
                                to: objectId(userId),
                                type: "follow",
                                date: moment().format(),
                                read: false
                            }
                        ).then(() => {

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

    getFollowRequest: async (req, res) => {

        let userId = req.params.userId.trim()

        try {



            console.log(userId);
            if (userId === null || userId === undefined) return res.status(401).json({ message: "userid is null " })

            let followRequest = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { "_id": ObjectId(userId) },
                },
                {
                    $project:
                        { users: { $setDifference: ["$followers", "$followings"] }, _id: 0 }
                },
                {
                    $unwind: "$users"
                },
                {
                    $lookup: {
                        from: USER_COLLECTION,
                        localField: "users",
                        foreignField: '_id',
                        as: "user"
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $project: {
                        _id: "$user._id",
                        name: "$user.name",
                        ProfilePhotos: { $last: "$user.ProfilePhotos" }
                    }
                }


            ]).toArray()

            console.log(followRequest);

            res.status(200).json({ followRequest })


        } catch (error) {
            console.log(error);

            res.status(500).json({ error })


        }

    },

    addProfilePhoto: (req, res) => {
        console.log(req.body);
        const { profilePhoto, currentuserId } = req.body

        try {

            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(currentuserId) }, { $push: { ProfilePhotos: profilePhoto } }).then((data) => {
                console.log(data);

                db.get().collection(USER_COLLECTION).findOne({ _id: objectId(currentuserId) }).then((user) => {

                    res.status(200).json({ user, message: "profile photo updated" })

                })

            })

        } catch (error) {
            console.log(error);

            res.status(500).json({ message: error.message })


        }

    },
    addCoverPhoto: (req, res) => {
        console.log(req.body);
        const { coverPhoto, currentuserId } = req.body

        try {

            db.get().collection(USER_COLLECTION).updateOne({ _id: objectId(currentuserId) }, { $set: { coverPhoto: coverPhoto } }, { upsert: true }).then((data) => {
                console.log(data);

                db.get().collection(USER_COLLECTION).findOne({ _id: objectId(currentuserId) }).then((user) => {

                    res.status(200).json({ user, message: "cover photo updated" })

                })

            })

        } catch (error) {
            console.log(error);

            res.status(500).json({ message: error.message })


        }

    },

    getFollowers: async (req, res) => {
        const userId = req.params.id

        try {

            const followers = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $unwind: "$followers"
                },
                {
                    $lookup: {
                        from: USER_COLLECTION,
                        foreignField: "_id",
                        localField: "followers",
                        as: "users"

                    }
                },

                {
                    $unwind: "$users"
                },
                {
                    $project: {
                        _id: "$users._id",
                        name: "$users.name",
                        username: "$users.username",
                        ProfilePhotos: { $last: "$users.ProfilePhotos" }

                    }
                }

            ]).toArray()

            res.status(200).json({ followers })


        } catch (error) {
            res.status(500).json({ message: error.message })

        }

    },

    getFollowings: async (req, res) => {
        const userId = req.params.id

        try {

            const followings = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },

                {
                    $lookup: {
                        from: USER_COLLECTION,
                        foreignField: "_id",
                        localField: "followings",
                        as: "users"

                    }
                },
                {
                    $unwind: "$users"
                },
                {
                    $project: {
                        _id: "$users._id",
                        name: "$users.name",
                        username: "$users.username",
                        ProfilePhotos: { $last: "$users.ProfilePhotos" }

                    }
                }

            ]).toArray()

            console.log(followings);


            res.status(200).json({ followings })


        } catch (error) {
            res.status(500).json({ message: error.message })


        }

    },

    getSavedPosts: async (req, res) => {
        const userId = req.params.id

        try {

            const SavedPosts = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $unwind: "$SavedPost"
                },
                {
                    $lookup: {
                        from: POST_COLLECTION,
                        localField: "SavedPost",
                        foreignField: "_id",
                        as: "SavedPost"

                    }
                },
                {
                    $unwind: "$SavedPost"
                },
                {
                    $project: {
                        _id: "$SavedPost._id",
                        desc: "$SavedPost.desc",
                        files: "$SavedPost.files",
                        location: "$SavedPost.location",
                        tag: "$SavedPost.tag",
                        Accessibility: "$SavedPost.Accessibility",
                        likes: "$SavedPost.likes",
                        comments: "$SavedPost.comments",
                        userId: "$SavedPost.userId",
                        status: "$SavedPost.status",
                        report: "$SavedPost.report",
                        postedDate: "$SavedPost.postedDate"
                    }
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
                    $unwind: "$user"
                },
                {
                    $project: {
                        _id: 1,
                        desc: 1,
                        files: 1,
                        location: 1,
                        tag: 1,
                        Accessibility: 1,
                        likes: 1,
                        comments: 1,
                        userId: 1,
                        status: 1,
                        report: 1,
                        postedDate: 1,
                        user: {
                            _id: 1,
                            name: 1,
                            ProfilePhotos: { $last: "$user.ProfilePhotos" }
                        }

                    }

                },
                { $sort: { date: -1 } },




            ]).toArray()

            res.status(200).json({ SavedPosts })

        } catch (error) {
            res.status(500).json({ message: error.message })


        }

    },

    getTagedPost: async (req, res) => {
        const userId = req.params.id

        try {

            const TagedPost = await db.get().collection(POST_COLLECTION).aggregate([
                {
                    $match: { status: "active" }
                },
                {
                    $unwind: "$tag"
                },
                {
                    $match: { 'tag._id': userId }
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
                    $unwind: "$user"
                },
                {
                    $project: {
                        _id: 1,
                        desc: 1,
                        files: 1,
                        location: 1,
                        tag: 1,
                        Accessibility: 1,
                        likes: 1,
                        comments: 1,
                        userId: 1,
                        status: 1,
                        report: 1,
                        postedDate: 1,
                        user: {
                            _id: 1,
                            name: 1,
                            ProfilePhotos: { $last: "$user.ProfilePhotos" }
                        }

                    }

                },
                { $sort: { date: -1 } },

            ]).toArray()

            res.status(200).json({ TagedPost })



        } catch (error) {

        }
    },


    getUserDetailes: async (req, res) => {

        const { userId } = req.params

        try {

            let user = await db.get().collection(USER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(userId) }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        username: 1,
                        ProfilePhotos: { $last: "$ProfilePhotos" }

                    }
                }
            ]).toArray()




            res.status(200).json({ user })

        } catch (error) {

            res.status(500).json({ message: error.message })


        }

    },

    getBanner:async (req, res) => {
        try {
            console.log("getBanner");
            let banners = await db.get().collection(BANNER_COLLECTION).aggregate([
                {
                    $match: { expireAt: { $gte : new Date()}   }
                }
            ]).toArray()


            let length= banners.length

            let random = Math.floor( Math.random() * (length - 1) + 0)

      

        let banner= banners[random]


            res.status(200).json(banner)


        } catch (error) {

            res.status(500).json({ message: error.message })


        }
    }








}