const db = require('../config/dbconnection');
const axios = require('axios');
const schedule = require('node-schedule');

// دالة لإلغاء المواعيد
const cancelAppointmentsForDate = async (appointment_day, reason, clinic_id) => {
    try {
        console.log('Appointment day:', appointment_day);
        console.log('Clinic ID:', clinic_id);

        // جلب جميع المواعيد في التاريخ المحدد والعيادة المحددة
        const appointmentsQuery = 'SELECT * FROM vaccinationrecords WHERE DATE(appointment_day) = DATE(?) AND clinic_id = ? AND reason = "طعم" AND status ="مجدولة"';
        db.query(appointmentsQuery, [appointment_day, clinic_id], async (err, appointments) => {
            if (err) {
                console.error('Error fetching appointments:', err);
                return;
            }

            if (appointments.length === 0) {
                console.log(`No appointments found for the date: ${appointment_day} in clinic: ${clinic_id}`);
                return;
            }

            // التعامل مع أول موعد فقط
            const appointment = appointments[0];
            const parentId = appointment.parent_id;
            const appointmentId = appointment.record_id;
            const appointmentDay = appointment.appointment_day;
            const appointmentTime = appointment.appointment_time;
            const childId = appointment.child_id;

            // جلب device_token الخاص بالـ parent
            const tokenQuery = 'SELECT device_token FROM device_tokens WHERE parent_id = ?';
            db.query(tokenQuery, [parentId], async (err, result) => {
                if (err) {
                    console.error('Error fetching device token:', err);
                    return;
                }

                if (result.length === 0) {
                    console.log(`No device token found for parentId ${parentId}`);
                    return;
                }

                const deviceToken = result[0].device_token;
                const appointmentDateObj = new Date(appointmentDay);
                const formattedDateSent = appointmentDateObj.toISOString().slice(0, 19).replace('T', ' ');  // تنسيق DATETIME

                // إعداد بيانات الإشعار
                const notificationBody = {
                    appId: 25739,
                    appToken: '2aRpJy3CQV9MGRCroR0Qqk',
                    title: 'إلغاء موعد',
                    body: `نأسف أنه تم  إلغاء موعد طفلك في تاريخ: ${appointmentDay} الساعة: ${appointmentTime}. بسبب: ${reason}`,
                    dateSent: formattedDateSent,
                    pushData: {
                        appointmentId: appointmentId,
                        parentId: parentId,
                        childId: childId
                    },
                    targetToken: deviceToken
                };

                // إرسال الإشعار عبر Native Notify API
                try {
                    const response = await axios.post('https://app.nativenotify.com/api/notification', notificationBody);
                    console.log(response.data);
                    if (response.data === 'Success!') {
                        console.log(`Notification sent successfully to parentId ${parentId}`);

                        // تخزين الإشعار في قاعدة البيانات مع تاريخ انتهاء الصلاحية
                        saveNotificationToDatabase(parentId, childId, appointmentId, notificationBody.title, notificationBody.body, formattedDateSent);
                    } else {
                        console.log(`Failed to send notification to parentId ${parentId}: ${response.data.message}`);
                    }
                } catch (error) {
                    console.error('Error sending notification:', error);
                }

                // حذف السجل الأول (الذي تم العثور عليه أولاً)
                const deleteQuery = 'DELETE FROM vaccinationrecords WHERE record_id = ?';
                db.query(deleteQuery, [appointmentId], (err, result) => {
                    if (err) {
                        console.error('Error deleting appointment:', err);
                    } else {
                        console.log(`Appointment with id ${appointmentId} has been cancelled.`);
                    }
                });
                 // إذا كان السبب "فحص"، قم بحذف السجل المتعلق بنفس الطفل في نفس التاريخ والعيادة
                 const deleteCheckupQuery = 'DELETE FROM vaccinationrecords WHERE child_id = ? AND DATE(appointment_day) = DATE(?) AND clinic_id = ? AND reason = "فحص"';
                 db.query(deleteCheckupQuery, [childId, appointmentDay, clinic_id], (err, result) => {
                     if (err) {
                         console.error('Error deleting checkup record:', err);
                     } else {
                         console.log(`Checkup appointment for childId ${childId} has been deleted.`);
                     }
                 });
            });
        });
    } catch (error) {
        console.error('Error in cancelling appointments:', error);
    }
};

// دالة لتخزين الإشعار في قاعدة البيانات
const saveNotificationToDatabase = (parentId, childId, appointmentId, title, body, dateSent) => {
    console.log('Attempting to save notification...');

    const expiryDate = new Date();
    expiryDate.setHours(23, 59, 59, 999);  // ضبط الوقت إلى نهاية اليوم (11:59:59 مساءً)
    console.log('Saving notification to database:');
    console.log('parentId:', parentId);
    console.log('childId:', childId);
    console.log('appointmentId:', appointmentId);
    console.log('title:', title);
    console.log('body:', body);
    console.log('dateSent:', dateSent);
    console.log('expiryDate:', expiryDate);

    const insertQuery = `INSERT INTO mobile_notifications (parent_id, child_id, appointment_id, title, body, date_sent, expiry_date) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(insertQuery, [parentId, childId, appointmentId, title, body, dateSent, expiryDate], (err, result) => {
        if (err) {
            console.error('Error saving notification to database:', err);
        } else {
            console.log('Notification saved to database with expiry date:', expiryDate);
        }
    });
};

// دالة لحذف الإشعارات من قاعدة البيانات بعد انتهاء صلاحيتها
const deleteExpiredNotifications = () => {
    const deleteQuery = 'DELETE FROM mobile_notifications WHERE expiry_date <= NOW()';
    db.query(deleteQuery, (err, result) => {
        if (err) {
            console.error('Error deleting expired notifications:', err);
        } else {
            console.log(`${result.affectedRows} expired notifications have been deleted.`);
        }
    });
};

// جدولة حذف الإشعارات من قاعدة البيانات كل يوم في منتصف الليل
schedule.scheduleJob('0 0 * * *', deleteExpiredNotifications);  // كل يوم الساعة 12:00 صباحًا

module.exports = {
    cancelAppointmentsForDate
};
