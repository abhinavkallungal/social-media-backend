const express =require('express')

const {test,Signup, login,reSendEmailOtp,varifyEmailOtp,reSendMobileOtp,googleLoginVeryfication,forgotPassword,forgotPasswordReset,Dofollow,addProfilePhoto,
    addCoverPhoto,verifyMobileOtp,checkUserName,getProfileDetails,addAccountDetails,DoSearch} =require('../controllers/userControllers')
const {addPost,editPost,deletePost,getAllPosts,DoPostLike,DoPostSave,DoDeletepost,DoComment,DoReport,getFeedPosts,getFriendsForTag,getTagsDetailes,getPostComments} =require('../controllers/postControllers')
const {getAllNotification} =require('../controllers/notificationControllers')
const {verifyLogin}= require('../middlewares/auth')

const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })





module.exports = {
     upload : multer({ dest: 'uploads/' })


  

}


const router=express.Router()

router.get('/',test)



//api for check username available for signup 
router.post('/checkUserName',checkUserName)
//api for signup 
router.post('/signup',Signup)
router.post("/login",login)
router.post("/reSendEmailOtp",reSendEmailOtp)
router.post('/verifyEmailOtp',varifyEmailOtp)
router.post("/reSendMobileOtp",reSendMobileOtp)
router.post("/verifyMobileOtp",verifyMobileOtp)
router.post('/googleLogin',googleLoginVeryfication)
router.post('/forgotPasswordRequest',forgotPassword)
router.post('/forgotPasswordReset',forgotPasswordReset)



router.post("/getAllPost",verifyLogin,getFeedPosts)
router.patch("/editPost",editPost)
router.delete("/deletePost,",deletePost)
router.post("/getProfileDetalils",verifyLogin,getProfileDetails)
router.post("/addAccountDetails",verifyLogin,addAccountDetails)
router.post("/addProfilePhoto",verifyLogin,addProfilePhoto)
router.post("/addCoverPhoto",verifyLogin,addCoverPhoto)


router.post("/search",verifyLogin,DoSearch)
router.post("/follow",verifyLogin,Dofollow)
router.post("/addpost",verifyLogin,upload.array('files', 12),addPost)
router.post("/getFriendsForTag",verifyLogin,getFriendsForTag)

router.post("/postLike",verifyLogin,DoPostLike)
router.post("/getPostComments",verifyLogin,getPostComments)
router.post("/getTagsDetailes",verifyLogin,getTagsDetailes)
router.post("/postSave",verifyLogin,DoPostSave)
router.post("/Deletepost",verifyLogin,DoDeletepost)
router.post("/comment",verifyLogin,DoComment)
router.post("/report",verifyLogin,DoReport)

router.post('/getAllNotifications',verifyLogin,getAllNotification)







module.exports=router