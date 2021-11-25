const express =require('express')

const {test,Signup, login,sendEmailOtp,varifyEmailOtp} =require('../controllers/userControllers')
const {addPost,editPost} =require('../controllers/postControllers')



const router=express.Router()

router.post('/',sendEmailOtp)
router.post('/signup',Signup)
router.post("/login",login)
router.post("/sendEmailOtp",sendEmailOtp)
router.post('/verifyEmailOtp',varifyEmailOtp)
router.post("/addpost",addPost)
router.patch("/editPost",editPost)



module.exports=router