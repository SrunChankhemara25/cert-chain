require('dotenv').config();
const nodemailer = require('nodemailer');
const t = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  logger: true,
  debug: true
});
t.verify().then(r => console.log('SUCCESS', r)).catch(e => console.error('FAIL', e));
