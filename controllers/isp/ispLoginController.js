/** show ISP login form 
 *router.get('/login', ispLoginController.loginForm);
 */

module.exports.loginForm = function(req, res) {
 let page_path = req.path;

 if ((req.originalUrl).indexOf('failureFlash') != -1) {
  console.log(page_path)
  return res.render('isp/ispLogin', { page_path: page_path, failureFlash: 'Either username / password incorrect' });
 }
 res.render('isp/ispLogin', { page_path: page_path, failureFlash: '', currentUser: undefined });
}
