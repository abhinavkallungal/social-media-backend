
const express = require('express');
const router = express.Router();

const jwt = require('jsonwebtoken');
const passport = require('passport');

router.get('/login/success', (req, res) => {
    console.log(">>>>>>>>>>>>>>>>>>>>>>",req);
    if (req.user) {
        res.redirect('/').json({
            success: true,
            message: "successfull",
            user: req.user,
            cookies: req.cookies
        })

    }
})

router.get('/login/failed', (req, res) => {

    res.status(401).json({
        success: false,
        message: "failed",

    })
})





router.get('/google', passport.authenticate('google', {  scope:['email']}));

router.get('/google/callback', passport.authenticate('google', { successRedirect:"http://localhost:3000/login/success" ,failureRedirect: '/login/failed' }));


module.exports = router;