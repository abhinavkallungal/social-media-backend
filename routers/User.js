const express =require('express')

const {test,Signup, login,sendEmailOtp,varifyEmailOtp,sendMobileOtp,Dofollow,
    verifyMobileOtp,checkUserName,getProfileDetails,addAccountDetails,DoSearch} =require('../controllers/userControllers')
const {addPost,editPost,deletePost,getAllPosts} =require('../controllers/postControllers')
const {verifyLogin}= require('../middlewares/auth')



const router=express.Router()

router.get('/',test)


router.post('/',sendEmailOtp)
//api for check username available for signup 
router.post('/checkUserName',checkUserName)
//api for signup 
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
router.post("/getProfileDetalils",verifyLogin,getProfileDetails)
router.post("/addAccountDetails",verifyLogin,addAccountDetails)


router.post("/search",verifyLogin,DoSearch)
router.post("/follow",verifyLogin,Dofollow)







module.exports=router