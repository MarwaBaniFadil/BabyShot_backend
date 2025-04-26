const express = require("express");
const router = express(); // .Router();
const { authenticateJWT } = require('../midware/authenticateToken');
const db5 = require('../config/dbconnection');



const registrationModel = require('../controllers/registrationModel'); // Adjust path if necessary
const loginModel = require('../controllers/loginModel'); // Adjust path if necessary
const clinicsModel = require('../controllers/clinicsModel'); 
const clinic = require('../controllers/clinic'); 
const emails = require('../controllers/emails'); 


const aiModel = require('../controllers/aiModel'); 
const doctors = require('../controllers/doctors'); 
const users = require('../controllers/users'); 
router.get('/showAllemails', emails.showAllemails);

const { cancelAppointmentsForDate } = require('../controllers/Admin_notification'); // استيراد الدالة

const { getClinicsWorkTimeFromDB,pendingBookings,addAppointment, getAppointmentsByDay,getdoctorsByclinic1, getdoctorsByclinic2,getAppointmentsByClinicId,getAppointmentsByDayAndClinic,getFutureAppointmentsByChildId,getPastAppointmentsByChildId,updateAppointment,getAppointmentTime} = require("../controllers/appointments");
const { getUserProfile,updateContactNumber ,updateAddress} = require('../controllers/parentProfil'); // استيراد الفنكشن من ملف المستخدم

// Registration route
router.post('/register', registrationModel.register);

// Login routes
router.post('/login', loginModel.login);
router.post('/request-password-reset', loginModel.requestPasswordReset);
router.post('/reset-password', loginModel.resetPassword);

///////////////////////////////////////////////////////
// Importing appointment-related functions

// Booking an appointment
router.post("/book-appointment", (req, res) => {
    addAppointment(req.body, (err, result) => {
        if (err) {
            return res.status(500).json({ error: "حدث خطأ أثناء إضافة الحجز." });
        }
        if (result.error) {
            return res.status(400).json(result);
        }
        res.status(201).json(result);
    });
});


// Fetching future appointments for a specific child
router.get("/getFutureAppointmentsByChildId/:child_id", (req, res) => {
    const { child_id } = req.params;

    getFutureAppointmentsByChildId(child_id, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "حدث خطأ أثناء جلب الحجوزات." });
        }
        res.json(results);
    });
});
router.get("/getPastAppointmentsByChildId/:child_id", (req, res) => {
  const { child_id } = req.params;

  getPastAppointmentsByChildId(child_id, (err, results) => {
      if (err) {
          return res.status(500).json({ error: "حدث خطأ أثناء جلب الحجوزات." });
      }
      res.json(results);
  });
});


// Fetching appointments for a specific day and clinic
router.get("/appointments/:day/:clinic", (req, res) => {
    const { day, clinic } = req.params;

    getAppointmentsByDayAndClinic(day, clinic, (err, results) => {
        if (err) {
            return res.status(500).json({ error: "حدث خطأ أثناء جلب الحجوزات." });
        }
        res.json(results);
    });
});

router.get('/user-profile/:id', (req, res) => {
  const { id } = req.params; // الحصول على الـ id من الـ URL

  // استدعاء الفنكشن لاسترجاع بيانات المستخدم
  getUserProfile(id, (err, result) => {
    if (err) {
      return res.status(500).send('Internal Server Error');
    }

    if (result === 'User not found') {
      return res.status(404).send('User not found');
    }

    // إرجاع النتيجة كـ JSON
    res.json(result);
  });
});

router.put('/user-profile/update-contact/:userId', (req, res) => {
  const { userId } = req.params; // الحصول على userId من الرابط
  const { newContactNumber } = req.body; // الحصول على رقم الهاتف الجديد من الـ body

  // التحقق من وجود رقم الهاتف الجديد
  if (!newContactNumber) {
    return res.status(400).json({ message: 'New contact number is required' });
  }

  // استدعاء دالة التحديث
  updateContactNumber(userId, newContactNumber, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (result === 'User not found') {
      return res.status(404).json({ message: result });
    }

    // الرد بالنجاح
    res.status(200).json({ message: result });
  });
});

router.put('/user-profile/update-address/:userId', (req, res) => {
  const { userId } = req.params; // الحصول على userId من الرابط
  const { newAddress } = req.body; // الحصول على رقم الهاتف الجديد من الـ body

  // التحقق من وجود رقم الهاتف الجديد
  if (!newAddress) {
    return res.status(400).json({ message: 'New address number is required' });
  }

  // استدعاء دالة التحديث
  updateAddress(userId, newAddress, (err, result) => {
    if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (result === 'User not found') {
      return res.status(404).json({ message: result });
    }

    // الرد بالنجاح
    res.status(200).json({ message: result });
  });
});
// Deleting an appointment
const appo = require('../controllers/appointments'); 
router.delete('/deleteSch/:id', appo.deleteSch);

//
router.post('/update-appointment', (req, res) => {
  const { appointmentId, parentId, childId } = req.body;

  // استدعاء الدالة وتحديث الموعد
  updateAppointment(appointmentId, parentId, childId)
    .then((message) => {
      res.send(message);
    })
    .catch((error) => {
      res.status(500).send(error);
    });
});

// Endpoint لجلب تاريخ ووقت الموعد
router.post('/get-appointment-time', (req, res) => {
  const { appointmentId } = req.body; // استلام `appointmentId` من الطلب

  if (!appointmentId) {
    return res.status(400).json({ error: 'معرف الموعد غير موجود' });
  }

  getAppointmentTime(appointmentId)
    .then((appointment) => {
      res.status(200).json({
        appointmentDay: appointment.appointmentDay,
        appointmentTime: appointment.appointmentTime,
      });
    })
    .catch((err) => {
      res.status(500).json({ error: err });
    });
});




// Child-related routes
const child = require('../controllers/children'); 
router.get('/getChildrenByParentId/:id', child.getChildrenByParentId);
router.get('/showallchildren', child.showAllChildren);
router.get('/showallchildrenbyid/:id', child.showAllChildrenById);
router.post('/search-child', child.searchChild);
router.get('/child/:child_id',child.getChildById);
router.post('/addChildren', child.addChild);
router.delete('/deleteChild/:child_id', child.deleteChild);
router.patch('/updateChildField/:child_id',child.updateChildField);
router.get('/childrenfordoctor', child.getChildren);
router.get('/getPerent/:id', child.getPerent);
router.get('/registrations/:id', child.getRegistrationById);

// Vaccine-related routes
const vaccines = require('../controllers/vaccines'); 
router.get('/vaccineschild/:id', vaccines.vaccineschild);
router.get('/showallvaccinesbyname/:id', vaccines.showallvaccinesbyname);
router.get('/showallvaccines', vaccines.showallvaccines);

//tests
const tests = require('../controllers/test'); 
router.get('/showAlltestToChildrenById/:id', tests.showAlltestToChildrenById);
router.get('/showdoctornameByid/:id', tests.showdoctornameByid);
router.get('/showclinicnameByid/:id', tests.showclinicnameByid);

//sideeffect_chatgpt
const openai= require('../controllers/chatGPT'); 
router.post('/chat',openai.chatGPT);
router.post('/chatbot',openai.chatbot);

//لاشياء الدكتور في صفحة الادمن 
router.post('/addDoctor', doctors.addDoctor);
router.delete('/deleteDoctor/:doctor_id', doctors.deleteDoctor);
router.get('/examination-doctors/:clinicId', doctors.getExaminationDoctors);
router.get('/vaccination-doctors/:clinicId',doctors.getVaccinationDoctors);
router.patch('/update-doctor/:doctor_id',doctors.updateDoctor);
router.get('/clinic/:name',clinic.getClinicIdByName);
router.put('/updateDoctorNew/:oldDoctorId', doctors.updateDoctorNew);
router.post('/generate-password', doctors.generateDoctorPassword);
router.get('/getEmailByDoctorId/:doctor_id',doctors.getEmailByDoctorId);
/////////////لاشياء الام في صفحة الادمن
router.post('/add-registration', users.createRegistration);
router.get('/mother/:momId',users.getMotherById);
router.put('/update-registration', users.updateRegistration);

///للاشعار تاع الادمن
router.post('/cancel-appointments', (req, res) => {
  const { appointment_date, reason, clinic_id } = req.body;

  // التأكد من أن appointment_date و reason و clinic_id موجودة في الطلب
  if (!appointment_date || !reason || !clinic_id) {
    return res.status(400).json({ error: 'appointment_date, reason, and clinic_id are required.' });
  }

  // تمرير clinic_id إلى دالة cancelAppointmentsForDate
  cancelAppointmentsForDate(appointment_date, reason, clinic_id) 
    .then(() => {
      res.status(200).json({ message: 'Appointments cancelled successfully and notifications sent.' });
    })
    .catch(err => {
      res.status(500).json({ error: 'Error cancelling appointments: ' + err.message });
    });
});
/////هاد للاحصائيات
const { getVaccinationStats } = require('../controllers/vaccines');
router.get('/vaccination-stats', async (req, res) => {
  try {
      const stats = await getVaccinationStats();
      res.json(stats);
  } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send('Server error');
  }
});



//chating 


const { db, ref, set, get } = require("../controllers/firebase-config");

const sanitizeEmail = (email) => {
  return email.replace(/[@.]/g, (match) => (match === '@' ? '_at_' : '_dot_'));
};

// Endpoint لإرسال الرسائل إلى Firebase
router.post("/sendMessage", (req, res) => {
  const { email, clinicId, message, sender } = req.body;

  if (!email || !clinicId || !message || !sender) {
    return res.status(400).send("Missing required parameters");
  }

  const sanitizedEmail = sanitizeEmail(email); // تعقيم البريد الإلكتروني

  const messageRef = ref(db, `messages/${clinicId}/${sanitizedEmail}/${Date.now()}`);

  // حفظ الرسالة مع تحديد المرسل
  set(messageRef, { email, clinicId, message, sender })
    .then(() => res.status(200).send("Message sent!"))
    .catch((error) => res.status(500).send(error.message));
});
router.get("/getMessages", (req, res) => {
  const { email, clinicId } = req.query;

  if (!email || !clinicId) {
    return res.status(400).send("Missing required parameters");
  }

  const sanitizedEmail = sanitizeEmail(email);
  const messagesRef = ref(db, `messages/${clinicId}/${sanitizedEmail}`);

  get(messagesRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        res.status(200).json(snapshot.val()); // الرسائل ستكون مرفقة بـ `sender`
      } else {
        res.status(200).json([]); // إذا لم توجد رسائل سابقة يتم إرسال مصفوفة فارغة
      }
    })
    .catch((error) => res.status(500).send(error.message));
});
//////////
router.post("/sendMessageWithStatus", (req, res) => {
  const { email, clinicId, message, sender } = req.body;

  if (!email || !clinicId || !message || !sender) {
    return res.status(400).send("Missing required parameters");
  }

  const sanitizedEmail = sanitizeEmail(email); // تعقيم البريد الإلكتروني

  const messageRef = ref(db, `messages/${clinicId}/${sanitizedEmail}/${Date.now()}`);

  // حفظ الرسالة مع تحديد المرسل وحالة القراءة
  set(messageRef, { email, clinicId, message, sender, isRead: false })
    .then(() => res.status(200).send("Message sent!"))
    .catch((error) => res.status(500).send(error.message));
});
/////////////////
const sanitizeEmail1 = (email) => {
  return email.replace(/@/g, "_at_").replace(/\./g, "_dot_");
};

router.get("/getAllMessages", (req, res) => {
  const { clinicId } = req.query; // الحصول على clinicId من الاستعلام

  if (!clinicId) {
    return res.status(400).send("Missing required parameter: clinicId");
  }

  console.log("Fetching all messages for clinicId:", clinicId);

  const messagesRef = ref(db, `messages/${clinicId}`); // مسار البحث داخل العيادة

  // جلب الرسائل من Firebase
  get(messagesRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const allEmails = snapshot.val(); // جميع الإيميلات داخل العيادة
        let allMessages = [];

        // المرور على كل إيميل وجمع الرسائل
        Object.keys(allEmails).forEach((email) => {
          const messagesForEmail = Object.values(allEmails[email]); // الرسائل لكل إيميل
          allMessages = allMessages.concat(messagesForEmail); // دمج الرسائل
        });

        console.log("All Messages from Firebase:", allMessages); // عرض جميع الرسائل
        res.status(200).json(allMessages); // إرجاع جميع الرسائل
      } else {
        console.log("No messages found in Firebase.");
        res.status(200).json([]); // إذا لم توجد رسائل
      }
    })
    .catch((error) => {
      console.error("Error fetching messages from Firebase:", error.message);
      res.status(500).send(error.message); // معالجة الأخطاء
    });
});



router.post("/updateMessageStatus", (req, res) => {
  const { email, clinicId } = req.body;

  if (!email || !clinicId) {
    return res.status(400).send("Missing required parameters");
  }

  const sanitizedEmail = sanitizeEmail(email);
  const messageRef = ref(db, `messages/${clinicId}/${sanitizedEmail}`);

  get(messageRef)
    .then((snapshot) => {
      if (snapshot.exists()) {
        const messages = snapshot.val();
        const updatedMessages = Object.keys(messages).reduce((acc, key) => {
          acc[key] = { ...messages[key], isRead: true };
          return acc;
        }, {});

        // تحديث الرسائل
        set(messageRef, updatedMessages)
          .then(() => res.status(200).send("Message status updated to read"))
          .catch((error) => res.status(500).send(error.message));
      } else {
        res.status(404).send("Message not found");
      }
    })
    .catch((error) => res.status(500).send(error.message));
});






// تعقيم البريد الإلكتروني (اختياري)
const sanitizeEmail0 = (email) => email.replace(/[@.]/g, (match) => (match === "@" ? "_at_" : "_dot_"));

// Endpoint لإرسال الرسائل
router.post("/sendMessagebyage", (req, res) => {
  const { ageGroup, sender, message } = req.body;

  if (!ageGroup || !sender || !message) {
    return res.status(400).send("Missing required parameters");
  }

  const messageRef = ref(db, `chat/${ageGroup}/${Date.now()}`);
  const newMessage = { sender, message, timestamp: Date.now() };

  set(messageRef, newMessage)
    .then(() => res.status(200).send("Message sent successfully!"))
    .catch((error) => res.status(500).send(error.message));
});

router.get("/getMessagesbyage", (req, res) => {
    const { ageGroup } = req.query;
  
    if (!ageGroup) {
      return res.status(400).json({ error: "Missing required parameters" });
    }
  
    const messagesRef = ref(db, `chat/${ageGroup}`);
    get(messagesRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          res.status(200).json(snapshot.val()); // إرسال البيانات في حالة وجودها
        } else {
          res.status(200).json([]); // إرسال مصفوفة فارغة عند عدم وجود بيانات
        }
      })
      .catch((error) => res.status(500).json({ error: error.message }));
  });
  




// Fetching child age
router.get('/getChildAge/:id', child.getChildAge);

// User-related routes
router.get('/getnamePerantbyemail/:id', users.getnamePerantbyemail);

// Clinic-related routes
router.get('/showallclincName', clinic.showallclincName);
router.get('/getclinirenByid/:id', clinic.getclinirenByid);

// Child measurements routes
const childmeasurements = require('../controllers/childmeasurements'); 
router.get('/getmeasurementsChildrenById/:id', childmeasurements.getmeasurementsChildrenById);
router.get('/weightHight/:id', childmeasurements.weightHight);
router.get('/ideal_child_data', childmeasurements.ideal_child_data);
router.get('/ideal_child_data_female', childmeasurements.ideal_child_data_female);
// Fetching clinics from DB
router.get('/DBclinics', clinicsModel.getClinics);

// Common question for AI chat
router.post('/Vaccines_by_age', aiModel.getVaccinesHandler);
const appointmentsController = require('../controllers/appointments'); // استيراد الكونترولر
router.get('/getClinicsWorkTime/:clinic', (req, res) => {
  const clinic_id = req.params.clinic; // الحصول على ID العيادة من الرابط

  // استدعاء الدالة التي تحتوي على الاستعلام
  getClinicsWorkTimeFromDB(clinic_id, (err, workTime) => {
    if (err) {
      // التعامل مع الأخطاء
      return res.status(500).json({ error: 'An error occurred', details: err });
    }
    if (workTime === 'No clinic found with the given ID.') {
      // إذا لم يتم العثور على العيادة
      return res.status(404).json({ message: workTime });
    }
    // إذا تم العثور على وقت العمل
    res.status(200).json({ workTime });
  });
});
router.get("/getAppointmentsByClinicId/:clinic", (req, res) => {
  const {clinic } = req.params;

  getAppointmentsByClinicId( clinic, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب الحجوزات." });
    }
    res.json(results);
  });
});

router.post('/updateAppointmentStatus', appointmentsController.updateAppointmentStatus);
router.get("/getdoctorsByclinic1/:clinic_id", (req, res) => {
  const { clinic_id } = req.params;

  getdoctorsByclinic1(clinic_id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب الحجوزات." });
    }
    res.json(results);
  });
});
router.get("/getdoctorsByclinic2/:clinic_id", (req, res) => {
  const { clinic_id } = req.params;

  getdoctorsByclinic2(clinic_id, (err, results) => {
    if (err) {
      return res.status(500).json({ error: "حدث خطأ أثناء جلب الحجوزات." });
    }
    res.json(results);
  });
});
router.post("/pendingBookings", (req, res) => {
  pendingBookings(req.body, (err, result) => {
    if (err) {
      return res.status(500).json({ error: "حدث خطأ أثناء إضافة الحجز." });
    }
    if (result.error) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  });
});



const { getChildAgeAndVaccine } = require('../controllers/nextVaccineDate');
const { getNextAge } = require('../controllers/nextVaccineDate');

router.get('/getChildAgeAndVaccine/:id', getChildAgeAndVaccine);
router.get("/getNextAge/:childId", getNextAge);


//router.get("/get-vaccine-status/:id", getChildVaccineStatus);

// Nearby clinics
router.get('/nearby-clinics', (req, res) => {
    console.log('Request received:', req.query);
    const { latitude, longitude } = req.query; // Get latitude and longitude from query params

    if (!latitude || !longitude) {
        return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    nearestClinicModel.findNearbyClinics(parseFloat(latitude), parseFloat(longitude), (err, results) => {
        if (err) {
            return res.status(500).json({ message: 'Error retrieving nearby clinics', error: err });
        }
        res.json({ clinics: results });
    });
});
router.get('/clinics', clinicsModel.getClinics);

//للفحوصات عند الدكتور
// API لاسترجاع البيانات بناءً على child_id
const { getChildInfo } = require('../controllers/children'); // تأكد من المسار الصحيح
router.get('/childinfo/:child_id', (req, res) => {
  const { child_id } = req.params;

  getChildInfo(child_id, (err, childInfo) => {
    if (err) {
      res.status(500).json({ message: 'حدث خطأ أثناء استرجاع البيانات', error: err });
    } else if (childInfo) {
      res.status(200).json({ child_info: childInfo });
    } else {
      res.status(404).json({ message: 'الطفل غير موجود' });
    }
  });
});


router.post('/addchildmeasurements', (req, res) => {
  const { child_id, Birth_month, Birth_Year, head_circumference, height, weight, Childs_age_in_months_at_the_time_of_measurement } = req.body;

  const query = `
    INSERT INTO childmeasurements (child_id, Birth_month, Birth_Year, head_circumference, height, weight, Childs_age_in_months_at_the_time_of_measurement)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db5.query(query, [child_id, Birth_month, Birth_Year, head_circumference, height, weight, Childs_age_in_months_at_the_time_of_measurement], (err, result) => {
    if (err) {
      res.status(500).json({ message: 'حدث خطأ أثناء إضافة القياس', error: err });
    } else {
      res.status(201).json({ message: 'تم إضافة القياس بنجاح' });
    }
  });
});
router.post("/addTest", (req, res) => {
  const { name, description, test_date, test_result, child_id, clinic_id, doctor_id } = req.body;

  // التحقق من وجود جميع القيم
  if (!name || !description || !test_date || !test_result || !child_id || !clinic_id || !doctor_id) {
    return res.status(400).json({ message: "جميع الحقول مطلوبة" });
  }

  // إضافة الفحص إلى قاعدة البيانات
  const query = `
    INSERT INTO tests (name, description, test_date, test_result, child_id, clinic_id, doctor_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  const values = [name, description, test_date, test_result, child_id, clinic_id, doctor_id];

  db5.query(query, values, (err, result) => {
    if (err) {
      console.error("حدث خطأ أثناء إضافة الفحص:", err);
      return res.status(500).json({ message: "حدث خطأ أثناء إضافة الفحص" });
    }

    // تحديث حالة الطعم من "مجدولة" إلى "مكتملة" لنفس child_id و clinic_id و appointment_day
    const updateQuery = `
      UPDATE vaccinationrecords
      SET status = 'مكتملة'
      WHERE child_id = ? AND clinic_id = ? AND appointment_day = ? AND status = 'مجدولة' AND reason = 'فحص'`;

    const updateValues = [child_id, clinic_id, test_date];

    db5.query(updateQuery, updateValues, (updateErr, updateResult) => {
      if (updateErr) {
        console.error("حدث خطأ أثناء تحديث حالة الطعم:", updateErr);
        return res.status(500).json({ message: "حدث خطأ أثناء تحديث حالة الطعم" });
      }

      res.status(200).json({ message: "تم إضافة الفحص وتحديث حالة الطعم بنجاح", testId: result.insertId });
    });
  });
});

// إنشاء الـ API لجلب التعليقات بناءً على رقم العيادة
router.get('/getComments/:clinic_id', (req, res) => {
  const clinicId = req.params.clinic_id;

  const query = 'SELECT comment FROM ratings WHERE clinic_id = ? and comment!="NULL"  ORDER BY timestamp DESC';
  db5.query(query, [clinicId], (err, results) => {
    if (err) {
      console.error('خطأ في استعلام قاعدة البيانات:', err);
      return res.status(500).json({ message: 'حدث خطأ أثناء جلب التعليقات' });
    }
    return res.json({ comments: results });
  });
});



// API لإضافة التقييم
router.post('/addRating', (req, res) => {
  const { clinic_id, rating,comment } = req.body;

  if (!clinic_id || !rating) {
    return res.status(400).send('يرجى توفير clinic_id و rating');
  }

  const query = 'INSERT INTO ratings (clinic_id, rating, comment) VALUES (?, ?, ?)';
  db5.query(query, [clinic_id, rating,comment], (err, result) => {
    if (err) {
      console.error('خطأ في إضافة التقييم:', err);
      return res.status(500).send('حدث خطأ');
    }

    const updateAvgQuery = `
      UPDATE clinics
      SET badge = (SELECT AVG(rating) FROM ratings WHERE clinic_id = ?)
      WHERE clinic_id = ?
    `;
    db5.query(updateAvgQuery, [clinic_id, clinic_id], (err) => {
      if (err) {
        console.error('خطأ في تحديث التقييم المتوسط:', err);
        return res.status(500).send('حدث خطأ');
      }

      res.send('تم إضافة التقييم وتحديث العيادة بنجاح');
    });
  });
});
//
router.post('/updateVaccineStatusDONE', async (req, res) => {
  const { id_child, nextVaccine } = req.body;

  if (!id_child || !nextVaccine) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // بناء الاستعلام بشكل ديناميكي
    const query = `UPDATE vaccineschild SET ?? = 1 WHERE id_child = ?`;

    // تنفيذ الاستعلام مع استخدام nextVaccine كاسم عمود
    await db5.query(query, [nextVaccine, id_child]);

    res.status(200).json({ message: 'Vaccine status updated successfully.' });
  } catch (error) {
    console.error('Error updating vaccine status:', error);
    res.status(500).json({ error: 'Failed to update vaccine status.' });
  }
});
router.delete("/deleteNotificationsToDONE", async (req, res) => {
  const { readedValue } = req.body;

  if (readedValue === undefined) {
    return res.status(400).json({ error: "الرجاء توفير قيمة readed" });
  }

  try {
    const result = await db5.query(
      "DELETE FROM notifications WHERE readed = ?",
      [readedValue]
    );
    res.status(200).json({
      message: "تم حذف الإشعارات بنجاح.",
      deletedRows: result.affectedRows,
    });
  } catch (error) {
    console.error("خطأ أثناء حذف الإشعارات:", error);
    res.status(500).json({ error: "حدث خطأ أثناء حذف الإشعارات." });
  }
});
const bcrypt = require('bcrypt');

const db10 = require('../config/dbconnection');


router.put('/change-password', async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;

  if (!email || !currentPassword || !newPassword) {
      return res.status(400).json({ message: 'الرجاء إدخال البريد الإلكتروني وكلمة المرور الحالية والجديدة' });
  }

  try {
      // جلب بيانات المستخدم بناءً على البريد الإلكتروني
      const sql = 'SELECT * FROM users WHERE email = ?';
      db10.query(sql, [email], async (error, results) => {
          if (error) {
              console.error('Error fetching user:', error);
              return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
          }

          if (results.length === 0) {
              return res.status(404).json({ message: 'المستخدم غير موجود' });
          }

          const user = results[0];

          // التحقق من كلمة المرور الحالية
          const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
          if (!isMatch) {
              return res.status(200).json({ message: 'كلمة المرور الحالية غير صحيحة' });
          }

          // التحقق من أن كلمة المرور الجديدة تختلف عن الحالية
          const isSameAsOld = await bcrypt.compare(newPassword, user.password_hash);
          if (isSameAsOld) {
              return res.status(200).json({ message: 'كلمة المرور الجديدة لا يمكن أن تكون نفس الحالية' });
          }

          // تشفير كلمة المرور الجديدة
          const hashedPassword = await bcrypt.hash(newPassword, 10);

          // تحديث كلمة المرور في قاعدة البيانات
          const updateSql = 'UPDATE users SET password_hash = ? WHERE email = ?';
          db10.query(updateSql, [hashedPassword, email], (updateError) => {
              if (updateError) {
                  console.error('Error updating password:', updateError);
                  return res.status(500).json({ message: 'حدث خطأ أثناء تحديث كلمة المرور' });
              }

              return res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح' });
          });
      });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json({ message: 'حدث خطأ غير متوقع' });
  }
});

// دالة للحصول على الإشعارات الخاصة بالـ parentId
router.get('/notifications/:parentId', (req, res) => {
  const parentId = req.params.parentId;

  // استعلام لجلب الإشعارات المتعلقة بالـ parentId
  const query = 'SELECT * FROM mobile_notifications WHERE parent_id = ? ORDER BY date_sent DESC';
  
  db5.query(query, [parentId], (err, results) => {
      if (err) {
          console.error('Error fetching notifications:', err);
          return res.status(500).json({ message: 'Error fetching notifications' });
      }

      // التحقق إذا كانت الإشعارات موجودة
      if (results.length === 0) {
          return res.status(201).json({ message: 'No notifications found for the given parentId' });
      }

      // إرسال الإشعارات في الرد
      res.status(200).json(results);
  });
});

module.exports = router;
