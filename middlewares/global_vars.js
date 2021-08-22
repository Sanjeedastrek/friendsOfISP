// immutable vars are declared here
const nodemailer = require ('nodemailer');

global.baseURL = `https://isp-listing-test-1-cloned-lazyking.c9users.io`;

global.transporter = nodemailer.createTransport({
    host: 'mail.octoriz.com',
    port: 587,
    secure: false,
    tls: true,
    ignoreTLS: true,
    auth: {
        user: "sanjeeda@octoriz.com",
        pass: "@octopass",
    }
});
global.emailFooter=`<br>Thank You.<br>Octoriz Team`;
// module.exports=currentIsp;