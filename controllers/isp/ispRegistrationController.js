const express = require('express'),

  router = express.Router(),

  Isp = require('../../models/isp'),

  User = require('../../models/user'),

  passport = require('passport')

/** isp registration form (new route) */
module.exports.showIspRegistrationForm = (req, res) => {
  let page_path = req.path;
  res.render('isp/ispRegistration', { page_path: page_path });
}

/** register isp to database (create route) */
module.exports.registerIspInDb = (req, res) => {
  if (req.body) {
    var password = req.body.password,
      nameOfIsp = req.sanitize(req.body.nameOfIsp),
      username = req.sanitize(req.body.username),
      phone = req.sanitize(req.body.phone),
      email = req.sanitize(req.body.email);
    /**
     * create new document in user collection
     */
    User.register(new User({
      email: email,
      nameOfUser: nameOfIsp,
      username: username,
      role: 'isp',
    }), password, function(err, isp) {
      if (err) {
        console.log(err);
        req.flash('already-registered', 'An ISP with the given username / email is already registered')
        res.redirect('/registration');
      }
      else if (!err) {
        /**
         * create new document in isp collection
         */

        Isp.create({
          // whether that ISP is verified by us
          verified: false,
          // whether ISP completes profile
          ispProfileComplete: false,
          username: username,
          nameOfIsp: nameOfIsp,
          email: email,
          phone: phone
        })
        // authIsp.authenticate('local')(req, res, function() {
        passport.authenticate('local')(req, res, function() {
          // we should maintain currentUser
          currentUser = username;
          console.log('currentUser2 ' + currentUser);
          verifiedIsp = false;

          console.log("verifiedIsp " + verifiedIsp);
          req.flash("after-successful-registration", "Thank you to register.  Please wait, We'll contact you shortly.");
          console.log('currentUser3 ' + currentUser);
          res.redirect('/');

        })
      }
      else {
        console.log('unidentified mistake');
      }
    })
  }
  else {
    // {sendJsonResponse(res, 404, {"content":"req.body is empty"});}
    console.log('problems');
  }
}
