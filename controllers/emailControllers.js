require('dotenv').config();

const nodemailer = require('nodemailer');

// Step 1
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user:  'oneskyine@gmail.com', 
        pass:  "Oneskyine123*"
    }
});


module.exports.sendEmailOtp=(emailto,otp)=>{

    try{

        let mailOptions = {
            from: 'oneskyine@gmail.com', 
            to: emailto, 
            subject: 'Nodemailer - Test',
            text: `Hello Abhinav Kallungal,
            
            ${otp}
            
            This is your One Time Password to login to the Vauld platform. If you did not request for this OTP, please reset your password and reach out to us.
            Best,
            The Vauld Team`
        };
        
        
        transporter.sendMail(mailOptions, (err, data) => {
            console.log(err,data);
            if (err) {
                return 'Error occurs'+err
            }
            return console.log( 'Email sent!!!')
        });


    }
    catch(err){
        return err
    }

}





