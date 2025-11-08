const nodemailer = require('nodemailer');

// improvement: ইমেইল পাঠানোর লজিক এক জায়গায় রাখা
const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Medicine Shop" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      text: text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = sendEmail;