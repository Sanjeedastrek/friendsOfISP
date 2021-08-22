
module.exports.loginForm = function(req, res) {
 let page_path = req.path;

 if ((req.originalUrl).indexOf('failureFlash') != -1) {
  
  return res.render('user/userLogin', { page_path: page_path, failureFlash: 'Either username / password incorrect' });
 }
 res.render('user/userLogin', { page_path: page_path, failureFlash: '' });
}