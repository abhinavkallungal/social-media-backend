const {USER_COLLECTION,OTP_COLLECTION,POST_COLLECTION} =require("../config/collections")
const db =require('../config/connection')
const {sendEmailOtp} =require('../controllers/emailControllers')
const jwt =require('jsonwebtoken')
const bcrypt =require('bcrypt')
const moment =require('moment')
const objectId=require('mongodb').ObjectID



module.exports={

    test:(req,res)=>{
        const value=Math.floor(Math.random() * Math.pow(10, 6))

        let unix =  moment().valueOf();

        db.get().collection(OTP_COLLECTION).createIndex({createdAt: unix}, {expireAfterSeconds: 10});

        sendEmailOtp("abhinavkallungal15@gmail.com",value)

        db.get().collection(OTP_COLLECTION).insertOne({value,createdAt:unix})

        res.json({message:"test request"})

    },
    
    Signup:async(req,res)=>{

        const {email,password}=req.body

       
        const date=moment().format();                     



        try{
            
            let emailExist= await db.get().collection(USER_COLLECTION).findOne({email:email})
            console.log(emailExist);

            if(emailExist  !== null) return res.status(400).json({message:"user already exist"})

            const hashpassword =await bcrypt.hash(password,10)

            let result= await db.get().collection(USER_COLLECTION).insertOne({email,password:hashpassword,date})

            let user = await db.get().collection(USER_COLLECTION).findOne({_id:result.insertedId})

            let token = jwt.sign({email:user.email,id:user._id},"secret",{expiresIn:"1h"})

            res.status(200).json({user,token})


        }catch(err){
            

            res.status(500).json({err:err.message})

        }
  
    },
    login:async(req,res)=>{

        const {email,password}=req.body

        try{

            let user =await db.get().collection(USER_COLLECTION).findOne({email})

            if(user===null) return res.status(400).json({message:"invalid username"})

            let  isPasswordCorrect =await bcrypt.compare(password,user.password)

            if(!isPasswordCorrect) return res.status(400).json({message:"invalid Password"})

            let token = await jwt.sign({email:user.email,id:user._id},"secret",{expiresIn:"1h"})

            return res.status(200).json({user,token})
           



        }catch(err){

            res.status(500).json({err:err.message})

        }
    },

    sendEmailOtp:(req,res)=>{

        const emailto=req.body.emailto

        try{

            const value=Math.floor(Math.random() * Math.pow(10, 6))
            
            let unix = new moment().valueOf();

            db.get().collection(OTP_COLLECTION).remove({emailto:emailto})
            
            db.get().collection(OTP_COLLECTION).createIndex({createdAt: unix}, {expireAfterSeconds: 300});
            
            
            db.get().collection(OTP_COLLECTION).insertOne({value,emailto,createdAt:new Date()})
            
            let status=sendEmailOtp(emailto,value)
            
            console.log("status",status);
            
            res.json({message:"test request"})
        }catch(err){

            res.status(500).json({err:err.message})

        }

    },


    varifyEmailOtp:async(req,res)=>{
        const {emailto,otp}=req.body
        console.log(emailto,otp);

        try {

            const value = await db.get().collection(OTP_COLLECTION).findOne({emailto:emailto})
            
            if(value===null) return res.status(400).json({message:"invalid otp pr otp expired "})

            if(value.value!==otp) return res.status(400).json({message:" otp can't match "})


            return res.status(200).json({message:"otp varified"})



        } catch (err) {

            res.status(500).json({err:err.message})

        }

    }



    


}