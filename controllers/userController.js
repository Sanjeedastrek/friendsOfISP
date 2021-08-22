const nodemailer = require('nodemailer'), //automatic email sending npm
    async = require('async'),
    crypto = require('crypto'),
    User = require("../models/user"),
    Isp = require("../models/isp"),
    Customer = require("../models/customer"),
    Package = require("../models/ispPackage"),
    Ticket = require("../models/ticket"),
    Reply = require("../models/reply"),
    Review = require("../models/review");
// TEST WHETHER REQUIRED
// require('dotenv').config();

/** Following options are set to send mail through nodemailer package */
mailOptions = {
    from: 'sanjeeda@octoriz.com',
    subject: 'Please check out this profile',
};

/** when user creates a ticket, a mail is sent to ISP */
mailOptionsUserCreatesTicket = {
    from: 'sanjeeda@octoriz.com',
    subject: 'Please follow up the ticket issued by your customer',
};

/** when a user further replies to a reply from ISP, a mail is sent to ISP */
mailOptionsReplyTicketUser = {
    from: 'sanjeeda@octoriz.com',
    subject: 'User has replied you further',
};

/** options for forget password */
mailOptionsForgotPassword = {
    from: 'sanjeeda@octoriz.com',
    subject: 'Password Reset in ISP listing',
};

mailOptionsResetPassword = {
    from: 'sanjeeda@octoriz.com',
    subject: 'Your password has been changed',
};

/** show user profile. It consists of user info like ISP, package, customer ID, contact, address
 * router.get('/:user/profile', middlewares.checkUserLoginStatusAndDirectToLogin, userController.profile) 
 */
module.exports.profile = (req, res) => {
    let page_path = req.path,
        username = req.params.username;
    Customer.findOne({ username: username }, (err, customer) => {
        if (err) {
            console.log('we get this while user tries to see profile ' + err);
            res.redirect('/');
        }
        else {
            if (customer.ispVerificationStatus < 2) {
                ispVerifiedCustomer = false;
                canReview = false;
            }
            else if (customer.ispVerificationStatus > 1) {
                ispVerifiedCustomer = true;
                canReview = true;
            }
            res.render("user/showProfile", { customer: customer, page_path: page_path, currentUser: username, profileComplete: customer.profileComplete, canReview: canReview });
        }
    })
}

/** create profile (new route)
 * router.get('/:user/createProfile', middlewares.checkUserLoginStatusAndDirectToLogin, userController.createProfile) 
 */
module.exports.createProfile = (req, res) => {

    let page_path = req.path,
        username = req.params.username;
    Customer.findOne({ username: username }, (err, customer) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        else {
            Isp.find({}, (err, ispAll) => {
                res.render("user/createProfile", { customer: customer, ispAll: ispAll, page_path: page_path, username: username });
                console.log(customer);
            })
        }
    })
}

/** save user profile (create route)
 * router.put('/:user/saveProfile', middlewares.checkUserLoginStatus, userController.saveProfile)
 */
module.exports.saveProfile = (req, res) => {
    let nameOfIsp = (req.body.isp) ? req.sanitize(req.body.isp) : '',
        package = (req.body.package) ? req.sanitize(req.body.package) : '',
        customerId = (req.body.customerId) ? req.sanitize(req.body.customerId) : '',
        phone = (req.body.phone) ? req.sanitize(req.body.phone) : '',
        username = req.params.username,
        address = (req.body.address) ? req.sanitize(req.body.address) : '';

    console.log('username in saveProfile ' + username);
    Customer.findOne({ username: username }, function(err, customer) {
        console.log('customer in mongoose ' + username);
        if (err) {
            console.log("error " + err);
            res.redirect('/');
        }
        else if (!customer) {
            res.redirect('/');
        }
        else {

            /**save the user profile, then check whether user properly completes profile, if complete server sends an email to ISP
             * & profileCompleteNotifications in isp model hold the cusotmer profile
             */
            workOut(checkComplete);

            function checkComplete() {
                /** check whether user completes profile
                 * if profile is complete isp will get a mail so that isp may verify user
                 */
                if (customer.phone && customer.nameOfIsp && customer.package && customer.customerId && customer.address) {

                    //if profile is complete, do following
                    customer.profileComplete = true;
                    customer.ispVerificationStatus = 1;
                    customer.save();
                    profileComplete = true;
                    canReview = false;

                    // to send email to respective ISP, we have to match betweeen users & isps collection
                    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
                        if (err) {
                            console.log(" error while finding user's chosen isp, in details: " + err);
                        }
                        else {
                            mailOptions.to = isp.email;
                            mailOptions.html = '<body><h3>Dear ' + nameOfIsp + ',</h3><p>A user with these credentials- ID: ' + customerId + ', Phone: ' + phone + ', Address: ' + address + ' is using Package :' + package + '. </p><p>Please <a href="' + baseURL + '/login">login </a> to verify user profile.</p>' + emailFooter + '</body>';

                            transporter.sendMail(mailOptions, (error, info) => { // let's send email
                                if (error) {
                                    console.log(error);
                                }
                                else {
                                    console.log('Email sent: ' + info.response);
                                    // let's send notification to ISP panel
                                    // profileComplete = true;
                                    isp.profileCompleteNotifications.push({
                                        customerId: customerId,
                                        phone: phone,
                                        address: address,
                                        package: package,
                                        status: true,

                                        username: username
                                    });
                                    isp.save();
                                }
                            });
                        }
                    })
                }
                // if profile is not complete, do following
                else {
                    customer.profileComplete = false;
                    customer.save();
                    profileComplete = false;
                    canReview = false;
                }
            } // end of checkComplete
            /** after saving user input, this transfers control to checkComplete function to set status of 'complete' */
            function workOut(checkComplete) {
                customer.nameOfIsp = nameOfIsp;
                customer.package = package;
                customer.customerId = customerId;
                customer.phone = phone;
                customer.address = address;
                customer.username = username;
                customer.ispVerificationStatus = 0;
                checkComplete();
                if (profileComplete) {

                    // req.flash('profile-completion', 'Thank you! Your profile is complete, You will get an email from your ISP soon');
                    res.redirect("/user/" + username + '?profileComplete');
                    console.log('value of profileComplete ' + profileComplete);

                }
                else {
                    // req.flash('profile-completion', 'Please complete profile to be able to create review or ticket');
                    res.redirect("/user/" + username + '?profileIncomplete');
                    console.log('value of profileComplete ' + profileComplete)
                }

            }
        }
    })
}

/** Find and return packages under selected isp	
 * router.post('/current-isp-package', middlewares.checkUserLoginStatus, userController.currentIspPackage)
 */
module.exports.currentIspPackage = (req, res) => {
    let nameOfIsp = req.body.isp; //nameOfIsp
    // query all packages under that isp
    Package.find({ nameOfIsp: nameOfIsp }, (err, packages) => {
        let packageList = [];
        packages.forEach(function(package) {
            packageList.push(package.packageName);
        })
        res.send(packageList);
    })
}

// // show user profile (show route)
// module.exports.showUserProfileToIsp=  (req, res) =>{

// 	let userName= req.params.customer;
// 	// let's retrieve user info
// 	User.findOne({username:userName}, (err, user)=> {
// 		if (err){
// 	 			console.log(err);
// 	 			res.redirect('/'); 
// 	 		} else {
// 	 			// show isp the user profile, where isp should verify, 
// 				res.render("isp/showUserProfileToIsp",{user : user});
// 	 		}
// 		})
// 	} 

// // isp verifies user
// module.exports.verifyUser = (req,res) => {
// let verify= req.body.userVerification,
// 	userName = req.params.user;

// 	// we need to know customer ID
// 	User.findOne({username:userName}, (err, user) => {
// 		let customerId= user.customerId;
// 			if (err){
// 				console.log("Problems found while ISP verify user.  "+err);
// 				res.redirect("/");
// 			}
// 			Isp.findOne({nameOfIsp:currentIsp}).populate('profileCompleteNotifications').exec((err, ispDetails) => {
// 			// if verfiy is valid, delete that specific profileCompleteNotification from isp and change ispVerificationStatus to 2
// 			// else just change ispVerificationStatus to 3
// 			if (verify==='valid'){
// 				let pro=ispDetails.profileCompleteNotifications;
// 				pro.forEach(function(notification){ // profileCompleteNotifications is an array
// 				// if customerId matches we remove the notification else do nothing
// 				if (notification.customerId == customerId){
// 					console.log(notification.customerId);
// 					notification.remove();
// 					ispDetails.save();
// 					}
// 				})
// 				//set ispVerificationStatus to 2 means valid
// 				user.ispVerificationStatus = 2;
// 				user.save();
// 				res.redirect('/isp/'+currentIsp);
// 				} else {
// 					// set ispVerificationStatus to 3 means invalid
// 					user.ispVerificationStatus = 3;
// 					user.save();
// 					res.redirect('/isp/'+currentIsp);
// 				}
// 			})
// 		})
// 	}

/** from user route, user shown a review form	
 * router.get('/:user/:isp/:package/review', middlewares.checkUserLoginStatusAndDirectToLogin, userController.createReview)
 */
module.exports.createReview = (req, res) => {
    let page_path = req.path,
        customerUsername = req.params.username;
    Customer.findOne({ username: customerUsername }, (err, customer) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        else {
            res.render("user/createReview", { customer: customer, page_path: page_path, currentUser: customerUsername, profileComplete: true, canReview: true });
        }
    })
}

/** save review by user 
 * router.post('/:user/:isp/:package/review', middlewares.checkUserLoginStatus, userController.saveReview)
 */
module.exports.saveReview = (req, res) => {
    let comment = req.body.comment,
        rating = req.body.ratingValue,
        isp = req.params.isp,
        package = req.params.package,
        customerUsername = req.params.username

    /** save review to review collection & put uuid to user & package collection */
    Customer.findOne({ username: customerUsername }, (err, user) => {
        let nameOfUser = user.nameOfCustomer;

        Review.create({
            user: customerUsername,
            isp: isp,
            package: package,
            comment: comment,
            rating: rating,
            nameOfReviewer: nameOfUser
        }, (err, review) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            }
            else {
                Customer.findOne({ username: customerUsername }).populate('reviews').exec((err, user) => {
                    user.reviews.push(review);
                    user.save();
                    Package.findOne({ packageName: package }, (err, package) => {

                        // Package.findOne({ packageName: package }).populate('reviews').exec((err, package) => {
                        console.log("testing packageName " + package.packageName);
                        console.log("testing package " + package);
                        package.reviews.push(review);
                        // we've to check whether this is the first ever rating in that package
                        // if it's first time, value of averageRating will be rating otherwise a calculation required
                        if (package.averageRating == 0) {
                            package.averageRating = rating;
                            console.log("package.averageRating = " + package.averageRating);
                            package.save();
                        }
                        else {
                            let add = parseFloat(package.averageRating) + parseFloat(rating);
                            let divide = parseFloat(add / 2);
                            package.averageRating = divide;
                            console.log("package.averageRating = " + package.averageRating);
                            package.save();
                        };


                    })
                })
                req.flash('review-submission', 'Thanks for the review');
                res.redirect('/user/' + customerUsername);
            }
        })
    })
}

/** router.get('/:isp/:package/show-reviews', userController.showReview) */
module.exports.showReview = (req, res) => {
    let isp = req.params.isp,
        package = req.params.package,
        page_path = req.path;
    Review.find({ isp: isp, package: package }, (err, reviewList) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        else {

            // we need average rating per package
            let sum = 0,
                len = reviewList.length;
            reviewList.forEach(function(review) {
                let r = review.rating;
                sum = sum + r;
            });
            average = (reviewList.length === 0) ? 'no reviews yet' : sum / len;
            // average = sum/len;

            console.log(" got average " + average);

            res.render('isp/showReview', { reviewList: reviewList, isp: isp, pack: package, average: average, page_path: page.path });
        }

    })
}
// edit user profile form

module.exports.editUserProfile = (req, res) => {
    let page_path = req.path;
    User.findOne({ username: currentUser }, (err, user) => {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        else {
            res.render("user/editUserProfile", { user: user, page_path: page_path, currentUser: currentUser });
        }
    })
}

/** show ticket form(new route)
 * router.get('/:username/:isp/:package/createTicket', middlewares.checkUserLoginStatus, userController.createTicket)
 */
module.exports.createTicket = (req, res) => {
    let page_path = req.path,
        customerUsername = req.params.username;
    Customer.findOne({ username: customerUsername }, (err, user) => {
        console.log('from createTicket ' + customerUsername);
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        else {

            res.render("user/createTicket", { user: user, page_path: page_path, currentUser: customerUsername, profileComplete: true, canReview: true });
        }

    })
}

/** save ticket (create route) 
 * router.post('/:username/:isp/:package/saveTicket', middlewares.checkUserLoginStatus, userController.saveTicket)
 */
module.exports.saveTicket = (req, res) => {
    let ticketTitle = req.sanitize(req.body.ticketTitle),
        description = req.sanitize(req.body.description),
        department = req.sanitize(req.body.department),
        isp = req.params.isp,
        package = req.params.package,
        customerUsername = req.params.username;
    Customer.findOne({ username: customerUsername }).populate('ticket').exec((err, user) => {
        console.log('from saveTicket ' + customerUsername);
        let nameOfUser = user.nameOfUser,
            email = user.email;
        Ticket.create({
            isp: isp,
            package: package,
            title: ticketTitle,
            department: department,
            description: description,
            opener: customerUsername,
            nameOfUser: nameOfUser,
            ticketStatus: 0,
            userEmail: email,
            solved: false
        }, (err, ticket) => {

            let userTicket = user.ticket;

            userTicket.push(ticket);
            user.save();
            /** save ticket to ticket collection & put uuid to user & package collection */

            Package.findOne({ packageName: package }).populate('ticket').exec((err, package) => {
                package.ticket.push(ticket);
                package.save();

                Isp.findOne({ nameOfIsp: isp }, (err, gotIsp) => {
                    ticket.ispEmail = gotIsp.email;
                    ticket.save();
                    mailOptionsUserCreatesTicket.to = gotIsp.email;
                    mailOptionsUserCreatesTicket.html = '<body>Dear ' + gotIsp.nameOfIsp + ',<br/><p>A user created a ticket to ' + ticket.department + '.The problem title is: ' + ticket.title + '.</p><p>The problem details is: ' + ticket.description + '</p> <a href="' + baseURL + '/' + ticket.package + '/' + ticket.ticketId + '/replyTicket">Please Click this to check ticket</a><br>' + emailFooter + '</body>';

                    transporter.sendMail(mailOptionsUserCreatesTicket, (error, info) => { // let's send email
                        if (error) {
                            console.log(error);
                        }
                        else {
                            console.log('Email sent to ISP about ticket : ' + info.response);
                        }
                    });
                    profileComplete = true;
                    canReview = true;

                    console.log(ticket.ticketId);
                    req.flash('create-ticket', 'Thanks to open a ticket, the ticket id is ' + ticket.ticketId + '. An email is sent to your Isp. Please wait for reply. ');
                    res.redirect('/user/' + user.username);
                })
            })
        })
    })
}
/** User replies to ISP 
 * router.get('/:username/:ticketId/user/reply-ticket', middlewares.checkUserLoginStatusAndDirectToLogin, userController.replyTicketUser)
 */
module.exports.replyTicketUser = (req, res) => {
    let customerUsername = req.params.username,
        ticketId = req.params.ticketId,
        page_path = req.path;

    Ticket.findOne({ ticketId: ticketId }).populate('replies').exec((err, ticket) => {
        console.log('username in replyTicketUser ' + customerUsername);
        //  Ticket.findOne({ticketId: ticketId}, (err, ticket) => {
        if (err) {
            console.log(" error in finding ticket " + err);
        }
        else {
            let replies = ticket.replies;

            res.render('user/replyTicketUser', { ticket: ticket, replies: replies, page_path: page_path, currentUser: customerUsername, profileComplete: true, canReview: true });
        }
    })
}

/** User reply saved  
 * router.post('/:username/:ticketId/user/reply-ticket', middlewares.checkUserLoginStatusAndDirectToLogin, userController.saveReplyTicketUser)
 */
module.exports.saveReplyTicketUser = (req, res) => {
    let package = req.params.package,
        ticketId = req.params.ticketId,
        reply = req.sanitize(req.body.userReply),
        status = req.sanitize(req.body.status),
        customerUsername = req.params.username;

    Customer.findOne({ username: customerUsername }, (err, user) => {
        let nameOfCustomer = user.nameOfCustomer;

        /** Save the reply in reply collection & the uuid in ticket collection, send user the reply by email */
        Reply.create({
                replyerType: 'USER',
                ticketId: ticketId,
                name: customerUsername,
                reply: reply,
                nameOfReplier: nameOfCustomer,
                status: status == 'issue solved' ? 2 : 1
            },
            function(err, reply) {
                if (err) {
                    console.log(" Cant save reply " + err);
                }
                else {
                    Ticket.findOne({ ticketId: ticketId }).populate('replies').exec((err, ticket) => {
                        ticket.replies.push(reply);
                        ticket.save();
                        // send reply to isp thru mail, we need to find isp email id
                        mailOptionsReplyTicketUser.to = ticket.ispEmail;
                        //send mail to isp, email content depends on user chosen status
                        // it's important to set ticketStatus to let isp know the status of ticket
                        if (reply.status == 2) {
                            ticket.solved = true;
                            ticket.ticketStatus = 2;
                            ticket.save();
                            mailOptionsReplyTicketUser.html = '<body><h3>Dear ' + ticket.isp + ',</h3><br><p>' + reply.nameOfReplier + ' sent you reply to the ticket ' + reply.ticketId + ' with these info- <br>Reply: ' + reply.reply + '<br> Status: ' + reply.status + '<p>As user selected solved status for this ticket, you dont need to further reply.</p><p>Therefore, ticket is closed for any further clarification.</p><br>' + emailFooter + '</body>';

                        }
                        else {
                            ticket.solved = false;
                            ticket.ticketStatus = 1;
                            ticket.save();
                            mailOptionsReplyTicketUser.html = '<body><h3>Dear ' + ticket.isp + ',</h3><br><p>' + reply.nameOfReplier + ' sent you reply to the ticket ' + reply.ticketId + ' with these info- <br>Reply: ' + reply.reply + '<br> Status: >' + reply.status + '</p><p><a href="<%=baseURL%>/' + ticket.opener + '/' + ticket.ticketId + '/isp/reply-ticket"> Please Click this to resolve the ticket</a><br>' + emailFooter + '</body>';
                        }

                        transporter.sendMail(mailOptionsReplyTicketUser, (error, info) => { // let's send email
                            if (error) {
                                console.log(error);
                            }
                            else {
                                console.log(" email sent to " + ticket.ispEmail);
                            }
                        })
                        res.redirect('/user/' + user.username);
                    })
                }
            }
        )
    })
}
/** router.get('/:username/ticketNotificationsUser', middlewares.checkUserLoginStatus, userController.ticketNotificationsUser) */
module.exports.ticketNotificationsUser = (req, res) => {
    // it's the same thing that isp gets
    let customerUsername = req.params.username,
        page_path = req.path;

    Ticket.find({ opener: customerUsername }, (err, ticketAll) => {
        console.log('username from ticketNotificationsUser ' + customerUsername);
        res.render("user/ticketNotificationsUser", { ticketAll: ticketAll, page_path: page_path, currentUser: customerUsername, profileComplete: true, canReview: true });
    })
}
module.exports.doSearch = (req, res) => {
    console.log("do do do");
    res.render('page2');
}

/** router.get('/user/forgot-password', userController.forgotPassword); */
module.exports.forgotPassword = (req, res) => {
    console.log('forgot password???');
    let page_path = req.path;
    res.render('user/forgotPassword', { page_path: page_path });
}

/** router.post('/user/forgot-password', userController.forgotPasswordPost); */
module.exports.forgotPasswordPost = (req, res, next) => {
    let page_path = req.path,
        token;
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('no-account-exists-error', 'No account with that email address exists');
                    return res.redirect('/user/forgot-password');
                    console.log('/user/forgot-password');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {

            mailOptionsForgotPassword.to = user.email;
            mailOptionsForgotPassword.html = '<body><h3>Dear ' + user.nameOfUser + ',</h3><p>You are receiving this because you (or someone else) have requested the reset of the password for your account.</p>' +
                '<p>Please click on the following link, or paste this into your browser to complete the process:<br/><a href="' + baseURL + '/reset/' + token + '">' + baseURL + '/reset/' +
                token + '</a></p><p>Please remember, this token will expire within 1 hour so get done quick.<p>' +
                '<p>If you did not request this, please ignore this email and your password will remain unchanged.</p>' + emailFooter + '</body>';

            transporter.sendMail(mailOptionsForgotPassword, (error, info) => { // let's send email
                console.log('user gets email regarding password reset : ' + info.response);
                req.flash('mail-sent', 'An email has been sent to ' + user.email + ' with further instructions');
                done(error, 'done');
            })

        }
    ], function(err) {
        if (err) return next(err);
        // res.render('user/resetPassword',{page_path : page_path, token:token});
        res.redirect('/');

    });
}

/** router.get('/reset/:token', userController.resetPassword); */
module.exports.resetPassword = (req, res) => {
    console.log('reached dfjdksljfljfkjlfs');
    let page_path = req.path;
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
            req.flash('invalid-token-error', 'Password reset token is invalid or has expired');
            return res.redirect('user/forgotPassword');
        }
        res.render('user/resetPassword', { token: req.params.token, page_path: page_path });
    });
}

/** router.post('/reset/:token', userController.resetPasswordPost); */
module.exports.resetPasswordPost = (req, res) => {
    let page_path = req.path;
    var user;
    async.waterfall([
        function(done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                if (!user) {
                    req.flash('invalid-token-error', 'Password reset token is invalid or has expired');
                    return res.redirect('/');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function(err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function(err) {
                            // As we dont want the user to be automatically logged in after password change, we should omit req.logIn 
                            // req.logIn(user, function(err) {
                            //     done(err, user);
                            // });
                            done(err, user);
                        });
                    })
                }
                else {
                    req.flash("passwords-dont-match-error", "Passwords do not match");
                    console.log('Passwords do not match!');
                    res.redirect('/reset/' + req.params.token);
                }
            });
        },
        function(user, done) {

            mailOptionsResetPassword.to = user.email;
            mailOptionsResetPassword.html = '<body><h3>Dear ' + user.nameOfUser + ',</h3><br/>' +
                'This is a confirmation that the password for your account ' + user.email + ' has just been changed.<br/>' +
                emailFooter + '</body>';

            transporter.sendMail(mailOptionsResetPassword, (error, info) => { // let's send email
                console.log('user gets email regarding password : ' + info.response);
                done(error);
            })
        }
    ], function(err) {

        if (err) {
            console.log("error error error");
            res.redirect('/');
        }
        else {
            req.flash('password-changed', 'Success! Your password has been changed. Please login to proceed');
            res.redirect('/');
        }
    });
};

/** When user logs in, this is displayed
 * router.get('/user/:username', middlewares.checkUserLoginStatus, userController.helloUser);
 */
module.exports.helloUser = (req, res) => {
    let username = req.params.username,
        currentUser = req.user.username;

    Isp.find({}, function(err, isps) {
        // if error occurs
        if (err) {
            console.log(err);
            res.render('error');
        }
        // if no error
        else {
            let page_path = req.path;
            //as we want to show an alert to a just-now registered user, we need to be sure that the originating url contains registeredNow keyword
            if (req.originalUrl.indexOf('registeredNow') != -1) {

                res.render('user/user', { isps: isps, page_path: page_path, currentUser: currentUser, parameter: 'firstTime', profileComplete: profileComplete, canReview: canReview, customerUsername: username });
            }

            else if (req.originalUrl.indexOf('profileComplete') != -1) {

                res.render('user/user', { isps: isps, page_path: page_path, currentUser: currentUser, parameter: 'profileComplete', profileComplete: profileComplete, canReview: canReview, customerUsername: username });
            }
            else if (req.originalUrl.indexOf('profileIncomplete') != -1) {
                res.render('user/user', { isps: isps, page_path: page_path, currentUser: currentUser, parameter: 'profileIncomplete', profileComplete: profileComplete, canReview: canReview, customerUsername: username });
            }
            else {
                res.render('user/user', { isps: isps, page_path: page_path, currentUser: currentUser, parameter: '', profileComplete: profileComplete, canReview: canReview, customerUsername: username });
            }

        }


    })



}
