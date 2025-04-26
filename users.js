const db = require('../config/dbconnection');
const bcrypt = require('bcrypt');



    const getnamePerantbyemail=(req,res)=>{

        const id = req.params.id;
    
        db.query('SELECT id,name,husbandName FROM registrations WHERE email=?',id,(err, users) => {
            if (err) {
                // console.error('Error fetching users:', err);
                return res.status(500).send({ error: 'Internal server error' });
            }
            
    if (users==""){ res.status(500).send({ error: "OPSs! " });}
      else          res.status(200).send({ users });
           
               
            
        });
    
    };
    // دالة لإضافة البيانات إلى قاعدة البيانات

    const addRegistrationData = (registrationData, callback) => {
        const {
            momId,
            email,
            password,
            name,
            birthDate,
            bloodType,
            childrenCount,
            husbandName,
            husbandId,
            address,
            contactNumber,
        } = registrationData;
    
        // التحقق إذا كانت الأم موجودة بالفعل
        const checkMotherQuery = `
            SELECT * 
            FROM registrations 
            WHERE momId = ?
        `;
    
        db.query(checkMotherQuery, [momId], (err, results) => {
            if (err) {
                console.error('Error while checking mother existence:', err);
                return callback({ status: 500, message: 'خطأ أثناء التحقق من الأم في النظام.', error: err });
            }
    
            if (results.length > 0) {
                // الأم موجودة بالفعل
                return callback({ status: 200, message: 'الأم موجودة بالفعل في النظام.' }); // 409: Conflict
            }
    
            // الأم غير موجودة، نتابع إضافة البيانات
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    console.error('Error while hashing the password:', err);
                    return callback({ status: 500, message: 'خطأ أثناء تشفير كلمة المرور.', error: err });
                }
    
                // إدخال البيانات في جدول registrations
                const registrationQuery = `
                    INSERT INTO registrations (momId, email, password, name, birthDate, bloodType, childrenCount, husbandName, husbandId, address, contactNumber)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                db.query(
                    registrationQuery,
                    [momId, email, hashedPassword, name, birthDate, bloodType, childrenCount, husbandName, husbandId, address, contactNumber],
                    (err, result) => {
                        if (err) {
                            console.error('Error while inserting into registrations:', err);
                            return callback({ status: 500, message: 'خطأ أثناء إدخال البيانات في جدول registrations.', error: err });
                        }
    
                        // نحصل على الـ id الخاص بـ registration الذي تم إدخاله
                        const registrationId = result.insertId;
    
                        // إدخال البيانات في جدول users
                        const usersQuery = `
                            INSERT INTO users (user_id, email, password_hash, role)
                            VALUES (?, ?, ?, ?)
                        `;
                        db.query(
                            usersQuery,
                            [registrationId, email, hashedPassword, 'Parent'],
                            (err) => {
                                if (err) {
                                    console.error('Error while inserting into users:', err);
                                    return callback({ status: 500, message: 'خطأ أثناء إدخال البيانات في جدول users.', error: err });
                                }
    
                                callback({ status: 200, message: 'تم' }); // 201: Created
                            }
                        );
                    }
                );
            });
        });
    };
    
    const createRegistration = (req, res) => {
        const registrationData = req.body;
    
        // التحقق من أن جميع الحقول موجودة وغير فارغة
        const requiredFields = [
            'momId',
            'email',
            'password',
            'name',
            'birthDate',
            'bloodType',
            'childrenCount',
            'husbandName',
            'husbandId',
            'address',
            'contactNumber',
        ];
    
        const missingFields = requiredFields.filter((field) => !registrationData[field]);
    
        if (missingFields.length > 0) {
            return res.status(200).json({ // 400: Bad Request
                message: 'يرجى ملء جميع الحقول.',
                missingFields,
            });
        }
    
        addRegistrationData(registrationData, (response) => {
            const { status, message, error } = response;
    
            if (error) {
                return res.status(status).json({ message, error });
            }
    
            res.status(status).json({ message });
        });
    };
    const getMotherData = (momId, callback) => {
        // استعلام للحصول على بيانات الأم بناءً على momId
        const query = `
            SELECT *
            FROM registrations
            WHERE momId = ?
        `;
    
        db.query(query, [momId], (err, results) => {
            if (err) {
                console.error('Error while fetching mother data:', err);
                return callback(err, null);
            }
    
            // التحقق من وجود نتائج
            if (results.length === 0) {
                return callback(null, { message: 'لم يتم العثور على بيانات للأم بهذا الرقم.' });
            }
    
            callback(null, results[0]); // إرجاع أول نتيجة
        });
    };
    
    // التحكم في الطلبات (API)
    const getMotherById = (req, res) => {
        const { momId } = req.params;
    
        if (!momId) {
            return res.status(200).json({ message: 'يرجى تقديم رقم هوية الأم.' });
        }
    
        getMotherData(momId, (err, data) => {
            if (err) {
                return res.status(500).json({ message: 'حدث خطأ أثناء جلب البيانات.', error: err });
            }
    
            res.status(200).json(data);
        });
    };
    const updateRegistrationData = (momId, updatedData, callback) => {
        // إنشاء جزء من الاستعلام بناءً على الحقول المرسلة للتحديث
        let updateFields = [];
        let values = [];
        
        // ملاحظة: نقوم فقط بإضافة الحقول التي تم إرسالها
        const fieldMappings = {
            name: 'name',
            birthDate: 'birthDate',
            bloodType: 'bloodType',
            childrenCount: 'childrenCount',
            husbandName: 'husbandName',
            husbandId: 'husbandId',
            address: 'address',
            contactNumber: 'contactNumber'
        };
    
        // تحقق من البيانات المرسلة لبناء الاستعلام
        for (let field in updatedData) {
            if (fieldMappings[field]) {
                updateFields.push(`${fieldMappings[field]} = ?`);
                values.push(updatedData[field]);
            }
        }
    
        // إذا لم توجد أي حقول للتحديث، نرجع رسالة خطأ
        if (updateFields.length === 0) {
            return callback({ status: 200, message: 'يرجى توفير بيانات لتحديثها.' });
        }
    
        // إضافة `momId` في النهاية كشرط WHERE
        const updateQuery = `
            UPDATE registrations 
            SET ${updateFields.join(', ')} 
            WHERE momId = ?
        `;
        
        values.push(momId);
    
        // تنفيذ الاستعلام لتحديث البيانات
        db.query(updateQuery, values, (err, result) => {
            if (err) {
                console.error('Error while updating registration data:', err);
                return callback({ status: 500, message: 'حدث خطأ أثناء تحديث البيانات.', error: err });
            }
    
            // إذا لم يتم تعديل أي صفوف، نقول أن الـ momId غير موجود
            if (result.affectedRows === 0) {
                return callback({ status: 404, message: 'لم يتم العثور على الأم بهذا الرقم (momId).' });
            }
    
            callback({ status: 200, message: 'تم تحديث البيانات بنجاح.' }); // 200: OK
        });
    };
    
    const updateRegistration = (req, res) => {
        const { momId, updatedData } = req.body;
    
        // التحقق من وجود momId والبيانات المراد تحديثها
        if (!momId || !updatedData || Object.keys(updatedData).length === 0) {
            return res.status(200).json({ message: 'يرجى توفير رقم الهوية (momId) وبيانات التحديث.' });
        }
    
        // تحديث البيانات بناءً على الـ momId والـ updatedData
        updateRegistrationData(momId, updatedData, (response) => {
            const { status, message, error } = response;
    
            if (error) {
                return res.status(status).json({ message, error });
            }
    
            res.status(status).json({ message });
        });
    };

module.exports = {
    getnamePerantbyemail,createRegistration,getMotherById ,updateRegistration 
};



