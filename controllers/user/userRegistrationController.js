const express = require('express')

const router = express.Router()

const User = require('../../models/user')

const Customer = require('../../models/customer')

const passport = require('passport')

// const authUser = new passport.Passport();

mailOptionsRegistrationConfirmation = {
  from: 'sanjeeda@octoriz.com',
  subject: 'Registration confirmation',
};

// directs to user registration form
module.exports.showUserRegistrationForm = (req, res) => {
  let page_path = req.path;
  res.render('user/userRegistration', { page_path: page_path });
}
module.exports.registerUserInDb = (req, res) => {
  if (req.body) {
    let password = req.sanitize(req.body.password),
      email = req.sanitize(req.body.email),
      nameOfUser = req.sanitize(req.body.nameOfUser),
      username = req.sanitize(req.body.username),
      phone = req.sanitize(req.body.phone);
    User.register(new User({
      email: email,
      nameOfUser: nameOfUser,
      username: username,
      // phone: (req.body.phone) ? req.sanitize(req.body.phone) : '',
      phone : phone,
      role : 'customer'

    }), password, (err, user) => {

      if (err) {
        console.log(err);
        req.flash('already-registered', 'A user with the given username / email is already registered')
        res.redirect('/user-registration');
      }
      else if (!err) {
        Customer.create({
          ispVerificationStatus: 0, // at the time of registration
          profileComplete: 0,
          username: username,
          nameOfCustomer: nameOfUser,
          email: email
        })
        passport.authenticate('local')(req, res, function() {
          // we should maintain currentUser to track logged user
          currentUser = req.sanitize(req.body.username);
          req.flash('after-successful-registration', 'Thank you to register. An email is sent to your email address. Please complete profile to review your broadband service')
          profileComplete = false;
          ispVerifiedCustomer = false ;
          mailOptionsRegistrationConfirmation.to = user.email;
          mailOptionsRegistrationConfirmation.html = '<body><h3>Dear ' + user.nameOfUser + ',</h3><p>Thanks for your registration with Isp Listing. Please <a href=' + baseURL + '/user-login>Login</a> and complete profile.<br/>' + emailFooter + '</body>';

          transporter.sendMail(mailOptionsRegistrationConfirmation, (error, info) => { // let's send email
            if (error) {
              console.log(error);
            }
            else {
              console.log("Successful. email sent to: " + user.email);
            }
          })
          res.redirect('/user/' + username + '?registeredNow');
          // res.redirect('/'+'?currentUser='+currentUser);
        })
      }
      else {
        console.log('unidentified mistake');
      }
    })
  }
  else
  // {sendJsonResponse(res, 404, {"content":"req.body is empty"});}
  {
    console.log('problems')
  }
}
