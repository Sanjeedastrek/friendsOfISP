const Package = require('../models/ispPackage'),
  User = require('../models/user')

// convert email uppercase to lowercase
module.exports.emailToLowercase = (req, res, next) => {
  req.body.email = req.body.email.toLowerCase();
  next();
}

//clear isp session when ISP logs out
module.exports.ispClearSession = (req, res, next) => {
  req.user = undefined;
  // req.session.destroy();
  currentIsp = undefined;
  console.log('cleared session for ISP');
  return next();
}

//clear user session when user logs out
module.exports.userClearSession = (req, res, next) => {
  req.user = undefined;
  // req.session.destroy();
  currentUser = undefined;
  console.log('cleared session for User');
  return next();
}
module.exports.isLoggedIn = (req, res, next) => {
  console.log('first time' + req.isAuthenticated());
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    var nameOfIsp = req.params.nameOfIsp;

    Package.find({ nameOfIsp: nameOfIsp }, (err, packageList) => {
      if (err) {
        console.log(err);
        res.redirect('/');
      }
      else {
        // we need to know available packages, name & id of respective ISP
        res.render('showOnlyPackageList', { packageList: packageList, nameOfIsp: nameOfIsp });
      }
    })
  }
}

module.exports.checkIspLoginStatus = (req, res, next) => {
  // try {

  // if (currentIsp) {
  // if (req.session.passport.user && currentIsp){
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    let nameOfIsp = req.params.nameOfIsp;
    console.log('nameOfIsp in middleware ' + nameOfIsp);
    Package.find({ nameOfIsp: nameOfIsp }, (err, packageList) => {
      if (err) {
        console.log(err);
        res.redirect('/');
      }
      else {
        console.log('packagelist not found');
        res.redirect('/');
      }
    })
  }
}
// catch(e) {
//   console.log('error caught: '+e );
//   res.redirect('/');
// }



module.exports.checkIspLoginStatusAndDirectToLogin = (req, res, next) => {
  console.log("current user is " + req.user);
  
  if (req.isAuthenticated()) {
    // if (req.session.passport.user && currentIsp){
    return next();
  }
  else {
    expectedUrlIsp = req.originalUrl;
    res.redirect('/login');
  }
}

module.exports.checkUserLoginStatus = (req, res, next) => {
  try {
    // if (currentUser) {
    // if (req.session.passport.user && currentIsp){
    if (req.isAuthenticated()) {
      return next();
    }
    else {
      let username = req.params.username;

      User.findOne({ username: username }, (err, user) => {
        if (err) {
          console.log(err)
          res.redirect('/');
        }
        else {
          res.redirect('/');
        }
      })
    }
  }
  catch (e) {
    console.log('error caught: ' + e);
    res.redirect('/');
  }

}
module.exports.checkUserLoginStatusAndDirectToLogin = (req, res, next) => {
   console.log("current user is " + req.user);
  // if (currentUser) {
  if (req.isAuthenticated()) {
    return next();
  }
  else {
    expectedUrlUser = req.originalUrl;
    res.redirect('/user-login');
  }
}
