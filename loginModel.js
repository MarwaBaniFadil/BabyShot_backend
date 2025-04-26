const db = require('../config/dbconnection');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid'); // لتوليد رمز فريد
const nodemailer = require('nodemailer'); // استيراد مكتبة Nodemailer
require('dotenv').config();

// إعدادات البريد الإلكتروني
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
    },
});

// دالة تسجيل الدخول
// دالة تسجيل الدخول
exports.login = async (req, res) => {
    console.log('Login endpoint hit');
    const { email, password, deviceToken } = req.body;  // إضافة deviceToken من الطلب

    try {
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.query(sql, [email], async (error, results) => {
            if (error) {
                console.error('Error fetching user:', error);
                return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'البريد الإلكتروني غير موجود' });
            }

            const user = results[0];

            // التحقق من كلمة المرور
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ message: 'كلمة المرور غير صحيحة' });
            }

            let clinic_id = null;  // سيتم تعريفه لاحقًا إذا كان المستخدم دكتور أو أدمن
            let roleMessage = '';  // سيتم تعريفه بناءً على الدور

            // إذا كان المستخدم دكتور أو أدمن، نبحث عن رقم العيادة
            if (user.role === "Doctor" || user.role === "Admin") {
                // استعلام للبحث عن الـ clinic_id من جدول clinic_staff
                const clinicStaffSql = `SELECT clinic_id FROM clinic_staff WHERE user_id = ? AND role = ?`;
                db.query(clinicStaffSql, [user.user_id, user.role], async (error, staffResults) => {
                    if (error) {
                        console.error('Error fetching clinic info:', error);
                        return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
                    }

                    if (staffResults.length === 0) {
                        return res.status(401).json({ message: 'المستخدم غير مرتبط بأي عيادة' });
                    }

                    clinic_id = staffResults[0].clinic_id;

                    // طلب اسم العيادة من الـ API بناءً على رقم العيادة
                    const response = await fetch(`http://localhost:8888/APIS/showclinicnameByid/${clinic_id}`);
                    const clinicData = await response.json();

                    const clinicName = clinicData.users.length > 0 ? clinicData.users[0].name : "غير معروف";

                    // بناء الرسالة حسب الدور
                    if (user.role === "Doctor") {
                        roleMessage = `مرحبا يا دكتور رقم ${user.user_id} في عيادة ${clinicName}`;
                    } else if (user.role === "Admin") {
                        roleMessage = `مرحبا بك في صفحة ادمن  ${clinicName}`;
                    }

                    // إنشاء التوكن مع إضافة `clinic_id` و `roleMessage`
                    const token = jwt.sign(
                        { 
                            id: user.user_id, 
                            email, 
                            userRole: user.role, 
                            clinic_id, 
                            roleMessage 
                        },
                        process.env.JWT_SECRET, 
                        { expiresIn: '1h' }
                    );

                    // حفظ deviceToken في جدول device_token
                    if (deviceToken) {
                        const insertDeviceTokenSql = `INSERT INTO device_tokens (parent_id, device_token) VALUES (?, ?)`;
                        db.query(insertDeviceTokenSql, [user.user_id, deviceToken], (error, result) => {
                            if (error) {
                                console.error('Error inserting device token:', error);
                            }
                        });
                    }

                    // إرجاع الرد مع الرسالة
                    res.status(200).json({
                        message: 'تم تسجيل الدخول بنجاح!',
                        role: user.role,
                        roleMessage: roleMessage,
                        token: token,
                        clinic_id: clinic_id
                    });
                });
            } else {
                // في حال كان المستخدم ليس دكتور أو أدمن
                const token = jwt.sign(
                    { 
                        id: user.user_id, 
                        email, 
                        userRole: user.role 
                    },
                    process.env.JWT_SECRET, 
                    { expiresIn: '1h' }
                );

                // حفظ deviceToken في جدول device_token
                if (deviceToken) {
                    const insertDeviceTokenSql = `INSERT INTO device_tokens (parent_id, device_token) VALUES (?, ?)`;
                    db.query(insertDeviceTokenSql, [user.user_id, deviceToken], (error, result) => {
                        if (error) {
                            console.error('Error inserting device token:', error);
                        }
                    });
                }

                res.status(200).json({
                    message: 'تم تسجيل الدخول بنجاح!',
                    role: user.role,
                    token: token
                });
            }
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
};



// دالة لطلب إعادة تعيين كلمة المرور
exports.requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    try {
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.query(sql, [email], (error, results) => {
            if (error) {
                console.error('Error fetching user:', error);
                return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
            }

            if (results.length === 0) {
                return res.status(401).json({ message: 'البريد الإلكتروني غير موجود' });
            }

            const resetToken = uuidv4();
            const expiration = new Date(Date.now() + 15 * 60 * 1000); 

            const updateSql = `UPDATE users SET reset_token = ?, reset_token_expiration = ? WHERE email = ?`;
            db.query(updateSql, [resetToken, expiration, email], (error) => {
                if (error) {
                    console.error('Error updating user:', error);
                    return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
                }

                const mailOptions = {
                    from: process.env.EMAIL_USER, 
                    to: email, 
                    subject: 'إعادة تعيين كلمة المرور',
                    text: `تم إنشاء رمز إعادة تعيين كلمة المرور الخاص بك. استخدم هذا الرمز: ${resetToken}.\nيرجى ملاحظة أن هذا الرمز صالح لمدة 15 دقيقة.`,
                };

                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        console.error('Error sending email:', error);
                        return res.status(500).json({ message: 'خطأ في إرسال البريد الإلكتروني' });
                    }
                    console.log('Email sent: ' + info.response);
                    res.status(200).json({ message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني' });
                });
            });
        });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
};

// دالة لتحديث كلمة المرور
exports.resetPassword = async (req, res) => {
    const { email, resetToken, newPassword } = req.body;

    try {
        const sql = `SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expiration > NOW()`;
        db.query(sql, [email, resetToken], async (error, results) => {
            if (error) {
                console.error('Error fetching user:', error);
                return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
            }

            if (results.length === 0) {
                return res.status(400).json({ message: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية' });
            }

            const passwordHash = await bcrypt.hash(newPassword, 10);
            const updateSql = `UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expiration = NULL WHERE email = ?`;
            db.query(updateSql, [passwordHash, email], (error) => {
                if (error) {
                    console.error('Error updating password:', error);
                    return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
                }

                res.status(200).json({ message: 'تم تحديث كلمة المرور بنجاح' });
            });
        });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
};
