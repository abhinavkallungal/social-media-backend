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


    
    console.log("Email", 1);

    try{
        console.log("Email", 2);


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
        console.log("Email", 3);

        
        
        transporter.sendMail(mailOptions, (err, data) => {
            console.log("Email", 4);

            console.log(err,data);
            if (err) {
                console.log("Email", 5);

                return 'Error occurs'+err
            }
            console.log("Email", 6);

            return console.log( 'Email sent!!!')
        });


    }
    catch(err){
        console.log("Email err", 7);

        return err
    }

}


module.exports.sendPasswordResetLink=({emailto,link,name})=>{


    

    try{
        console.log("Email", 2,emailto,link,name);


        let mailOptions = {
            from: 'oneskyine@gmail.com', 
            to: emailto, 
            subject: 'Reset Password',
            text: `Hello ${name},
            
            
            Don't worry, we got you!

            Click the link below to reset your password.  
            
            
            ${link}`
        };
        console.log("Email", 3);

        
        
        transporter.sendMail(mailOptions, (err, data) => {
            console.log("Email", 4);

            console.log(err,data);
            if (err) {
                console.log("Email", 5);

                return 'Error occurs'+err
            }
            console.log("Email", 6);

            return console.log( 'Email sent!!!')
        });


    }
    catch(err){
        console.log("Email err", 7, err);

        return err
    }

}





