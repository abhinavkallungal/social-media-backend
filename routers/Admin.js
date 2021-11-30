const express =require('express')
const {login,getAllusers,deleteUser,edituser} =require('../controllers/adminControllers')
const {verifyAdmin}= require('../middlewares/auth')



const router=express.Router()

router.post("/login",login)
router.get("/getAllUsers",verifyAdmin,getAllusers)
router.patch("/deleteUser",verifyAdmin,deleteUser)
router.patch("/edituser",verifyAdmin,edituser)




module.exports=router