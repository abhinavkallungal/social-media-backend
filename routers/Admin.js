const express =require('express')
const {login,getAllusers,deleteUser,edituser,addBanner,getAllBanners,deleteBanner} =require('../controllers/adminControllers')
const {verifyAdmin}= require('../middlewares/auth')

const router=express.Router()
const multer  = require('multer')
const upload = multer({ dest: 'uploads/' })





module.exports = {
     upload : multer({ dest: 'uploads/' })


}


router.post("/login",login)
router.get("/getAllUsers",verifyAdmin,getAllusers)
router.patch("/deleteUser",verifyAdmin,deleteUser)
router.patch("/edituser",verifyAdmin,edituser)

router.post("/addBanner",verifyAdmin,upload.array('files', 1),addBanner)
router.get("/getAllBanners",verifyAdmin,getAllBanners)
router.get("/deleteBanner/:id",verifyAdmin,deleteBanner)



module.exports=router