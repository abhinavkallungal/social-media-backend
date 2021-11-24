const express =require('express')

const {test,Signup, login,sendEmailOtp,varifyEmailOtp} =require('../controllers/userControllers')


const router=express.Router()

router.post('/',sendEmailOtp)
router.post('/signup',Signup)
router.post("/login",login)
router.post("/sendEmailOtp",sendEmailOtp)
router.post('/verifyEmailOtp',varifyEmailOtp)




module.exports=router