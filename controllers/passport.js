const passport = require('passport')
const { passportEmailverify } = require('../middlewares/auth')
const jwt = require('jsonwebtoken')
const passportJWT =require('passport-jwt')
const { USER_COLLECTION } = require("../config/collections")
const db = require('../config/connection')
const ExtractJWT = passportJWT.ExtractJwt;


var GoogleStrategy = require('passport-google-oauth20').Strategy;
const JWTStrategy   = passportJWT.Strategy;

const GOOGLE_CLIENT_ID = "840612483361-sbo6qtclrijsd52dlo6hm2g0chdmjt5i.apps.googleusercontent.com"

const GOOGLE_CLIENT_SECRET = "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"

passport.use(new GoogleStrategy({
    clientID: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: "/auth/google/callback",
    profileFields: ['emails']
},
    function (accessToken, refreshToken, profile, done) {

        if (profile.emails[0].value) {

            const verifyEmail = async (email) => {

                try {

                    let user = await db.get().collection(USER_COLLECTION).findOne({ email: email })

                    if (!user) return done(null, false, {message: 'Incorrect email or password.'});


                    if (!user.isActive) return done(null, false, {message: 'Account is not activeted'});


                    return cb(null, user, { message: 'Logged In Successfully'});


                } catch (err) {

                    return done(err); 

                }
            }
            verifyEmail(profile.emails[0].value)

        }


    }
));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey   : 'secret'
},
function (jwtPayload, cb) {

    //find the user in db if needed
    return UserModel.findOneById(jwtPayload.id)
        .then(user => {
            return cb(null, user);
        })
        .catch(err => {
            return cb(err);
        });
}
));

passport.serializeUser((user, done) => {
    done(null, user)
})


passport.deserializeUser((user, done) => {
    done(null, user)
})
