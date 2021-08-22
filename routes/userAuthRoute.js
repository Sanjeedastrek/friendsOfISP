// This route contains the registration & login routes for isp

const express = require('express')

const router = express.Router()

const passport = require('passport')

// import user model

const User = require('../models/user')

const Customer = require('../models/customer')

// import registration controller

const userRegistrationController = require('../controllers/user/userRegistrationController')

// import login controller

const userLoginController = require('../controllers/user/userLoginController')

// import middleware

const middlewares = require('../middlewares/middlewares')

// show user registration form
router.get('/user-registration', userRegistrationController.showUserRegistrationForm)

// register isp to database
router.post('/user-registration', middlewares.emailToLowercase, userRegistrationController.registerUserInDb);

// show login form
// router.get('/user-login', middlewares.clearSession, userLoginController.loginForm)
router.get('/user-login', userLoginController.loginForm);

// justify login
// router.post('/user-login', middlewares.emailToLowercase, authUser.authenticate('local', 
router.post('/user-login', middlewares.emailToLowercase, passport.authenticate('local', {
    badRequestMessage: 'Missing username or password.',
    failureFlash: true,
    failureRedirect: '/user-login?failureFlash',
  }),
  function(req, res) {
    let id = req.sanitize(req.user._id);
    console.log(id);

    User.findOne({ _id: id, role: 'customer' }, function(err, user) {

      // if err found
      if (err) {
        console.log(err);
        res.redirect('/user-login');
      }
      //if no user found
      else if (!user) {
        res.redirect('/user-login?failureFlash');
      }
      // if user found
      else {
        let username = user.username,
          // defining currentUser is very important because if it's undefined login doesn't validate
          currentUser = user.username;

        console.log('currentUser from userAuthRoute: ' + currentUser);

        Customer.findOne({ username: username }, (err, customer) => {
          console.log('so this is it '+customer);
          // if ISP declares the customer valid then the customer can review otherwise can't review
          canReview = (customer.ispVerificationStatus == 2);

          // user can only review, create ticket & find notifications if his/her profile is complete
          profileComplete = (customer.profileComplete);

          req.flash('successful-login', 'you have logged successfully as ' + currentUser);
          if (!profileComplete) {
            req.flash("profile-incomplete", "Please take a while to complete your profile. Otherwise, you aren't allowed to review or create ticket");

            console.log('!profileComplete');
          }
          if (customer.ispVerificationStatus === 1) {
            req.flash("under-verification", "Your profile is under verification. You will get an email shortly from ISP.");

          }
          if (customer.ispVerificationStatus < 2) {
            ispVerifiedCustomer = false;
          }
          else if (customer.ispVerificationStatus > 1) {
            ispVerifiedCustomer = true;

          }
          if (customer.ispVerificationStatus === 3) {
            req.flash("invalid-user", "Your ISP verified you as invalid. Please complete profile with appropriate information");
          }


          res.redirect('/user/' + username);
          console.log('/user/' + username+ ' '+profileComplete);
          console.log('session show us ' + req.session.passport.user) // works, show _id
          console.log('profileComplete ' + profileComplete);
          console.log('ispVerifiedCustomer ' + ispVerifiedCustomer);

        })



      }
    })
  });


router.get('/user-logout', function(req, res) {
  // req.session.destroy();
  // console.log('logggggggggggg '+req.user.logout);
  req.logout();

  // currentUser = undefined;
  // expectedUrlUser = undefined;
  console.log('user logout');
  res.redirect('/');
});


module.exports = router
