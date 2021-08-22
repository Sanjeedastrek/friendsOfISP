/** import packages */
const express = require('express'),
    app = express(),
    session = require('express-session'),
    passport = require('passport'),
    bodyParser = require('body-parser'),
    expressSanitizer = require('express-sanitizer'),
    LocalStrategy = require('passport-local'),
    cookieParser = require('cookie-parser'),
    flash = require('connect-flash'),
    moment = require('moment'),
    methodOverride = require('method-override'),
    mongoose = require('mongoose'),
    global_vars = require('./middlewares/global_vars'),
    nodemailer = require('nodemailer');

let timestamp = 'hh mm a',
    now = moment().format(timestamp);


// mongoose.connect('mongodb://0.0.0.0/listing1:27017', {useNewUrlParser: true});
// mongodb://sanje:Sanjeeda123@cluster0-nezco.mongodb.net/isp?retryWrites=true
// mongoose.connect('mongodb://127.0.0.1/test1:27017', {useNewUrlParser: true});

// mongoose.connect('mongodb+srv://sanje:Sanjeeda123@cluster0-nezco.mongodb.net/isp?ssl=false&authSource=admin', {useNewUrlParser: true});

(async () => {
    try {
        await mongoose.connect('mongodb://127.0.0.1/test1:27017', {
            /**
             to fix deprecation warnings, we need to set some options. 
             for details follow https://mongoosejs.com/docs/deprecations.html
              */
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true
        });
    }
    catch (err) {
        console.log('error found: ' + err)
    }
})()

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'));

/** import models */
const Isp = require('./models/isp');

const Package = require('./models/ispPackage');

const User = require('./models/user');

const Customer = require('./models/customer');

const Review = require('./models/review');

const Ticket = require('./models/ticket');

const Reply = require('./models/reply');

/** import routes */
ispAuthRoute = require('./routes/ispAuthRoute'); // import isp auth route
ispRoute = require('./routes/ispRoute'); // import isp route
userAuthRoute = require('./routes/userAuthRoute'); // import user auth route
userRoute = require('./routes/userRoute'); // import user route

/** import controllers */
require('./controllers/isp/ispRegistrationController'); // import isp registration controller
require('./controllers/isp/ispLoginController'); // import isp login controller
require('./controllers/packageController'); // import package controller

require('./controllers/user/userLoginController'); // import user login controller
require('./controllers/user/userRegistrationController'); // import user registration controller
require('./controllers/userController') // import user controller

app.use(cookieParser());


// set session options

sess = {
    // genid: function(req) {
    //    			return genuuid() // use UUIDs for session IDs, generate unique IDs so sessions do not conflict.
    // 	},
    secret: 'porro quisquam est qui dolorem ipsum',
    resave: false,
    saveUninitialized: false,
    cookie: {} // cookie is set to true in production environment
}
if (app.get('env') === 'production') {
    // app.set('trust proxy', 1) // trust first proxy
    sess.cookie.secure = true // serve secure cookies
    sess.cookie.maxAge = 60000
}

/* session must reside before req.flash() */
app.use(session(sess));
app.use(flash());
app.use(expressSanitizer());

app.use(methodOverride('_method'));

// ENABLE AUTHENTICATION
app.use(passport.initialize());
// app.use(passport.initialize({ userProperty: 'currentUser' }));
app.use(passport.session());

passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()))

passport.serializeUser(function (user, done) {
    if (user) {
        return done(null, user._id);
    }
});

// authIsp.deserializeUser(Isp.deserializeUser());
// passport.deserializeUser(Isp.deserializeUser());
// authUser.deserializeUser(User.deserializeUser());

passport.deserializeUser(function (id, done) {
    User.findOne({ _id: id }).exec(function (err, user) {
        if (err) {
            console.log('Error loading user: ' + err);
            return;
        }

        if (user) {
            return done(null, user);
        }
        else {
            return done(null, false);
        }
    })
});


app.use(function (req, res, next) {

    /** we must maintain currentUser */
    res.locals.currentUser = req.user;
    res.locals.currentRole = req.user;

    /** tracks whether customer completes profile */
    res.locals.profileComplete = undefined;

    /** tracks whether ISP verification pending or complete regardless of validity, 
    if pending then false otherwise true */
    res.locals.ispVerifiedCustomer = undefined;

    /** tracks original URL in case of user(customer) */
    res.locals.expectedUrlUser = undefined;

    /** tracks original URL in case of ISP */
    res.locals.expectedUrlIsp = undefined;

    /**if false ISP cannot access dashboard, otherwise can access */
    res.locals.verifiedIsp = undefined;

    res.locals.ispProfileComplete = undefined;

    res.locals.packageCounter = undefined;


    /** if user.ispVerificationStatus equals 0, user registered but didn't complete profile, when 1, user completes profile
    but still ISP didn't verify, if 2, ISP verified as valid and user can review, if 3, ISP verified user as invalid */
    res.locals.canReview = undefined;
    res.locals.registrationFailure = req.flash('registration-failure')
    res.locals.successfulRegistration = req.flash('successful-registration')
    res.locals.successfulLogin = req.flash('successful-login')
    res.locals.afterSuccessfulRegistration = req.flash('after-successful-registration')
    res.locals.afterSuccessfulPackageEdit = req.flash('after-successful-package-edit')
    res.locals.afterSuccessfulPackageDelete = req.flash('after-successful-package-delete')
    res.locals.loginToCreatePackage = req.flash('login-to-create-package')
    res.locals.profileCompletion = req.flash('profile-completion')
    res.locals.reviewSubmission = req.flash('review-submission')
    res.locals.profileIncomplete = req.flash('profile-incomplete')
    res.locals.notVerifiedIsp = req.flash('not-verified-isp')
    res.locals.invalidUser = req.flash('invalid-user')
    res.locals.noLocation = req.flash('no-location')
    res.locals.ispProfileComplete = req.flash('isp-profile-complete')
    res.locals.underVerification = req.flash('under-verification')
    res.locals.noPackage = req.flash('no-package')
    res.locals.createTicket = req.flash('create-ticket')
    res.locals.noFileChosen = req.flash('no-file-chosen')
    res.locals.success = req.flash('success')
    res.locals.failureFlash = req.flash('failure-flash')
    res.locals.passwordsDontMatchError = req.flash('passwords-dont-match-error')
    res.locals.noAccountExistsError = req.flash('no-account-exists-error')
    res.locals.mailSent = req.flash('mail-sent')
    res.locals.passwordChanged = req.flash('password-changed')
    res.locals.invalidTokenError = req.flash('invalid-token-error')
    res.locals.successfulLogoUpload = req.flash('successful-logo-upload')
    res.locals.alreadyRegistered = req.flash('already-registered')
    res.locals.wrongUserPw = req.flash('wrong-user-pw')
    res.locals.failureFlash = req.flash('failure-flash')
    res.locals.registeredNow = req.flash('registered-now')
    next()
})
app.use(ispAuthRoute);
app.use(userAuthRoute);
app.use(ispRoute);
app.use(userRoute);

app.get('/', function (req, res) {
    console.log("got u");
    /** list all available ISPs */
    Isp.find({}, function (err, isps) {
        // if error occurs
        if (err) {
            console.log(err);
            res.render('error');
        }
        // if no error
        else {
            let page_path = req.path;
            res.render('index', { isps: isps, page_path: page_path, currentUser: req.user, currentRole: req.user });
        }
    })
})

// Ticket.counterReset('ticketId_seq', (err, t) => {

// 	})
// we dont need to reset the counter explicitly, when u delete counter collection from db, it resets

/* app.listen(process.env.PORT, process.env.IP, function () {

     console.log(' Hold on ' + now);
 })
*/

app.listen(3000, () => {
    console.log('server started at ' + now)
})

