const express = require('express'),

    router = express.Router(),

    userController = require('../controllers/userController'),

    middlewares = require('../middlewares/middlewares')


/** forgot password for both of ISP & customer */
router.get('/user/forgot-password', userController.forgotPassword);
router.post('/user/forgot-password', userController.forgotPasswordPost);

/** reset password for both of ISP & customer */
router.get('/reset/:token', userController.resetPassword);
router.post('/reset/:token', userController.resetPasswordPost);

/** when isp login, this route is called */
router.get('/user/:username', middlewares.checkUserLoginStatus, userController.helloUser);

/** to view user profile, for user panel's 'profile' menu */
router.get('/:username/profile', middlewares.checkUserLoginStatus, userController.profile)

/** create user profile (new route) */
router.get('/:username/createProfile', middlewares.checkUserLoginStatus, userController.createProfile)

/** save Profile (create route) */
router.put('/:username/saveProfile', middlewares.checkUserLoginStatus, userController.saveProfile)

/** recieves data from returned packages to ajax response */
router.post('/current-isp-package', middlewares.checkUserLoginStatus, userController.currentIspPackage)

/** user is shown review form (index route) */
router.get('/:username/:isp/:package/review', middlewares.checkUserLoginStatus, userController.createReview)

/** save review (create route) */
router.post('/:username/:isp/:package/review', middlewares.checkUserLoginStatus, userController.saveReview)

/** show reviews to user either logged in or not (show route) */
router.get('/:isp/:package/show-reviews', userController.showReview)

/** show open ticket form to logged in user (new route) */
router.get('/:username/:isp/:package/createTicket', middlewares.checkUserLoginStatus, userController.createTicket)

/** save ticket (create route) */
router.post('/:username/:isp/:package/saveTicket', middlewares.checkUserLoginStatus, userController.saveTicket)

/** User replies to isp's reply (create route) */
router.get('/:username/:ticketId/user/reply-ticket', middlewares.checkUserLoginStatusAndDirectToLogin, userController.replyTicketUser)

/** Customer replies to ISP regarding ticket */
router.post('/:username/:ticketId/user/reply-ticket', middlewares.checkUserLoginStatusAndDirectToLogin, userController.saveReplyTicketUser)

/** when a customer creates tickets, he/she is able to view everything regarding that */
router.get('/:username/ticketNotificationsUser', middlewares.checkUserLoginStatus, userController.ticketNotificationsUser)

module.exports = router
