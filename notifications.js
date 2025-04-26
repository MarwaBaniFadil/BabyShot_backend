const axios = require('axios');
const cron = require('node-cron');

// دالة لإضافة 15 دقيقة إلى الوقت
function addFifteenMinutes(time) {
  const timeParts = time.split(":");
  let hour = parseInt(timeParts[0], 10);
  let minute = parseInt(timeParts[1], 10);

  minute += 15;
  if (minute >= 60) {
    minute -= 60;
    hour += 1;
  }
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// تصدير وظيفة الإشعارات
module.exports = (db) => {
  // تشغيل الجدولة كل دقيقة
  cron.schedule('* * * * * *', () => {
    console.log('التحقق من المواعيد لإرسال الإشعارات...');

    const now = new Date();
    const nowTimestamp = now.getTime(); // الطابع الزمني الحالي

    // الموعد بعد 24 ساعة بالضبط
    const targetTime = new Date(nowTimestamp + 24 * 60 * 60 * 1000);
    const targetDate = targetTime.toISOString().split('T')[0]; // تاريخ الهدف
    const targetHour = String(targetTime.getHours()).padStart(2, '0'); // الساعة
    const targetMinute = String(targetTime.getMinutes()).padStart(2, '0'); // الدقيقة
    const targetTimeString = `${targetHour}:${targetMinute}`; // الوقت بصيغة HH:MM

    const query = `
      SELECT r.record_id, r.child_id, r.appointment_day, r.appointment_time, r.parent_id, d.device_token
      FROM vaccinationrecords r
      JOIN device_tokens d ON r.parent_id = d.parent_id
      WHERE r.appointment_day = ? 
        AND r.appointment_time = ? 
        AND r.reason = "طعم" 
        AND r.notification_sent = FALSE
    `;

    db.query(query, [targetDate, targetTimeString], (err, results) => {
      if (err) {
        console.error('خطأ أثناء استرجاع البيانات:', err);
        return;
      }

      if (results.length === 0) {
        console.log('لا يوجد مواعيد لإرسال إشعارات.');
        return;
      }

      results.forEach((appointment) => {
        if (!appointment.device_token) {
          console.error(`لا يوجد device_token للموعد رقم: ${appointment.record_id}`);
          return;
        }

        const notificationBody = {
          appId: 25739, // استبدل بـ App ID الخاص بك
          appToken: '2aRpJy3CQV9MGRCroR0Qqk', // استبدل بـ App Token الخاص بك
          title: 'تذكير بموعد التطعيم',
          body: `لا تنس أن لديك طعم لطفلك غدًا في الساعة ${appointment.appointment_time} وراجع طبيب الأطفال في الساعة ${addFifteenMinutes(appointment.appointment_time)}.😊`,
          deviceToken: appointment.device_token,
          dateSent: new Date().toISOString(),
        };

        axios.post('https://app.nativenotify.com/api/notification', notificationBody)
          .then(() => {
            console.log(`تم إرسال الإشعار بنجاح للموعد رقم: ${appointment.record_id}`);

            // تحديث حالة الإشعار في قاعدة البيانات
            const updateQuery = `
              UPDATE vaccinationrecords
              SET notification_sent = TRUE
              WHERE record_id = ?
            `;
            db.query(updateQuery, [appointment.record_id], (updateErr) => {
              if (updateErr) {
                console.error(`خطأ أثناء تحديث حالة الإشعار للموعد رقم: ${appointment.record_id}`, updateErr);
              }
            });
          })
          .catch((error) => {
            console.error(`فشل إرسال الإشعار للموعد رقم: ${appointment.record_id}`, error);
          });
      });
    });
  });
};
