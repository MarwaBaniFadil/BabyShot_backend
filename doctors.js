const db = require('../config/dbconnection');

const bcrypt = require('bcrypt');
const crypto = require('crypto');

const addDoctor = (req, res) => {
  const { doctor_id, doctor_name, specialization, clinic_name, contact_number } = req.body;

  // التحقق من أن جميع الحقول قد تم ملؤها
  if (!doctor_id || !doctor_name || !specialization || !clinic_name || !contact_number) {
    return res.status(200).json({ message: 'يرجى ملء جميع الحقول' });
  }

  // استعلام للتحقق من وجود رقم الهوية في قاعدة البيانات
  const checkDoctorQuery = 'SELECT * FROM doctors WHERE doctor_id = ?';
  db.query(checkDoctorQuery, [doctor_id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء البحث عن الدكتور' });
    }

    if (result.length > 0) {
      // إذا كان الدكتور موجودًا بالفعل
      return res.status(200).json({ message: 'الدكتور موجود بالفعل' });
    }

    // استعلام للحصول على clinic_id بناءً على اسم العيادة
    const getClinicIdQuery = 'SELECT clinic_id FROM clinics WHERE name = ?';
    db.query(getClinicIdQuery, [clinic_name], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء البحث عن العيادة' });
      }

      if (result.length === 0) {
        return res.status(404).json({ message: 'العيادة غير موجودة' });
      }

      const clinic_id = result[0].clinic_id;

      // استعلام لإضافة الدكتور إلى جدول الأطباء
      const addDoctorQuery = 'INSERT INTO doctors (doctor_id, name, specialization, clinic_id, contact_number) VALUES (?, ?, ?, ?, ?)';
      db.query(addDoctorQuery, [doctor_id, doctor_name, specialization, clinic_id, contact_number], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'حدث خطأ أثناء إضافة الدكتور' });
        }

        // إنشاء بريد إلكتروني ديناميكي وكلمة مرور عشوائية
        const email = `${doctor_id}_${clinic_id}@gmail.com`.toLowerCase();
        const plainPassword = crypto.randomBytes(6).toString('hex'); // إنشاء كلمة مرور عشوائية
        const hashedPassword = bcrypt.hashSync(plainPassword, 10); // تشفير كلمة المرور

        // إضافة البيانات إلى جدول المستخدمين
        const addUserQuery = 'INSERT INTO users (user_id, email, password_hash, role) VALUES (?, ?, ?, ?)';
        db.query(addUserQuery, [doctor_id, email, hashedPassword, 'Doctor'], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'حدث خطأ أثناء إضافة المستخدم إلى جدول اليوزرس' });
          }

          // إضافة الدكتور إلى جدول clinic_staff
          const addToClinicStaffQuery = 'INSERT INTO clinic_staff (clinic_id, user_id, role) VALUES (?, ?, ?)';
          db.query(addToClinicStaffQuery, [clinic_id, doctor_id, 'Doctor'], (err, result) => {
            if (err) {
              return res.status(500).json({ message: 'حدث خطأ أثناء إضافة الدكتور إلى الكلينيك ستاف' });
            }

            // الرد بنجاح مع إعادة كلمة المرور النصية
            res.status(200).json({
              message: 'تم إضافة الدكتور بنجاح إلى الكلينيك ستاف',
              doctor_id: doctor_id,
              email: email,
              plainPassword: plainPassword,
            });
          });
        });
      });
    });
  });
};

const deleteDoctor = (req, res) => {
  const { doctor_id } = req.params;

  if (!doctor_id) {
    return res.status(200).json({ message: 'يرجى إدخال رقم هوية الدكتور' });
  }

  // استعلام لحذف الدكتور من جدول الأطباء بناءً على doctor_id
  const deleteDoctorQuery = 'DELETE FROM doctors WHERE doctor_id = ?';

  db.query(deleteDoctorQuery, [doctor_id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'حدث خطأ أثناء حذف الدكتور من جدول الأطباء' });
    }

    if (result.affectedRows === 0) {
      return res.status(200).json({ message: 'الدكتور غير موجود' });
    }

    // استعلام لحذف الدكتور من جدول clinic_staff
    const deleteFromClinicStaffQuery = 'DELETE FROM clinic_staff WHERE user_id = ?';
    db.query(deleteFromClinicStaffQuery, [doctor_id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء حذف الدكتور من جدول الكلينيك ستاف' });
      }

      // استعلام لحذف الدكتور من جدول users
      const deleteFromUsersQuery = 'DELETE FROM users WHERE user_id = ?';
      db.query(deleteFromUsersQuery, [doctor_id], (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'حدث خطأ أثناء حذف الدكتور من جدول اليوزرس' });
        }

        // الرد بنجاح بعد الحذف من جميع الجداول
        res.status(200).json({ message: 'تم حذف الدكتور بنجاح من جميع الجداول' });
      });
    });
  });
};


  const getExaminationDoctors = (req, res) => {
    const { clinicId } = req.params; // افتراض أن رقم العيادة يتم إرساله كجزء من مسار الطلب
    const specialization = 'دكتور فحوصات'; // تخصيص التخصص
  
    if (!clinicId) {
      return res.status(400).json({ message: 'رقم العيادة مطلوب' });
    }
  
    const query = 'SELECT * FROM doctors WHERE specialization = ? AND clinic_id = ?';
  
    db.query(query, [specialization, clinicId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء جلب الأطباء' });
      }
  
      if (result.length === 0) {
        return res.status(200).json({ message: 'لا يوجد أطباء فحص في هذه العيادة' });
      }
  
      res.status(200).json({ doctors: result });
    });
  };
  
  
  const getVaccinationDoctors = (req, res) => {
    const { clinicId } = req.params; // افتراض أن رقم العيادة يتم إرساله كجزء من مسار الطلب
    const specialization = 'دكتور طعومات'; // تخصيص التخصص
  
    if (!clinicId) {
      return res.status(400).json({ message: 'رقم العيادة مطلوب' });
    }
  
    const query = 'SELECT * FROM doctors WHERE specialization = ? AND clinic_id = ?';
  
    db.query(query, [specialization, clinicId], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء جلب الأطباء' });
      }
  
      if (result.length === 0) {
        return res.status(200).json({ message: 'لا يوجد أطباء تطعيم في هذه العيادة' });
      }
  
      res.status(200).json({ doctors: result });
    });
  };
  
  const updateDoctor = (req, res) => {
    const doctor_id = req.params.doctor_id;  // الحصول على رقم الهوية من الرابط
    const { field, value } = req.body;       // الحصول على الحقل والقيمة من البودي
  
    // تحقق من وجود الحقل والقيمة
    if (!field || !value) {
      return res.status(200).json({ message: 'يرجى إرسال الحقل الذي تريد تعديله مع قيمته الجديدة' });
    }
  
    // أولاً، تحقق إذا كان الدكتور موجودًا في قاعدة البيانات
    const checkDoctorQuery = 'SELECT * FROM doctors WHERE doctor_id = ?';
    db.query(checkDoctorQuery, [doctor_id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من وجود الدكتور' });
      }
  
      if (result.length === 0) {
        return res.status(200).json({ message: 'الدكتور غير موجود' });
      }
  
      // إذا كان الحقل هو doctor_id، نحتاج للتحقق إذا كان رقم الهوية الجديد موجودًا بالفعل
      if (field === 'doctor_id') {
        const checkDoctorIdQuery = 'SELECT * FROM doctors WHERE doctor_id = ?';
        db.query(checkDoctorIdQuery, [value], (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من رقم الهوية' });
          }
  
          if (result.length > 0) {
            return res.status(200).json({ message: 'رقم الهوية هذا موجود بالفعل' });
          }
  
          // بناء الاستعلام لتعديل رقم الهوية
          const updateQuery = 'UPDATE doctors SET doctor_id = ? WHERE doctor_id = ?';
          db.query(updateQuery, [value, doctor_id], (err, result) => {
            if (err) {
              return res.status(500).json({ message: 'حدث خطأ أثناء تحديث رقم الهوية' });
            }
  
            if (result.affectedRows === 0) {
              return res.status(200).json({ message: 'الدكتور غير موجود' });
            }
  
            res.status(200).json({ message: 'تم تعديل رقم الهوية بنجاح' });
          });
        });
      } else {
        // بناء الاستعلام بناءً على الحقل المرسل (غير رقم الهوية)
        let updateQuery = 'UPDATE doctors SET ';
        const queryParams = [];
  
        if (field === 'name') {
          updateQuery += 'name = ?';
          queryParams.push(value);
        } else if (field === 'contact_number') {
          updateQuery += 'contact_number = ?';
          queryParams.push(value);
        } else {
          return res.status(200).json({ message: 'الحقل الذي تحاول تعديله غير موجود' });
        }
  
        // إضافة رقم هوية الدكتور في النهاية
        updateQuery += ' WHERE doctor_id = ?';
        queryParams.push(doctor_id);
  
        // تنفيذ الاستعلام
        db.query(updateQuery, queryParams, (err, result) => {
          if (err) {
            return res.status(500).json({ message: 'حدث خطأ أثناء التحديث' });
          }
  
          if (result.affectedRows === 0) {
            return res.status(200).json({ message: 'الدكتور غير موجود' });
          }
  
          res.status(200).json({ message: 'تم تعديل بيانات الدكتور بنجاح' });
        });
      }
    });
  };// دالة تعديل بيانات الطبيب

      const updateDoctorNew = (req, res) => {
        const { oldDoctorId } = req.params; // رقم الهوية القديم
        const { new_doctor_id, name, contact_number } = req.body; // البيانات الجديدة
      
        if (!new_doctor_id || !name || !contact_number ) {
          return res.status(200).json({ message: 'يرجى ملء جميع الحقول المطلوبة.' });
        }
      
        // تحقق إذا كان الدكتور موجودًا
        db.query('SELECT * FROM doctors WHERE doctor_id = ?', [oldDoctorId], (err, existingDoctorRows) => {
          if (err) {
            console.error('خطأ أثناء التحقق من وجود الدكتور:', err);
            return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من وجود الدكتور.' });
          }
      
          if (existingDoctorRows.length === 0) {
            return res.status(404).json({ message: 'الدكتور غير موجود.' });
          }
      
          // تحقق إذا كان رقم الهوية الجديد مستخدمًا من قبل
          if (new_doctor_id !== oldDoctorId) {
            db.query('SELECT * FROM doctors WHERE doctor_id = ?', [new_doctor_id], (err, idConflictRows) => {
              if (err) {
                console.error('خطأ أثناء التحقق من رقم الهوية الجديد:', err);
                return res.status(500).json({ message: 'حدث خطأ أثناء التحقق من رقم الهوية الجديد.' });
              }
      
              if (idConflictRows.length > 0) {
                return res.status(200).json({ message: 'رقم الهوية الجديد موجود بالفعل. يرجى اختيار رقم آخر.' });
              }
      
              // تحديث بيانات الطبيب
              db.query(
                'UPDATE doctors SET doctor_id = ?, name = ?, contact_number = ? WHERE doctor_id = ?',
                [new_doctor_id, name, contact_number, oldDoctorId],
                (err, result) => {
                  if (err) {
                    console.error('خطأ أثناء تحديث بيانات الدكتور:', err);
                    return res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات الدكتور.' });
                  }
      
                  res.status(200).json({ message: 'تم تعديل بيانات الدكتور بنجاح.' });
                }
              );
            });
          } else {
            // إذا لم يتم تغيير رقم الهوية، قم فقط بتحديث البيانات
            db.query(
              'UPDATE doctors SET doctor_id = ?, name = ?, contact_number = ? WHERE doctor_id = ?',
              [new_doctor_id, name, contact_number, oldDoctorId],
              (err, result) => {
                if (err) {
                  console.error('خطأ أثناء تحديث بيانات الدكتور:', err);
                  return res.status(500).json({ message: 'حدث خطأ أثناء تحديث بيانات الدكتور.' });
                }
      
                res.status(200).json({ message: 'تم تعديل بيانات الدكتور بنجاح.' });
              }
            );
          }
        });
      };
      const generateDoctorPassword = async (req, res) => {
        const { email } = req.body;
      
        if (!email) {
          return res.status(200).json({ message: 'يرجى إدخال الإيميل.' });
        }
      
        // إنشاء كلمة سر عشوائية
        const plainPassword = crypto.randomBytes(8).toString('hex');
      
        // تشفير كلمة السر
        bcrypt.hash(plainPassword, 10, (err, hashedPassword) => {
          if (err) {
            return res.status(500).json({ message: 'خطأ أثناء تشفير كلمة السر.' });
          }
      
          // تحديث كلمة السر المشفرة في قاعدة البيانات
          const query = 'UPDATE users SET password_hash = ? WHERE email = ?';
          db.query(query, [hashedPassword, email], (err, result) => {
            if (err) {
              console.error('خطأ أثناء تحديث كلمة السر:', err);
              return res.status(500).json({ message: 'حدث خطأ أثناء معالجة الطلب.' });
            }
      
            if (result.affectedRows === 0) {
              return res.status(200).json({ message: 'لم يتم العثور على مستخدم بهذا الإيميل.' });
            }
      
            // إعادة كلمة السر العشوائية بدون تشفير
            return res.status(200).json({ plainPassword });
          });
        });
      };
      const getEmailByDoctorId = (req, res) => {
        const { doctor_id } = req.params;  // الحصول على doctor_id من URL
    
        if (!doctor_id) {
            return res.status(400).json({ message: 'يرجى إدخال رقم هوية الطبيب.' });
        }
    
        const query = 'SELECT email FROM users WHERE user_id = ?'; // استعلام قاعدة البيانات
    
        db.query(query, [doctor_id], (err, results) => {
            if (err) {
                return res.status(500).json({ message: 'حدث خطأ أثناء معالجة الطلب.' });
            }
            if (results.length === 0) {
                return res.status(404).json({ message: 'لم يتم العثور على الدكتور بهذا الرقم.' });
            }
    
            const email = results[0].email; // أخذ الإيميل من النتائج
            return res.status(200).json({ email }); // إرسال الإيميل في الرد
        });
    };
  
module.exports = { addDoctor,deleteDoctor,getExaminationDoctors,getVaccinationDoctors,updateDoctor,updateDoctorNew,generateDoctorPassword,getEmailByDoctorId};
