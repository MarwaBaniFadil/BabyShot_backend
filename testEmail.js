require('dotenv').config(); // Load environment variables
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // Use SSL
    auth: {
        user: process.env.EMAIL_USER, // Email address
        pass: process.env.EMAIL_PASS  // App password
    }
});

// Test Email
transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: 'marwa.bassam.2002@gmail.com', // Replace with your test email
    subject: 'Test Email',
    text: 'This is a test email.',
}, (error, info) => {
    if (error) {
        console.error('Test Email Error:', error);
    } else {
        console.log('Test Email Sent:', info.response);
    }
});
