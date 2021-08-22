/** This route contains the registration & login routes for ISP */

const express = require('express'),

  router = express.Router(),

  passport = require('passport');

/** import user model */

const User = require('../models/user');

/** import isp model */

const Isp = require('../models/isp');

/** import registration controller */

const ispRegistrationController = require('../controllers/isp/ispRegistrationController')

/** import login controller */

const ispLoginController = require('../controllers/isp/ispLoginController')

/** import middleware */

const middlewares = require('../middlewares/middlewares')

/** show isp registration form */
router.get('/registration', ispRegistrationController.showIspRegistrationForm);

/** register isp to database */
router.post('/registration', middlewares.emailToLowercase, ispRegistrationController.registerIspInDb);

/** show  ISP login form
 * router.get('/login', middlewares.clearSession, ispLoginController.loginForm);
 */
router.get('/login', ispLoginController.loginForm);


/** justify login */
// router.post('/login', middlewares.emailToLowercase, authIsp.authenticate('local', {
router.post('/login', middlewares.emailToLowercase, passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login?failureFlash',

  }),
  function(req, res) {
    let page_path = req.path,
      id = req.sanitize(req.user._id);
    console.log(id + ' ' + req.user._id);

    User.findOne({ _id: id, role: 'isp' }, function(err, user) {
      /** if error found */
      if (err) {
        console.log(err);
        res.redirect('/login');
      }
      /** no user found */
      else if (!user) {
        res.redirect('/login?failureFlash');
      }
      /** user found */
      else {
        let ispEmail = user.email,
          nameOfIsp = user.nameOfUser;
        currentUser = user.username;
        console.log('currentUser from ispAuthRoute: ' + currentUser);
        console.log('ispEmail from ispAuthRoute: ' + ispEmail);
        // console.log('currentUser from ispAuthRoute: ' + currentUser);
        Isp.findOne({ email: ispEmail }, (error, isp) => {
          if (error) {
            res.redirect('/login?failureFlash');
          }
          else {
            verifiedIsp = isp.verified;
            ispProfileComplete = isp.ispProfileComplete;
            packageCounter = (isp.packageCounter > 0);

            req.flash('successful-login', 'you have logged successfully as ' + currentUser);
            /** whether the isp is verified by us. if it's true, ISP can access dashboard otherwise not */
            if (!verifiedIsp) {
              req.flash("not-verified-isp", "Still we did not verify your service. Please wait, We'll contact you shortly.");
              res.redirect('/');
            }
            else {
              /** The followings are kind of warnings displayed when ISP logs in */

              /** If ISP still didn't add location, flash a message */
              if (isp.location.length === 0) {
                req.flash('no-location', 'Please add locations where your ISP provides service');
              }
              /** If ISP still didn't create any package, flash a message */
              if (!packageCounter) {
                req.flash('no-package', 'Please create package');
              }
              /** If ISP still didn't complete profile, flash a message 
               *  To complete profile ISP must fill in fields: Established On, phone, registration no., about, head office & brand logo
               */
              if (!ispProfileComplete) {
                req.flash('isp-profile-complete', 'Please complete profile');
              }
              res.redirect('/' + nameOfIsp);
              
            }
          }

        })

        console.log("session show us " + req.session.passport.user); //works, shows _id
      }
    })
  }
)

router.get('/logout', function(req, res) {
  // req.session.destroy();
  req.logout();
  // currentIsp = undefined;
  // expectedUrlIsp = undefined;
  console.log('isp logout');
  res.redirect('/');
})

module.exports = router
