const express =require('express')

const {test,Signup, login,reSendEmailOtp,varifyEmailOtp,reSendMobileOtp,thirdPartyLogin,forgotPassword,forgotPasswordReset,Dofollow,addProfilePhoto,getFollowers,getFollowings,getSavedPosts,getTagedPost,resetPassword,
    addCoverPhoto,verifyMobileOtp,checkUserName,getProfileDetails,addAccountDetails,DoSearch,getUserDetailes} =require('../controllers/userControllers')
const {addPost,editPost,deletePost,getAllPosts,DoPostLike,DoPostSave,DoDeletepost,DoComment,DoReport,getFeedPosts,getFriends,getTagsDetailes,getPostComments,gteAllPostFiles} =require('../controllers/postControllers')
const {getAllNotification} =require('../controllers/notificationControllers')
const {sendMessage,getmessages} =require('../controllers/chatControllers')
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
router.post('/thirdPartyLogin',thirdPartyLogin)
router.post('/forgotPasswordRequest',forgotPassword)
router.post('/forgotPasswordReset',forgotPasswordReset)
router.post('/resetPassword',resetPassword)

router.get('/getFollowers/:id',verifyLogin,getFollowers)
router.get('/getFollowings/:id',verifyLogin,getFollowings)
router.get('/getSavedPosts/:id',verifyLogin,getSavedPosts)
router.get('/getTagedPost/:id',verifyLogin,getTagedPost)
router.get('/getAllPostFiles/:id',verifyLogin,gteAllPostFiles)



router.post("/getAllPost",verifyLogin,getFeedPosts)
router.get("/getposts/",getAllPosts)
router.patch("/editPost",verifyLogin,editPost)
//router.delete("/deletePost,",verifyLogin,deletePost)
router.get("/getProfileDetails/:userId",getProfileDetails)
router.post("/addAccountDetails",verifyLogin,addAccountDetails)
router.post("/addProfilePhoto",verifyLogin,addProfilePhoto)
router.post("/addCoverPhoto",verifyLogin,addCoverPhoto)


router.get("/search/:userId/:keyword",verifyLogin,DoSearch)
router.post("/follow",verifyLogin,Dofollow)
router.post("/addpost",verifyLogin,upload.array('files', 12),addPost)
router.get("/getFriends/:userId",verifyLogin,getFriends)

router.post("/postLike",verifyLogin,DoPostLike)
router.post("/getPostComments",verifyLogin,getPostComments)
router.post("/getTagsDetailes",verifyLogin,getTagsDetailes)
router.post("/postSave",verifyLogin,DoPostSave)
router.delete("/deletePost",verifyLogin,DoDeletepost)
router.post("/comment",verifyLogin,DoComment)
router.post("/report",verifyLogin,DoReport)

router.post('/getAllNotifications',verifyLogin,getAllNotification)

router.get('/getUserDetailes/:userId',verifyLogin,getUserDetailes)

//router.post('/sendMessage',sendMessage)
router.post('/getmessages',getmessages)







module.exports=router