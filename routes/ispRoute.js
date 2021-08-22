const express = require('express'),

    router = express.Router(),

    packageController = require('../controllers/packageController'),

    userController = require('../controllers/userController'),

    middlewares = require('../middlewares/middlewares')

/** General user (means not registered) can see package details of any registered ISP */
router.post('/packageDetails', packageController.packageDetails)

/** when isp login, it appears */
router.get('/:nameOfIsp', middlewares.checkIspLoginStatus, packageController.showPackage)

/** a create package form displayed (new route), called from button named 'create package' mentioned in showPackageList.ejs */
router.get('/:nameOfIsp/createPackage', middlewares.checkIspLoginStatus, packageController.createPackage)

/** new package is saved to Package model (create route) */
router.post('/:nameOfIsp/savePackage', middlewares.checkIspLoginStatus, packageController.savePackage)

/** update package (update route) */
router.put('/isp/:nameOfIsp/package/:packageName/edit', middlewares.checkIspLoginStatus, packageController.updatePackage)

/** delete package (delete route) */
router.get('/isp/:nameOfIsp/package/:packageName/delete', middlewares.checkIspLoginStatus, packageController.deletePackage)

/** All tickets are displayed (show route) */
router.get('/:isp/:package/ticketNotifications', middlewares.checkIspLoginStatus, packageController.ticketNotifications);

/** ISP verifies user */
router.post('/:customerUsername/verify-user', middlewares.checkIspLoginStatus, packageController.verifyUser);

/** ticket & replies are displayed to isp & isp may reply to ticket also */
router.get('/:package/:ticketId/replyTicket', middlewares.checkIspLoginStatusAndDirectToLogin, packageController.replyTicket)

/** isp reply is saved (update) */
router.put('/:package/:ticketId/replyTicket', middlewares.checkIspLoginStatusAndDirectToLogin, packageController.saveReplyTicket)

/** isp adds location to its profile, mentioned in showPackageList */
router.get('/:nameOfIsp/addLocation', middlewares.checkIspLoginStatus, packageController.addLocation)

/** location saved */
router.post('/:nameOfIsp/addLocation', middlewares.checkIspLoginStatus, packageController.saveAddLocation)

/** location deleted */
router.post('/:nameOfIsp/removeLocation', middlewares.checkIspLoginStatus, packageController.removeLocation)

// 
router.get('/:package/package-action', middlewares.checkIspLoginStatus, packageController.packageAction)

/** show search result without filter (from index to page2) */
router.post('/find-isp', packageController.findIsp)

/** show search result with filter (from page2 to same page using AJAX) */
router.post('/find-isp-detail', packageController.findIspDetail)

/** isp details page (from page2 to page 3) */
router.get('/:nameOfIsp/page', packageController.page)

router.get('/:nameOfIsp/editIspProfile', middlewares.checkIspLoginStatus, packageController.editIspProfile)

router.put('/:nameOfIsp/IspProfile/edit', middlewares.checkIspLoginStatus, packageController.saveIspProfile)

router.get('/:nameOfIsp/uploadLogo', middlewares.checkIspLoginStatus, packageController.uploadLogo)

router.post('/:nameOfIsp/isp/uploadLogo', middlewares.checkIspLoginStatus, packageController.saveUploadLogo)

router.post('/contact-form', packageController.contact)

module.exports = router
