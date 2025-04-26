const axios = require('axios');
const cron = require('node-cron');

// دالة لتحويل التاريخ إلى الصيغة المطلوبة لقاعدة البيانات
const formatDateForDB = (date) => {
  return date.toISOString().slice(0, 19).replace('T', ' '); // تحويل إلى YYYY-MM-DD HH:MM:SS
};

module.exports = (db) => {
  cron.schedule('* * * * * ', () => {
    console.log('التحقق من المواعيد الملغاة وإرسال الإشعارات...');

    // جلب المواعيد الملغاة من جدول vaccinationrecords مع clinic_id
    const cancelledAppointmentsQuery = `
      SELECT r.record_id, r.child_id, r.appointment_day, r.appointment_time, r.parent_id, r.clinic_id
      FROM vaccinationrecords r
      WHERE r.status = 'ملغى'
    `;

    db.query(cancelledAppointmentsQuery, (err, cancelledAppointments) => {
      if (err) {
        console.error('خطأ أثناء جلب المواعيد الملغاة:', err);
        return;
      }

      if (cancelledAppointments.length === 0) {
        console.log('لا توجد مواعيد ملغاة.');
        return;
      }

      console.log(`تم العثور على ${cancelledAppointments.length} موعد ملغى.`);

      // البحث عن المواعيد المعلقة
      cancelledAppointments.forEach((cancelledAppointment) => {
        const { appointment_day, appointment_time, clinic_id, record_id, parent_id } = cancelledAppointment;

        const pendingAppointmentsQuery = `
          SELECT p.parent_id, p.child_id, p.notification_sent
          FROM pending_bookings p
          WHERE p.appointment_day = ? AND p.appointment_time = ? AND p.clinic_id = ? AND p.reason = "طعم" AND p.notification_sent = FALSE
        `;

        db.query(pendingAppointmentsQuery, [appointment_day, appointment_time, clinic_id], (err, pendingAppointments) => {
          if (err) {
            console.error('خطأ أثناء جلب المواعيد المعلقة:', err);
            return;
          }

          if (pendingAppointments.length > 0) {
            console.log(`تم العثور على ${pendingAppointments.length} موعد معلق لنفس التاريخ والوقت.`);

            // البحث عن device_token الخاص بـ parent_id
            pendingAppointments.forEach((pendingAppointment) => {
              const { parent_id, child_id } = pendingAppointment;

              const deviceTokenQuery = `
                SELECT device_token
                FROM device_tokens
                WHERE parent_id = ?
              `;

              db.query(deviceTokenQuery, [parent_id], (err, deviceTokens) => {
                if (err) {
                  console.error('خطأ أثناء جلب device_token:', err);
                  return;
                }

                if (deviceTokens.length > 0) {
                  const { device_token } = deviceTokens[0];

                  // صياغة رسالة الإشعار مع البيانات التفاعلية
                  const notificationBody = {
                    appId: 25739,
                    appToken: '2aRpJy3CQV9MGRCroR0Qqk',
                    title: 'موعد جديد متاح',
                    body: `تم إلغاء موعد سابق في تاريخ: ${appointment_day} ووقت: ${appointment_time} ,، اذا كنتِ تريدين تبديل حجزك يرجى الضغط على تأكيد.`,
                    dateSent: new Date().toISOString(),
                    pushData: { 
                      appointmentId: record_id,   // معرف الموعد الملغى
                      parentId: parent_id,        // معرف الأب من pending_bookings
                      childId: pendingAppointment.child_id // إضافة child_id من الـ pendingAppointment
                    }
                  };

                  // إرسال الإشعار عبر Native Notify
                  console.log('البيانات المرسلة للإشعار:', notificationBody);
                  axios.post('https://app.nativenotify.com/api/notification', notificationBody)
                    .then(() => {
                      console.log(`تم إرسال الإشعار بنجاح للـ Parent ID: ${parent_id}`);

                      // إدخال الإشعار في جدول الإشعارات
                      const insertNotificationQuery = `
                        INSERT INTO mobile_notifications (parent_id, child_id, appointment_id, title, body, date_sent, expiry_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                      `;
                      const expiryDate = new Date();
                      expiryDate.setHours(expiryDate.getHours() + 1); // تعيين expiry_date بعد ساعة من تاريخ الإرسال

                      // تنسيق التواريخ إلى الشكل الصحيح
                      const formattedDateSent = formatDateForDB(new Date());
                      const formattedExpiryDate = formatDateForDB(expiryDate);

                      db.query(insertNotificationQuery, [
                        parent_id,
                        pendingAppointment.child_id,
                        record_id,
                        notificationBody.title,
                        notificationBody.body,
                        formattedDateSent,
                        formattedExpiryDate
                      ], (insertErr) => {
                        if (insertErr) {
                          console.error('خطأ أثناء إدخال الإشعار في الجدول:', insertErr);
                        } else {
                          console.log('تم إدخال الإشعار في الجدول بنجاح');
                        }
                      });

                      // تحديث حالة الإشعار إلى TRUE بعد إرساله
                      const updateQuery = `
                        UPDATE pending_bookings
                        SET notification_sent = TRUE
                        WHERE parent_id = ? AND appointment_day = ? AND appointment_time = ? AND clinic_id = ?
                      `;
                      db.query(updateQuery, [parent_id, appointment_day, appointment_time, clinic_id], (updateErr) => {
                        if (updateErr) {
                          console.error(`خطأ أثناء تحديث حالة الإشعار للـ Parent ID: ${parent_id}`, updateErr);
                        }
                      });
                    })
                    .catch((error) => {
                      console.error('فشل إرسال الإشعار:', error);
                    });
                } else {
                  console.log(`لا يوجد device_token للـ Parent ID: ${parent_id}`);
                }
              });
            });
          } else {
            console.log('لا توجد مواعيد معلقة لنفس التاريخ والوقت.');
          }
        });
      });
    });
  });
};
