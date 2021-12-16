var passport = require("passport");
var GoogleStrategy = require('passport-google-oauth20').Strategy;
const { USER_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
require('dotenv').config()

passport.serializeUser(function(user, done) {
  console.log("serializeUser");
	done(null, user);
});

passport.deserializeUser(function(user, done) {
  console.log("deserializeUser");

	done(null, user);
});


const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET


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
      done(nullerr)

    })


   
  }
));
















