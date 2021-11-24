const {USER_COLLECTION} =require("../config/collections")
const db =require('../config/connection')
const jwt =require('jsonwebtoken')
const bcrypt =require('bcrypt')


module.exports={

    test:(req,res)=>{

        res.json({message:"test request"})

    },



}