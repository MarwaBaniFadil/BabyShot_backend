const db = require('../config/dbconnection'); 

// وظيفة لإضافة حجز جديد
const addAppointment = (data, callback) => {
  const { child_id, appointment_day, appointment_time, status, reason, clinic_id, doctor_id, parent_id } = data;

  // استعلام لإضافة الموعد
  const insertQuery = `
    INSERT INTO vaccinationrecords 
    (child_id, appointment_day, appointment_time, status, reason, clinic_id, doctor_id, parent_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // تنفيذ إدخال الموعد
  db.query(insertQuery, [child_id, appointment_day, appointment_time, status, reason, clinic_id, doctor_id, parent_id], (err, result) => {
    if (err) return callback(err); // معالجة خطأ إدخال الموعد

    const recordId = result.insertId;

    // استعلام لجلب اسم الطفل، اسم العيادة، واسم الطبيب
    const fetchDetailsQuery = `
      SELECT c.name AS child_name, cl.name AS clinic_name
      FROM children c
      JOIN clinics cl ON cl.clinic_id = ?
      WHERE c.child_id = ?
    `;

    db.query(fetchDetailsQuery, [clinic_id,child_id], (detailsErr, detailsResult) => {
      if (detailsErr) return callback(detailsErr); // معالجة خطأ جلب التفاصيل

      if (!detailsResult || detailsResult.length === 0) {
        return callback(new Error("لم يتم العثور على تفاصيل الطفل أو العيادة أو الطبيب."));
      }

      const { child_name, clinic_name, doctor_name } = detailsResult[0];

      // رسالة الإشعار
      const notificationMessage = `حجزك القادم لطفلك ${child_name} سيكون في تاريخ ${appointment_day} وفي الساعة ${appointment_time} في عيادة ${clinic_name} عند الطبيب ${doctor_name}. سبب الموعد: ${reason} للطفل.`;

      // استعلام لإضافة الإشعار
      const notificationQuery = `
        INSERT INTO notifications (user_id, message, type, readed, timestamp)
        VALUES (?, ?, 'Reminder', 0, NOW())
      `;

      db.query(notificationQuery, [parent_id, notificationMessage], (notificationErr) => {
        if (notificationErr) return callback(notificationErr); // معالجة خطأ إدخال الإشعار

        // الإرجاع في حالة النجاح
        callback(null, { message: "تم حجز الموعد بنجاح وتم إضافة الإشعار.", record_id: recordId });
      });
    });
  });
};


// وظيفة للحصول على المواعيد بناءً على يوم معين
const getAppointmentsByDay = (day, callback) => {
  const query = `
    SELECT * FROM vaccinationrecords WHERE appointment_day = ?
  `;
  db.query(query, [day], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
// وظيفة للحصول على المواعيد بناءً على يوم معين واسم العيادة
const getAppointmentsByDayAndClinic = (day, clinicName, callback) => {
  const query = `
    SELECT * FROM vaccinationrecords
     
    WHERE appointment_day = ? AND clinic_id = ? AND reason = "طعم" AND status != "ملغى"
  `;
  db.query(query, [day, clinicName], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

const getFutureAppointmentsByChildId = (child_id, callback) => {
  const query = `
    SELECT * FROM vaccinationrecords 
    WHERE child_id = ? AND appointment_day >= CURRENT_DATE AND status = 'مجدولة'
    ORDER BY appointment_day, appointment_time
  `;
  db.query(query, [child_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
/*appointment_day >= CURRENT_DATE*/
const getPastAppointmentsByChildId = (child_id, callback) => {
  const query = `
    SELECT * FROM vaccinationrecords 
    WHERE child_id = ? AND status = 'مكتملة'
    ORDER BY appointment_day, appointment_time
  `;
  db.query(query, [child_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
const deleteFromTable = (tableName, key, value) => {
    
  return new Promise((resolve, reject) => {
      db.query(`DELETE FROM ${tableName} WHERE ${key}=? `, [value], (err, result) => {
          if (err) {
              reject(err);
          } else {
              resolve(result);
          }
      });
  });
};
const getAppointmentsByClinicId = (clinic_id, callback) => {
  const query = `
    SELECT * FROM vaccinationrecords WHERE clinic_id = ?
  `;
  db.query(query, [ clinic_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

const deleteSch = (req, res) => {
  const id = req.params.id; // record_id للموعد الملغى

  // تحديث حالة الموعد الحالي إلى "ملغى"
  const updateQuery = 'UPDATE vaccinationrecords SET status = "ملغى" WHERE record_id = ?';

  db.query(updateQuery, [id], (error, result) => {
    if (error) {
      console.error('Error updating record status:', error);
      return res.status(500).send({ error: 'Internal server error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).send({ msg: 'Record not found' });
    }

    // البحث عن بيانات الموعد الحالي
    const findQuery = 'SELECT child_id, appointment_time FROM vaccinationrecords WHERE record_id = ?';

    db.query(findQuery, [id], (err, rows) => {
      if (err) {
        console.error('Error fetching record details:', err);
        return res.status(500).send({ error: 'Internal server error' });
      }

      if (rows.length === 0) {
        return res.status(200).send({ msg: 'No related records found.' });
      }

      const childId = rows[0].child_id;
      const appointmentTime = rows[0].appointment_time;

      // تحديث الموعد الذي بعد 15 دقيقة بالضبط
      const relatedUpdateQuery = `
        UPDATE vaccinationrecords 
        SET status = 'ملغى' 
        WHERE child_id = ? 
        AND TIME_FORMAT(appointment_time, '%H:%i:%s') = TIME_FORMAT(ADDTIME(?, '00:15:00'), '%H:%i:%s')
      `;

      console.log("Executing query:", relatedUpdateQuery, [childId, appointmentTime]);

      db.query(relatedUpdateQuery, [childId, appointmentTime], (updateErr, updateResult) => {
        if (updateErr) {
          console.error('Error updating related records:', updateErr);
          return res.status(500).send({ error: 'Internal server error' });
        }

        res.status(200).send({ 
          msg: 'Record and related records updated to "ملغى" successfully',
          updatedRelated: updateResult.affectedRows
        });
      });
    });
  });
};

/*
const deleteSch = async (req, res) => {


const id = req.params.id; 
  try { 
      await deleteFromTable('vaccinationrecords', 'record_id', id);
      res.status(200).send({ msg: 'Deleted successfully by record Id' });
  } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).send({ error: 'Internal server error' });
  }
};
*/
// وظيفة لتحديث حالة الموعد
const updateAppointmentStatus = (req, res) => {
  const { record_id, status, doctor_id } = req.body;

  // التحقق من البيانات المطلوبة
  if (!record_id || !status || !doctor_id) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // استعلام تحديث الحالة في قاعدة البيانات
  const query = `
      UPDATE vaccinationrecords
      SET status = ?, doctor_id = ?
      WHERE record_id = ?
  `;

  db.query(query, [status, doctor_id, record_id], (err, result) => {
    if (err) {
      console.error('Error updating appointment status:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    // التحقق إذا تم تحديث السجل
    if (result.affectedRows > 0) {
      return res.status(200).json({ message: 'Appointment status updated successfully' });
    } else {
      return res.status(404).json({ error: 'Record not found' });
    }
  });
};

const getdoctorsByclinic1 = (clinic_id, callback) => {
  const query = `
    SELECT * FROM doctors WHERE clinic_id = ? AND specialization="دكتور طعومات"
  `;
  db.query(query, [clinic_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
const getdoctorsByclinic2 = (clinic_id, callback) => {
  const query = `
    SELECT * FROM doctors WHERE clinic_id = ? AND specialization="دكتور فحوصات"
  `;
  db.query(query, [clinic_id], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
const pendingBookings = (data, callback) => {
  const { child_id, appointment_day, appointment_time, status, reason, clinic_id, doctor_id,parent_id} = data;


    // إدخال الموعد الجديد
    const insertQuery = `
      INSERT INTO pending_bookings  
      (child_id, appointment_day, appointment_time, status, reason, clinic_id, doctor_id, parent_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(
      insertQuery,
      [child_id, appointment_day, appointment_time, status, reason, clinic_id, doctor_id, parent_id],
      (err, result) => {
        if (err) return callback(err);

        callback(null, { message: "تم حجز الموعد بنجاح.", record_id: result.insertId });
      }
    );

};
const getClinicsWorkTimeFromDB = (clinic_id, callback) => {
  const query = 'SELECT work_time FROM clinics WHERE clinic_id = ?';

  db.query(query, [clinic_id], (err, results) => {
    if (err) {
      return callback(err, null);
    }
    if (results.length === 0) {
      return callback(null, 'No clinic found with the given ID.');
    }
    callback(null, results[0].work_time);
  });
};
const updateAppointment = (recordId1, newParentId, newChildId) => {
  return new Promise((resolve, reject) => {
    console.log("بدء حذف المواعيد القديمة للـ parent_id والـ child_id الجديدين...");

    // حذف أي مواعيد للـ parent_id الجديد والـ child_id الجديد والحالة "مجدولة"
    const deleteExistingAppointmentsQuery = `
      DELETE FROM vaccinationrecords 
      WHERE parent_id = ? AND child_id = ? AND status = 'مجدولة'
    `;

    db.query(deleteExistingAppointmentsQuery, [newParentId, newChildId], (err) => {
      if (err) {
        console.error("خطأ في حذف المواعيد القديمة:", err);
        return reject('خطأ في حذف المواعيد القديمة');
      }

      console.log("تم حذف المواعيد القديمة بنجاح. بدء جلب معلومات الطفل القديم...");

      // جلب معرف الطفل القديم ويوم الموعد الأول بناءً على recordId1
      const getOldChildQuery = `
        SELECT child_id, appointment_day 
        FROM vaccinationrecords 
        WHERE record_id = ?
      `;

      db.query(getOldChildQuery, [recordId1], (err, rows) => {
        if (err || rows.length === 0) {
          console.error("خطأ في جلب الطفل القديم:", err);
          return reject('خطأ في جلب معلومات الطفل القديم');
        }

        const oldChildId = rows[0].child_id;
        const appointmentDay = rows[0].appointment_day; // يوم الموعد الأول
        console.log("معرّف الطفل القديم:", oldChildId);
        console.log("يوم الموعد الأول:", appointmentDay);

        // تحديث الموعد الأول
        const updateFirstAppointmentQuery = `
          UPDATE vaccinationrecords 
          SET status = 'مجدولة', parent_id = ?, child_id = ? 
          WHERE record_id = ?
        `;

        db.query(updateFirstAppointmentQuery, [newParentId, newChildId, recordId1], (err) => {
          if (err) {
            console.error("خطأ في تحديث الموعد الأول:", err);
            return reject('خطأ في تحديث الموعد الأول');
          }

          console.log("تم تحديث الموعد الأول بنجاح. بدء البحث عن الموعد الثاني...");

          // جلب معرف الموعد الثاني بناءً على معرف الطفل القديم، اليوم، والسبب "فحص"
          const checkSecondAppointmentQuery = `
            SELECT record_id 
            FROM vaccinationrecords 
            WHERE appointment_day = ? AND reason = 'فحص' AND child_id = ?
          `;

          db.query(checkSecondAppointmentQuery, [appointmentDay, oldChildId], (err, rows) => {
            if (err || rows.length === 0) {
              console.error("خطأ في جلب الموعد الثاني أو الموعد غير موجود:", err);
              return reject('لم يتم العثور على الموعد الثاني لتحديثه');
            }

            const secondRecordId = rows[0].record_id;
            console.log("معرّف الموعد الثاني:", secondRecordId);

            // تحديث الموعد الثاني
            const updateSecondAppointmentQuery = `
              UPDATE vaccinationrecords 
              SET status = 'مجدولة', parent_id = ?, child_id = ? 
              WHERE record_id = ?
            `;

            db.query(updateSecondAppointmentQuery, [newParentId, newChildId, secondRecordId], (err) => {
              if (err) {
                console.error("خطأ في تحديث الموعد الثاني:", err);
                return reject('خطأ في تحديث الموعد الثاني');
              }

              console.log("تم تحديث الموعد الثاني بنجاح. بدء حذف المواعيد من جدول pending_bookings...");

              // حذف المواعيد من جدول pending_bookings
              const deletePendingAppointmentsQuery = `
                DELETE FROM pending_bookings 
                WHERE parent_id = ? AND child_id = ?
              `;

              db.query(deletePendingAppointmentsQuery, [newParentId, newChildId], (err) => {
                if (err) {
                  console.error("خطأ في حذف المواعيد من جدول pending_bookings:", err);
                  return reject('خطأ في حذف المواعيد من جدول pending_bookings');
                }

                console.log("تم حذف المواعيد من جدول pending_bookings بنجاح.");
                resolve('تم تحديث الموعدين وحذف المواعيد بنجاح');
              });
            });
          });
        });
      });
    });
  });
};

const getAppointmentTime = (appointmentId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT appointment_day, appointment_time
      FROM vaccinationrecords
      WHERE record_id = ?
    `;

    db.query(query, [appointmentId], (err, rows) => {
      if (err) {
        console.error('Error fetching appointment time:', err);
        return reject('خطأ في جلب تاريخ ووقت الموعد');
      }

      if (rows.length === 0) {
        return reject('لم يتم العثور على الموعد');
      }

      const appointment = rows[0];
      resolve({
        appointmentDay: appointment.appointment_day,
        appointmentTime: appointment.appointment_time,
      });
    });
  });
};









module.exports = {
  addAppointment,
  getAppointmentsByDay,
  getAppointmentsByDayAndClinic,
  getFutureAppointmentsByChildId,
  getPastAppointmentsByChildId,
  getAppointmentsByClinicId,
  deleteSch,
  updateAppointmentStatus,
  getdoctorsByclinic1,
  getdoctorsByclinic2,
  pendingBookings,
  getClinicsWorkTimeFromDB,
  updateAppointment,
  getAppointmentTime,
  
};
