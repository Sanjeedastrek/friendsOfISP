const Isp = require("../models/isp"),

    Ticket = require("../models/ticket"),
    Reply = require("../models/reply"),
    Package = require("../models/ispPackage"),
    User = require("../models/user"),
    Customer = require("../models/customer"),
    Review = require("../models/review"),
    multer = require('multer'),
    path = require('path');
nodemailer = require('nodemailer');

/** define nodemailer options */
let mailOptionsReplyTicket = {
        from: 'sanjeeda@octoriz.com',
        subject: 'Your ISP sent an explanation to your ticket',
    },
    mailOptionsVerifyUser = {
        from: 'sanjeeda@octoriz.com',
        subject: 'Check status verified by your ISP',
    };

/**/ ////////////////////////////////////////// ROUTES//////////////////////////////////*/

/** Upload ISP logo
 *  router.post('/:currentUser/isp/uploadLogo', middlewares.checkIspLoginStatus,packageController.saveUploadLogo) 
 */
module.exports.saveUploadLogo = (req, res) => {
    let nameOfIsp = req.params.nameOfIsp,
        page_path = req.path; // perhaps not required

    const storage = multer.diskStorage({
            /** destination must be contained in pubic folder */
            destination: './public/img/uploads',
            filename: function(req, file, cb) {
                //define file naming convention
                let logoFile = nameOfIsp + '-' + 'logo' + path.extname(file.originalname);
                cb(null, logoFile);
            },
        }),

        /** initialize upload options */
        upload = multer({
            storage: storage,
            // limite size of image file
            limits: { fileSize: 1000000 },
            fileFilter: function(req, file, cb) {
                checkFileType(file, cb);
            }
        }).single('logo'); //string is the value of 'name' attribute in <input type="">

    /** test the file type of user selected image & send error info if doesn't match, 
     *allows png | jpg | jpeg | gif type image file
     */
    function checkFileType(file, cb) {
        const filetypes = /png|jpg|jpeg|gif/,
            extname = filetypes.test(path.extname(file.originalname).toLowerCase()),
            mimetype = filetypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        else {
            cb(' Error : Please use a png / jpg / jpeg /gif file');
        }
    }

    /** main upload function */
    upload(req, res, err => {
        //if err 
        if (err) {
            res.render('isp/uploadLogo', { msg: err, currentUser: currentUser, page_path: req.path, nameOfIsp: nameOfIsp });
        }
        else {
            if (req.file == undefined) {
                res.render('isp/uploadLogo', { msg: ' Error : No file is selected ', currentUser: currentUser })
            }

            else {

                Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
                    // console.log(nameOfIsp);
                    console.log(isp);
                    console.log(req.file);
                    // we need to store the logo file name in isp model for display
                    let logoFilename = req.file.filename;
                    isp.logo = '/' + logoFilename;
                    isp.save();
                    Package.find({ nameOfIsp: nameOfIsp }, (err, packages) => {
                        packages.forEach(function(package) {
                            package.logo = isp.logo;
                            package.save();
                        })
                        console.log("testing packages got: " + packages);
                    })
                    req.flash('successful-logo-upload', 'You have uploaded logo successfully');
                    res.redirect('/' + nameOfIsp);
                })
            }
        }
    })

}

/** This controller leads up to the main page for ISP after login   
 * router.get('/:nameOfIsp', middlewares.checkIspLoginStatus, packageController.showPackage)
 */
module.exports.showPackage = (req, res) => {
    let nameOfIsp = req.params.nameOfIsp;
    console.log('nameOfIsp from showPackage ' + nameOfIsp);
    console.log('req.params.nameOfIsp ' + req.params.nameOfIsp);

    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
        let locations = isp.location,
            currentUser = req.user.nameOfUser;

        Package.find({ nameOfIsp: nameOfIsp }, (err, packageList) => {
            if (err) {
                console.log(err);
                res.redirect('/');
            }
            else {
                let page_path = req.path;
                if (req.originalUrl.indexOf('packageCreated') != -1) {
                    /** packageCreated object is for showing ISP a popup. if it's not blank, show a popup
                     * verifiedIsp must be passed because we need to check it everytime an ISP logs is
                     */
                    res.render('isp/showPackageList', { packageList: packageList, nameOfIsp: nameOfIsp, locations: locations, isp: isp, currentUser: currentUser, page_path: page_path, packageCreated: 'packageCreated', verifiedIsp: isp.verified });
                }
                else {
                    res.render('isp/showPackageList', { packageList: packageList, nameOfIsp: nameOfIsp, locations: locations, isp: isp, currentUser: currentUser, page_path: page_path, packageCreated: '', verifiedIsp: isp.verified });
                }
            }
        })
    })
}

/** displays create package form (new route)
 * router.get('/:nameOfIsp/createPackage', middlewares.checkIspLoginStatus, packageController.createPackage)
 */
module.exports.createPackage = (req, res) => {
    let nameOfIsp = req.params.nameOfIsp,
        page_path = req.path;

    res.render("isp/createPackage", { nameOfIsp: nameOfIsp, page_path: page_path, currentUser: currentUser, verifiedIsp: true });
}

/** save package into Package model (create route)
 * router.post('/:nameOfIsp/savePackage', middlewares.checkIspLoginStatus, packageController.savePackage)
 */
module.exports.savePackage = (req, res) => {
    let nameOfIsp = req.params.nameOfIsp;
    console.log('from savePacakge ' + nameOfIsp);

    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
        isp.packageCounter += 1;
        isp.save();

        /** save package info into Package model */
        Package.create({
            packageName: req.sanitize(req.body.packageName),
            normalSpeed: req.sanitize(req.body.normalSpeed),
            bdixSpeed: req.sanitize(req.body.bdixSpeed),
            googleSpeed: req.sanitize(req.body.googleSpeed),
            packagePrice: req.sanitize(req.body.packagePrice),
            isp: req.sanitize(req.body._id),
            nameOfIsp: nameOfIsp,
            ispUsername: isp.username,
            messengerLink: isp.messengerLink
        }, function(err, package) {
            if (err) {
                console.log(err);
            }
            else {
                res.redirect('/' + nameOfIsp + '?packageCreated');
            }
        })
    })
}

/** Edit package (edit route)
 * 
 */
module.exports.editPackageForm = (req, res) => {

    let packageName = req.params.packageName,
        nameOfIsp = req.params.nameOfIsp,
        page_path = req.path;
    Package.findOne({ packageName: packageName }, function(err, package) {
        if (err) {
            console.log(err);
            res.redirect('/');
        }
        else {
            var editPackage = {
                packageId: package._id,
                packageName: package.packageName,
                normalSpeed: package.normalSpeed,
                bdixSpeed: package.bdixSpeed,
                googleSpeed: package.googleSpeed,
                packagePrice: package.packagePrice
            }
            res.render('isp/editPackage', { packageName: packageName, nameOfIsp: nameOfIsp, package: editPackage, page_path: page_path, currentUser: package.nameOfIsp, verifiedIsp: true });
        }
    })

}

// saves edited package (package update route)
module.exports.updatePackage = (req, res) => {
    var nameOfIsp = req.params.nameOfIsp,
        packageName = req.params.packageName,
        retrievedPackageInfo = req.body.package;
    console.log(retrievedPackageInfo);

    // first find out the specific package Id
    Package.findOne({ packageName: packageName }, function(err, package) {
        var packageId = package._id;

        // then update package

        Package.findByIdAndUpdate(packageId, retrievedPackageInfo, function(err, retrievedPackage) {
            if (err) {
                console.log(err);
                res.redirect('/isp/' + nameOfIsp + '/package-list');
            }
            else {
                // console.log(package);
                // reflect edite package-name to isp, review, ticket, user collections
                Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
                    let pfc = isp.profileCompleteNotifications;
                    for (let i = 0; i < pfc.length; i++) {
                        if (pfc[i].package === packageName) {
                            pfc[i].package = retrievedPackageInfo.packageName;
                        }
                    }
                    isp.save();
                    console.log(isp); //ok
                    currentUser = isp.username;
                })

                Review.find({ isp: nameOfIsp, package: packageName }, (err, reviews) => {
                    reviews.forEach(function(review) {
                        review.package = retrievedPackageInfo.packageName;
                        review.save(); //ok
                    })
                })

                Ticket.find({ isp: nameOfIsp, package: packageName }, (err, tickets) => {
                    tickets.forEach(function(ticket) {
                        ticket.package = retrievedPackageInfo.packageName;
                        ticket.save(); //ok
                    })
                })
                User.find({ nameOfUser: nameOfIsp, package: packageName }, (err, users) => {
                    users.forEach(function(user) {
                        user.package = retrievedPackageInfo.packageName;
                        user.save(); //ok
                    })
                })
                req.flash("after-successful-package-edit", packageName + " is edited successfully");
                // res.redirect('/' + nameOfIsp);
                res.redirect('/' + nameOfIsp);
            }
        })
    })

}
// deletes package (delete route )

module.exports.deletePackage = (req, res) => {
    let nameOfIsp = req.params.nameOfIsp,
        packageName = req.params.packageName;

    // first find out the specific package Id
    Package.findOne({ packageName: packageName }, function(err, package) {
        let packageId = package._id;

        if (err) {
            console.log(err);
        }
        else {
            // then remove that package

            Package.findOneAndDelete({ _id: packageId }, function(err) {
                if (err) {
                    console.log(err);
                    res.redirect('/');
                }
                else {
                    console.log("removed");
                    req.flash("after-successful-package-delete", packageName + " is deleted successfully");
                    res.redirect('/' + nameOfIsp);
                }
            })
        }
        // then update package


    })
}

// perhaps not necessary because in packageDetails these actions are incorporated
// Pacakge-wise ISP sees a tabular view of all user profile completion notification, mentioned in showPackageList.ejs as a button named pending profile 
// module.exports.profileCompleteNotifications = (req, res) => {
//     // find out package-wise notifications from respective isp document
//     let isp = req.params.isp,
//         package = req.params.package;
//     console.log("testing isp "+isp+"\n testing package "+package);
//     // Isp.findOne({nameOfIsp: isp}).populate('profileCompleteNotifications').exec((err, isp) => {
//     Isp.findOne({nameOfIsp: isp}, (err, isp) => {
//         console.log("isp "+isp);
//         let notifications = isp.profileCompleteNotifications,
//             packageSpecificNotifications = [];
//         console.log("notification length "+notifications.length);
//         // if (notifications.length>0)
//           for(let i=0;i<notifications.length;i++){
//         // notifications.forEach(function(notification) {
//             // if (notification.package === package) {
//             if(notifications[i].package == package) {
//                 // packageSpecificNotifications.push(notification);
//                 packageSpecificNotifications.push(notifications[i]);
//                 // console.log("1 testing packageSpecificNotifications.push(notification): "+notification)
//                 console.log("1 testing packageSpecificNotifications: "+packageSpecificNotifications);
//             }
//         }

//           console.log("2 testing packageSpecificNotifications: "+packageSpecificNotifications.length)
//         res.render("isp/profileCompleteNotifications", {notifications: packageSpecificNotifications});
//     })
// }

/**
 isp verifies user, a post method action called from profileCompleteNotification.ejs
router.post('/:customerUsername/verify-user', middlewares.checkIspLoginStatus, packageController.verifyUser);
*/
module.exports.verifyUser = (req, res) => {

    //user should be customer, userName should be customerUsername, nameOfUser should be nameOfCustomer
    let verify = req.sanitize(req.body.userVerification),
        customerUsername = req.params.customerUsername;
    console.log('got from verifyUser ' + req.params.customerUsername); //ok
    console.log('verify ' + req.body.userVerification); //undefined

    /** we need to know customer ID */
    Customer.findOne({ username: customerUsername }, async function(err, customer) {

        let customerId = customer.customerId,
            pkg = customer.package,
            nameOfIsp = customer.nameOfIsp;
        console.log('1111111111');
        if (err) {
            console.log("Problems found while ISP verify user.  " + err);
            res.redirect("/");
        }
        else if (!customer) {
            console.log('customer not found with this username ' + customerUsername);
            res.redirect("/");
        }
        else {
            console.log('222222');
            await Isp.findOne({ nameOfIsp: nameOfIsp }, function(err, ispDetails) {

                /**
                 if verfiy is valid, delete that specific profileCompleteNotification from isp and change ispVerificationStatus to 2
                else delete that specific notification and change ispVerificationStatus to 3, in both cases send user a mail informing him status
                */
                try {

                    mailOptionsVerifyUser.to = customer.email;
                    let pro = ispDetails.profileCompleteNotifications;

                    pro.forEach(function(notification) {


                        if (notification.customerId === customerId) {
                            console.log('some customer id matches');

                            if (verify === 'valid') {
                                console.log("2. if valid " + notification.customerId + " verify " + verify);
                                notification.remove();
                                ispDetails.save();
                                customer.ispVerificationStatus = 2; //set ispVerificationStatus to 2 means valid
                                mailOptionsVerifyUser.html = '<body><h3>Dear ' + customer.nameOfCustomer + ',</h3><p>' + customer.nameOfIsp + ' verified you as their valuable client. So now you can easily review & create ticket if required.</p><br>' + emailFooter + '</body>';
                            }
                            else if (verify === 'invalid') {
                                console.log("3. if not valid " + notification.customerId + " verify " + verify);
                                notification.remove();
                                ispDetails.save();
                                customer.ispVerificationStatus = 3; // set ispVerificationStatus to 3 means invalid
                                mailOptionsVerifyUser.html = '<body><h3>Dear ' + customer.nameOfCustomer + '</a>,</h3><p>' + customer.nameOfIsp + '</a> verified you as invalid. Perhaps you put wrong information mistakenly. Please <a href=' + baseURL + '/user-login> login </a> to complete your profile properly.</p><br>' + emailFooter + '</body>';
                            }
                            customer.save();
                            transporter.sendMail(mailOptionsVerifyUser, (error, info) => { // let's send email
                                if (error) {
                                    console.log(error);
                                    console.log("5. mail not sent: " + customer.email);
                                }
                                else {
                                    console.log("5. Successful. email sent to: " + customer.email);
                                }
                            })
                            // res.redirect('/' + pkg + '/package-action?verify');
                            res.redirect('/' + pkg + '/package-action?verified');

                        }

                        // if customerId matches we remove the notification 


                    })
                }
                catch (e) {
                    console.log('error from async await: ' + e);
                    res.redirect('/');
                }



            })
            console.log("out of place");
        }
    })
}

/** Pacakge-wise ISP sees a tabular view of all user profile completion notifications, mentioned in showPackageList.ejs as a button named 'pending profile'
 * router.get('/:isp/:package/ticketNotifications', middlewares.checkIspLoginStatus, packageController.ticketNotifications);
 */
module.exports.ticketNotifications = (req, res) => {
    // we'll cross-check the customerId of profileCompleteNotifications path in ISP collection with that of user table
    let isp = req.params.isp,
        package = req.params.package,
        page_path = req.path;

    Ticket.find({ isp: isp, package: package }, (err, ticketAll) => {

        res.render("isp/ticketNotifications", { ticketAll: ticketAll, page_path: page_path, currentUser: currentUser, verifiedIsp: true });
    })
}

/** ISP is directed to ticket page to see the issue posted by user, isp may also reply 
 * router.get('/:package/:ticketId/replyTicket', middlewares.checkIspLoginStatusAndDirectToLogin, packageController.replyTicket)
 */
module.exports.replyTicket = (req, res) => {
    console.log("replyTicket ");
    let ticketId = req.params.ticketId,
        page_path = req.path;

    Ticket.findOne({ ticketId: ticketId }).populate('replies').exec((err, ticket) => {
        let replies = ticket.replies;
        console.log("replies " + replies);
        res.render('isp/replyTicket', { ticket: ticket, replies: replies, page_path: page_path, currentUser: currentUser, verifiedIsp: true });
    })
}

/** isp reply to ticket is saved (update)
 * router.put('/:package/:ticketId/replyTicket', middlewares.checkIspLoginStatusAndDirectToLogin, packageController.saveReplyTicket)
 */
module.exports.saveReplyTicket = (req, res) => {
    let ticketId = req.params.ticketId,
        reply = req.sanitize(req.body.reply),
        status = req.sanitize(req.body.status),
        dept = req.sanitize(req.body.department)
    Isp.findOne({ username: currentUser }, (err, isp) => {
        let nameOfIsp = isp.nameOfIsp,
            currentUser = isp.nameOfIsp;
        console.log(nameOfIsp);
        // Save the reply in reply collection & the uuid in ticket collection, send user the reply by email
        Reply.create({
                replyerType: 'ISP',
                ticketId: ticketId,
                name: currentUser, //changed currentUser
                reply: reply,
                nameOfReplier: nameOfIsp,
                status: status == 'issue solved' ? 2 : 1
            },
            function(err, reply) {
                if (err) {
                    console.log(" Cant save reply " + err);
                }
                else {

                    Ticket.findOne({ ticketId: ticketId }).populate('replies').exec((err, ticket) => {
                        ticket.replies.push(reply);
                        // when isp replies ticket, it's important to set ticketStatus to 1
                        ticket.ticketStatus = 1;

                        // if ISP changes the deparment, we should reflect it in ticket table
                        //change following to ternary
                        if (dept) {
                            ticket.department = dept;
                        }
                        ticket.save();
                        // send reply to user thru mail
                        mailOptionsReplyTicket.to = ticket.userEmail;

                        mailOptionsReplyTicket.html = '<body><h3>Dear ' + ticket.opener + '</a>,</h3><br><p>' + reply.nameOfReplier + ' sent you reply to the ticket ' + reply.ticketId + ' with these info- Solution: ' + reply.reply + ', Status: ' + reply.status + '</p><a href=' + baseURL + '/' + ticket.opener + '/' + ticket.ticketId + '/user/reply-ticket> Please Click this to resolve the ticket</a></p><br>' + emailFooter + '</body>';

                        transporter.sendMail(mailOptionsReplyTicket, (error, info) => { // let's send email
                            if (error) {
                                console.log(error);
                            }
                            else {
                                console.log("Successful. email sent to: " + ticket.userEmail);
                            }
                        })
                        console.log(reply);
                        res.redirect("/" + currentUser);
                    })
                }
            })
    })
}

/** isp adds location of service, mentioned in showPackageList as 'Add Location'
 * router.get('/:nameOfIsp/addLocation', middlewares.checkIspLoginStatus, packageController.addLocation)
 */
module.exports.addLocation = (req, res) => {
    let page_path = req.path,
        nameOfIsp = req.params.nameOfIsp;
    res.render("isp/addLocation", { page_path: page_path, currentUser: currentUser, nameOfIsp: nameOfIsp, verifiedIsp: true });
}

/** location is saved
 *router.post('/:nameOfIsp/addLocation', middlewares.checkIspLoginStatus, packageController.saveAddLocation)
 */
module.exports.saveAddLocation = (req, res) => {
    let loc = req.body.location,
        nameOfIsp = req.params.nameOfIsp,
        success;

    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
        console.log('username is ' + currentUser + ' isp name is ' + nameOfIsp);
        if (loc != "") {

            if (isp.location.indexOf(loc) == -1) { //prevent duplicate location entry
                isp.location.push(loc);
                isp.save();
                success = 1;
                res.send(loc);
            }
            else {
                success = 0;
                res.send('nothing');
            }
        }
        else {
            res.send('blank');
        }
    })
}

/** deletes location (delete route) 
 * router.post('/:nameOfIsp/removeLocation', middlewares.checkIspLoginStatus, packageController.removeLocation)
 */
module.exports.removeLocation = (req, res) => {
    console.log('removeLocation accessed');
    let loc = req.body.location,
        nameOfIsp = req.params.nameOfIsp;

    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {

        if (loc != "") {
            let location = isp.location;

            function isEqual(element) {
                return element == loc;
            }
            let ll = location.findIndex(isEqual);
            console.log(location.findIndex(isEqual));

            location.splice(loc, 1);
            isp.save();
        }
        res.send(loc);
    })
}

/** ISP can edit package, view profile complete notifications sent by customer, ticket notifications & reviews of respective package
 * router.get('/:package/package-action', middlewares.checkIspLoginStatus, packageController.packageAction)
 */
module.exports.packageAction = (req, res) => {
    let packageName = req.params.package,
        page_path = req.path;
    console.log("package is " + packageName);
    Package.findOne({ packageName: packageName }, function(err, package) {
        let nameOfIsp = package.nameOfIsp;
        console.log("testing nameOfIsp " + nameOfIsp); //ok
        /** We need to query isp model to access its profileCompleteNotifications(array type) path*/
        Isp.findOne({ nameOfIsp: nameOfIsp }, function(err, isp) {

            let notifications = isp.profileCompleteNotifications,
                packageSpecificNotifications = [];
            console.log("notification length " + notifications.length);

            for (let i = 0; i < notifications.length; i++) {

                if (notifications[i].package === packageName) {

                    packageSpecificNotifications.push(notifications[i]);
                }
            }

            Ticket.find({ isp: nameOfIsp, package: packageName }, (err, ticketAll) => {
                Review.find({ package: packageName }, (err, reviewAll) => {
                    if (req.originalUrl.indexOf('verified') != -1) {
                        console.log('from verify');
                        res.render("isp/packageAction", {
                            package: package,
                            notifications: packageSpecificNotifications,
                            ticketAll: ticketAll,
                            reviewAll: reviewAll,
                            page_path: page_path,
                            currentUser: isp.nameOfIsp,
                            verified: 'verified',
                            verifiedIsp: true
                        });
                    }
                    else {
                        console.log('from not verify');
                        res.render("isp/packageAction", {
                            package: package,
                            notifications: packageSpecificNotifications,
                            ticketAll: ticketAll,
                            reviewAll: reviewAll,
                            page_path: page_path,
                            currentUser: isp.nameOfIsp,
                            verified: '',
                            verifiedIsp: true
                        });
                    }
                })
            })
        })
    })
}

/** find isp (this is for index.ejs)
 * router.post('/find-isp', packageController.findIsp)
 */
module.exports.findIsp = function(req, res) {
    let lowerValue = req.body.lowerValue,
        upperValue = req.body.upperValue,
        location = req.body.location,
        isp = req.body.isp,

        resultIspArray = [],
        resultPackageArray = [],
        result,
        message,
        page_path = req.path;

    console.log("lowerValue= " + lowerValue + " upperValue= " + upperValue + " location= " + location + " isp= " + isp);

    /** retrieve the isps which provide service in desired location & push those to resultIspArray
     * if user selects isp
     */
    if (isp != "") {

        /** to find isp
         * step 1. find out input isp's all locations
         * step 2. compare input location. if location matches go to step 3 else exit
         * step 3. find out available packages of the isp
         * step 4. compare input price.
         */

        /** step 1 */
        Isp.findOne({ nameOfIsp: isp }, (err, isp) => {

            result = isp;
            // this condition is always true so no else condition mentioned
            if (result) {
                let ispLocations = isp.location;
                ispLocations.forEach(function(ispLocation) {
                    console.log("1. reach ispLocations"); //
                    /** if user input matches with db location
                     * step 2
                     */
                    if (ispLocation == location) {
                        resultIspArray.push(result);
                        console.log("2. location matches");
                    }
                })

                /** if a location matches, let's now compare the package price in Package model */

                if (resultIspArray.length > 0) {

                    console.log("3. got resultIspArray"); //
                    resultIspArray.forEach(function(resultIspArrayElement) {
                        /** step 3 */
                        Package.find({ nameOfIsp: resultIspArrayElement.nameOfIsp }, (err, packages) => {
                            console.log("1. inside Package"); //
                            /** if packages of that isp are found */
                            if (packages.length > 0) {
                                console.log("2. got at least 1 package"); //
                                packages.forEach(function(package) {

                                    let price = package.packagePrice;
                                    console.log("3. let's check price"); //
                                    // step 4
                                    if (price >= lowerValue && price <= upperValue) {
                                        package.logo = isp.logo;
                                        resultPackageArray.push(package);
                                    }
                                })

                                Isp.find({}, (err, ispAll) => {
                                    console.log(resultPackageArray);

                                    res.render("page2", {
                                        packages: resultPackageArray,
                                        isps: ispAll,
                                        page_path: page_path

                                    })
                                })

                            }
                            else {
                                // as the search form also exists in page 2, we need to pass all ISP so that in select isp field the isps are shown
                                Isp.find({}, (err, ispAll) => {
                                    res.render("page2", { packages: resultPackageArray, isps: ispAll, page_path: page_path })
                                })
                            }
                        })
                    })
                }
                else {
                    Isp.find({}, (err, ispAll) => {
                        res.render("page2", { packages: resultPackageArray, isps: ispAll, page_path: page_path })
                    })
                }
            }
        })
    }
    else if (isp == "") { //if user leaves isp field blank
        /** to find isp
         * step 1. find out all isp
         * step 2. compare input location with locations of all isp. if location matches go to step 3 else exit
         * step 3. find out available packages of the isp
         * step 4. compare input price.
         */

        /** step 1
         * generally it's always true
         */
        Isp.find({}, (err, isps) => {
            /** if we get an isp, generally it's always true */
            if (isps) {
                isps.forEach(function(eachIsp) {
                    let ispLocations = eachIsp.location;
                    ispLocations.forEach(function(ispLocation) {
                        console.log("1. reach ispLocations"); //
                        //if user input matches with db location
                        // step 2
                        if (ispLocation == location) {
                            resultIspArray.push(eachIsp);
                            console.log("2. location matches");
                        }
                    })
                })

                /** if a location matches, compare the package price in Package model */
                if (resultIspArray.length > 0) {
                    console.log("3. got resultIspArray"); //
                    resultIspArray.forEach(function(resultIspArrayElement) {
                        // step 3
                        Package.find({ nameOfIsp: resultIspArrayElement.nameOfIsp }, (err, packages) => {
                            console.log("4. got packages"); //
                            // it's always true so no else condition mentioned
                            if (packages.length > 0) {
                                console.log("5. got at least 1 package"); //
                                packages.forEach(function(package) {
                                    let price = package.packagePrice;
                                    console.log("6. let's check price");
                                    // step 4
                                    if (price >= lowerValue && price <= upperValue) {
                                        resultPackageArray.push(package);
                                    }
                                })
                            }
                        })
                    })

                    Isp.find({}, (err, ispAll) => {
                        console.log(resultPackageArray)
                        message = "package found ";
                        res.render("page2", {
                            packages: resultPackageArray,
                            message: message,
                            isps: ispAll,
                            page_path: page_path,

                        })
                    })

                }
                else {
                    Isp.find({}, (err, ispAll) => {
                        console.log("location doesn't match");
                        res.render("page2", { packages: resultPackageArray, isps: ispAll, page_path: page_path })
                    })
                }
            }
        })

    }

}

/** find isp (this is for page2.ejs)
 * router.post('/find-isp-detail', packageController.findIspDetail)
 */
module.exports.findIspDetail = function(req, res) {
    var lowerValue = req.body.lowerValue,
        upperValue = req.body.upperValue,
        location = req.body.location,
        isp = req.body.isp,
        resultIspArray = [],
        filterParameter = req.body.filterParameter,

        resultPackageArray = [],
        result,
        message;

    console.log("lowerValuedsddds= " + lowerValue + " upperValue= " + upperValue + " location= " + location + " isp= " + isp);

    /** retrieve the isps which provide service in desired location & push those to resultIspArray
     * if user selects isp
     */
    if (isp != "") {

        /**  to find isp
         * step 1. find out input isp's all locations
         * step 2. compare input location. if location matches go to step 3 else exit
         * step 3. find out available packages of the isp
         * step 4. compare price.
         */

        /** step 1 */
        Isp.findOne({ nameOfIsp: isp }, (err, isp) => {

            result = isp;

            /** this condition is always true so no else condition mentioned */
            if (result) {
                let ispLocations = isp.location;
                ispLocations.forEach(function(ispLocation) {
                    console.log("1. reach ispLocations"); //
                    /** if user input matches with db location
                     * step 2
                     */
                    if (ispLocation == location) {
                        resultIspArray.push(result);
                        console.log("2. location matches");
                    }
                })

                /** if a location matches, let's now compare the package price in Package model */

                if (resultIspArray.length > 0) {

                    console.log("3. got resultIspArray"); //
                    resultIspArray.forEach(function(resultIspArrayElement) {
                        // step 3
                        Package.find({ nameOfIsp: resultIspArrayElement.nameOfIsp }, (err, packages) => {
                            console.log("1. inside Package"); //
                            // if packages of that isp are found
                            // console.log("packages " +packages)
                            if (packages.length > 0) {
                                console.log("2. got at least 1 package"); //
                                packages.forEach(function(package) {
                                    let price = package.packagePrice;
                                    console.log("3. let's check price"); //
                                    // step 4
                                    if (price >= lowerValue && price <= upperValue) {
                                        resultPackageArray.push(package);
                                        // resultPackageArray.
                                    }
                                })

                                if (resultPackageArray.length > 0) {
                                    Isp.find({}, (err, ispAll) => {
                                        console.log(resultPackageArray);
                                        res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                                    })
                                }
                                else {
                                    Isp.find({}, (err, ispAll) => {
                                        console.log("price doesn't matchgfgfd");
                                        message = "price doesn't match";
                                        res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                                    })
                                }
                            }
                            else {
                                /** as the search form also exists in page 2, we need to pass all ISP so that in select isp field the isps are shown */
                                Isp.find({}, (err, ispAll) => {
                                    console.log("package isn't found");
                                    message = "package isn't found";
                                    res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                                })
                            }
                        })
                    })
                }
                else {
                    Isp.find({}, (err, ispAll) => {
                        console.log("location doesn't match");
                        message = "location doesn't match";
                        res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                    })
                }

            }
        })
    }
    else if (isp == "") { //if user leaves isp field blank
        /** to find isp
         * step 1. find out all isp
         * step 2. compare input location with locations of all isp. if location matches go to step 3 else exit
         * step 3. find out available packages of the isp
         * step 4. compare input price.
         */

        /** step 1
         * generally it's always true
         */
        Isp.find({}, (err, isps) => {
            console.log("length of result2: " + isps.length)
            /** if we get an isp, generally it's always true */
            if (isps) {
                isps.forEach(function(eachIsp) {
                    let ispLocations = eachIsp.location;
                    ispLocations.forEach(function(ispLocation) {
                        console.log("1. reach ispLocations"); //
                        /** if user input matches with db location
                         * step 2
                         */
                        if (ispLocation == location) {
                            resultIspArray.push(eachIsp);
                            console.log("2. location matches");
                        }
                    })
                })

                /** if a location matches, compare the package price in Package model */
                if (resultIspArray.length > 0) {
                    console.log("3. got resultIspArray"); //
                    resultIspArray.forEach(function(resultIspArrayElement) {
                        /** step 3 */
                        Package.find({ nameOfIsp: resultIspArrayElement.nameOfIsp }, (err, packages) => {
                            console.log("4. got packages"); //
                            /** it's always true so no else condition mentioned */
                            if (packages.length > 0) {
                                console.log("5. got at least 1 package"); //
                                packages.forEach(function(package) {
                                    let price = package.packagePrice;
                                    console.log("6. let's check price");
                                    // step 4
                                    if (price >= lowerValue && price <= upperValue) {
                                        resultPackageArray.push(package);
                                    }
                                })
                            }
                        })
                    })

                    if (resultPackageArray.length > 0) {
                        Isp.find({}, (err, ispAll) => {
                            console.log(resultPackageArray);
                            res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                        })
                    }
                    else {
                        Isp.find({}, (err, ispAll) => {
                            console.log("price doesn't sdssfdsmatch")
                            message = "price doesn't match";
                            res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                        })
                    }
                }
                else {
                    Isp.find({}, (err, ispAll) => {
                        console.log("location doesn't match");
                        message = "location doesn't match";
                        res.send({ packages: resultPackageArray, message: 'fine', isps: ispAll });
                    })
                }
            }
        })

    }
}


/** this renders page3.ejs which contains isp info like packages, location, about
 * router.get('/:nameOfIsp/page', packageController.page)
 */
module.exports.page = (req, res) => {

    let nameOfIsp = req.params.nameOfIsp,
        page_path = req.path;

    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
        let ispLocations = isp.location;

        Package.find({ nameOfIsp: nameOfIsp }, (err, packages) => {
            let sum = 0;
            packages.forEach(function(package) {
                let pr = package.averageRating;
                sum = sum + pr;
            })
            let ispRating = sum / (packages.length),
                baseURL = `https://isp-listing-test-1-cloned-lazyking.c9users.io` ;

            res.render("page3", { isp: isp, ispLocations: ispLocations, packages: packages, ispRating: ispRating, page_path: page_path, baseURL : baseURL });
        })
    })

}

/** this renders ISP's individual package info 
 * router.post('/packageDetails', packageController.packageDetails)
 */

module.exports.packageDetails = (req, res) => {

    let ispName = req.body.ispName,
        packageName = req.body.packageName,
        retrievedReviews = [],
        page_path = req.path;

    Package.findOne({ packageName: packageName })
        .populate('reviews')
        .exec((err, package) => {

            if (err) {
                console.log("Having problems to get package info \n" + err);
            }
            else {
                var reviews = package.reviews,
                    reviewContent = "";

                Review.find({ isp: ispName, package: packageName }, async function(err, reviewAll) {

                    if (err) {
                        console.log("Having problems to get reviews \n" + err);
                    }
                    else {
                        try {
                            let retrievedReviews = [];

                            // await reviewAll.forEach(async function(review){
                            for (let i = 0; i < reviewAll.length; i++) {
                                let review = reviewAll[i];

                                await User.findOne({ username: review.user }, function(err, user) {
                                    console.log(" 1: " + user.nameOfUser + "2 " + review.user);
                                    let nameOfUser = user.nameOfUser;

                                    retrievedReviews.push({
                                        rating: review.rating,
                                        comment: review.comment,
                                        reviewDate: review.reviewDate,
                                        nameOfUser: nameOfUser
                                    });

                                });

                                console.log(" 4: " + retrievedReviews);

                            }

                            console.log(" 3: " + retrievedReviews);
                            console.log(package.messengerLink);
                            res.send({
                                ispName: ispName,
                                packageName: packageName,
                                package: package,
                                reviews: reviews,
                                reviewAll: retrievedReviews
                            });
                        }


                        catch (e) {
                            if (e) {
                                res.redirect('/');
                            }
                        }
                    }
                });

            }
        });

}
/** 'edit profile' button controller 
 * router.get('/:nameOfIsp/editIspProfile', middlewares.checkIspLoginStatus, packageController.editIspProfile)
 */
module.exports.editIspProfile = (req, res) => {

    let nameOfIsp = req.params.nameOfIsp,
        page_path = req.path;
    console.log(nameOfIsp);
    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
        currentUser = isp.username;
        res.render("isp/editIspProfile", { isp: isp, nameOfIsp: nameOfIsp, page_path: page_path, currentUser: currentUser, verifiedIsp: true });
    });
}

/** upload logo button in showPackageList.ejs
 * router.get('/:nameOfIsp/uploadLogo', middlewares.checkIspLoginStatus, packageController.uploadLogo)
 */
module.exports.uploadLogo = (req, res) => {
    let nameOfIsp = req.params.nameOfIsp,
        page_path = req.path;
    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {
        currentUser = isp.username;
        res.render("isp/uploadLogo", { isp: isp, nameOfIsp: nameOfIsp, page_path: page_path, currentUser: currentUser, verifiedIsp: true });
    })
}


/** save isp profile
 * router.put('/:nameOfIsp/IspProfile/edit', middlewares.checkIspLoginStatus, packageController.saveIspProfile) 
 */
module.exports.saveIspProfile = (req, res) => {
    let ispInfo = req.body.isp,
        nameOfIsp = req.params.nameOfIsp;

    // set storage engine

    Isp.findOne({ nameOfIsp: nameOfIsp }, (err, isp) => {

        Package.findOne({ nameOfIsp: nameOfIsp }, (err, package) => {
            isp.establishedOn = ispInfo.establishedOn;
            isp.phone = ispInfo.phone;
            isp.registrationNumber = ispInfo.registrationNumber;
            isp.about = ispInfo.about;
            isp.headOffice = ispInfo.headOffice;
            isp.messengerLink = ispInfo.messengerLink;

            /** we need to define ispProfileComplete value as depending on this, ISP gets a flash message after login */
            if (isp.establishedOn && isp.phone && isp.registrationNumber && isp.about && isp.headOffice && isp.logo) {
                isp.ispProfileComplete = true;
            }
            else {
                isp.ispProfileComplete = false;
            }
            isp.save();
            if (package) {
                package.messengerLink = ispInfo.messengerLink;
                package.save();
            }
            res.redirect('/' + nameOfIsp);
        })
    })
}

/** when user submits contact form in home page, mail sent to info@octoriz.com 
 * router.post('/contact-form', packageController.contact)
 */

module.exports.contact = (req, res) => {
    let name = req.sanitize(req.body.name),
        email = req.sanitize(req.body.email),
        phone = req.sanitize(req.body.phone),
        message = req.sanitize(req.body.message);
    // res.send("name = "+name+" email "+email+" phone "+phone+" message"+message); //fine


    let contactOptions = {
        from: email,
        subject: ' contact form filled from isp listing website',
        to: 'info@octoriz.com',
        html: '<body><h3>Dear Octoriz,</h3><p>' + name + ' sent you from ' + email + ', ' + phone + ' with message: ' + message + '.</p></body>'
    }

    transporter.sendMail(contactOptions, (error, info) => { // let's send email
        if (error) {
            console.log(error);
            console.log("mail not sent: ");
        }
        else {
            console.log("Successful. email sent ");
        }
    })
}
