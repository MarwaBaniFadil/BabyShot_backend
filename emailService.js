const nodemailer = require('nodemailer');

require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// دالة لإرسال البريد الإلكتروني
const sendPasswordResetEmail = async (to, resetToken) => {
    const mailOptions = {
        from: 'your_email@gmail.com', // بريدك الإلكتروني
        to,
        subject: 'إعادة تعيين كلمة المرور',
        text: `يمكنك إعادة تعيين كلمة المرور الخاصة بك باستخدام هذا الرمز: ${resetToken}`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = {
    sendPasswordResetEmail,
};
