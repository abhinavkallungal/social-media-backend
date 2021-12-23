const express =require('express')

const {test,Signup, login,sendEmailOtp,varifyEmailOtp,sendMobileOtp,googleLoginVeryfication,forgotPassword,forgotPasswordReset,Dofollow,addProfilePhoto,
    addCoverPhoto,verifyMobileOtp,checkUserName,getProfileDetails,addAccountDetails,DoSearch} =require('../controllers/userControllers')
const {addPost,editPost,deletePost,getAllPosts,DoPostLike,DoPostSave,DoDeletepost,DoComment,DoReport,getFeedPosts} =require('../controllers/postControllers')
const {getAllNotification} =require('../controllers/notificationControllers')
const {verifyLogin}= require('../middlewares/auth')

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })





module.exports = {
     upload : multer({ dest: 'uploads/' })


  

}


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
router.post('/googleLogin',googleLoginVeryfication)
router.post('/forgotPasswordRequest',forgotPassword)
router.post('/forgotPasswordReset',forgotPasswordReset)



router.post("/addpost",verifyLogin,upload.array('files', 12),addPost)
router.get("/getAllPost",verifyLogin,getAllPosts)
router.patch("/editPost",editPost)
router.delete("/deletePost,",deletePost)
router.post("/getProfileDetalils",verifyLogin,getProfileDetails)
router.post("/addAccountDetails",verifyLogin,addAccountDetails)
router.post("/addProfilePhoto",verifyLogin,addProfilePhoto)
router.post("/addCoverPhoto",verifyLogin,addCoverPhoto)


router.post("/search",verifyLogin,DoSearch)
router.post("/follow",verifyLogin,Dofollow)
router.post("/postLike",verifyLogin,DoPostLike)
router.post("/postSave",verifyLogin,DoPostSave)
router.post("/Deletepost",verifyLogin,DoDeletepost)
router.post("/comment",verifyLogin,DoComment)
router.post("/report",verifyLogin,DoReport)

router.post('/getAllNotifications',verifyLogin,getAllNotification)







module.exports=router