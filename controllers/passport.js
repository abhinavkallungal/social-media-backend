var passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const { USER_COLLECTION, OTP_COLLECTION, POST_COLLECTION } = require("../config/collections")
const db = require('../config/connection')

passport.serializeUser(function(user, done) {
  console.log("serializeUser");
	done(null, user);
});

passport.deserializeUser(function(user, done) {
  console.log("deserializeUser");

	done(null, user);
});


const GOOGLE_CLIENT_ID = "840612483361-uh8355gngtkol7499l5gsnatkdn85s3g.apps.googleusercontent.com"

const GOOGLE_CLIENT_SECRET = "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"


passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log(profile.emails[0].value)
    
    db.get().collection(USER_COLLECTION).findOne({email:profile.emails[0].value}).then((user)=>{
      console.log(">>>>",user);

      done(null,user)

    }).catch((err)=>{
      done(null,err)

    })


   
  }
));
















