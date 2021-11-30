const express =require('express')

const {test,Signup, login,sendEmailOtp,varifyEmailOtp,sendMobileOtp,verifyMobileOtp,checkUserName} =require('../controllers/userControllers')
const {addPost,editPost,deletePost,getAllPosts} =require('../controllers/postControllers')
const {verifyLogin}= require('../middlewares/auth')



const router=express.Router()

router.post('/',sendEmailOtp)
router.post('/checkUserName',checkUserName)
router.post('/signup',Signup)
router.post("/login",login)
router.post("/sendEmailOtp",sendEmailOtp)
router.post('/verifyEmailOtp',varifyEmailOtp)
router.post("/sendMobileOtp",sendMobileOtp)
router.post("/verifyMobileOtp",verifyMobileOtp)
router.post("/addpost",verifyLogin,addPost)
router.get("/getAllPost",verifyLogin,getAllPosts)
router.patch("/editPost",editPost)
router.delete("/deletePost,",deletePost)



module.exports=router