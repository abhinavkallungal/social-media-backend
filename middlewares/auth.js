
 const jwt =require('jsonwebtoken')
 const jwtDecode=require("jwt-decode")
const { ObjectID } = require('mongodb')
 const { USER_COLLECTION } = require("../config/collections")
const db = require('../config/connection')

module.exports={
    verifyLogin:(req,res,next)=>{
        if(req.headers.authorization){

            jwt.verify(req.headers.authorization, 'secret', (err, authorizedData) => {
                if(err){
                    console.log('ERROR: Could not connect to the protected route');
                    
                    res.status(403).json({ error: err })


                } else {

                    const decoded=jwtDecode(req.headers.authorization)
                    console.log(decoded.id)
                    db.get().collection(USER_COLLECTION).findOne({"_id":ObjectID(decoded.id)}).then((user)=>{
                        if(user && user.isActive){
                       
                            next()
    
                        }else{
    
                            res.status(403).json({ error: "This Account Was Bloked" })
    
    
                        }

                    })
                    
                    
                    



                }
            })

        }else{
            console.log("dfads");
            res.status(403).json({ error: "no token availabel" })

        }

    },

    verifyAdmin:(req,res,next)=>{
        if(req.headers.authorization){

            jwt.verify(req.headers.authorization, 'AdminSecret', (err, authorizedData) => {
                if(err){
                    console.log('ERROR: Could not connect to the protected route');
                    
                    res.status(403).json({ error: err })


                } else {

                    next()
                }
            })

        }else{
            console.log("dfads");
            res.status(403).json({ error: "no token availabel" })

        }

    }


}