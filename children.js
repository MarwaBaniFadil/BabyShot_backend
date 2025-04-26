const db = require('../config/dbconnection');

// دالة لحساب العمر
const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let years = today.getFullYear() - birthDate.getFullYear();
    let months = today.getMonth() - birthDate.getMonth();
    let days = today.getDate() - birthDate.getDate();

    if (days < 0) {
        months--;
        days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    return { years, months, days };
};

// استرجاع عمر طفل بناءً على child_id
const getChildAge = (req, res) => {
    const id = req.params.id;

    db.query('SELECT date_of_birth FROM children WHERE child_id = ?', [id], (err, result) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }
        if (result.length === 0) {
            return res.status(404).send({ error: 'No child found for this ID!' });
        }

        const dateOfBirth = result[0].date_of_birth;
        const age = calculateAge(dateOfBirth);
        res.status(200).send({ child_id: id, age });
    });
};

// استرجاع الأطفال بناءً على parent_id
const getChildrenByParentId = (req, res) => {
    const id = req.params.id;

    db.query('SELECT name, child_id, gender, date_of_birth FROM children WHERE parent_id = ?', [id], (err, users) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }
        if (users.length === 0) {
            return res.status(201).send({ error: 'No children found for this parent ID!' });
        }
        res.status(200).send({ users });
    });
};

// استرجاع تفاصيل طفل بناءً على child_id
const showAllChildrenById = (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM children WHERE child_id = ?', [id], (err, users) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }
        if (users.length === 0) {
            return res.status(404).send({ error: 'No child found for this ID!' });
        }
        res.status(200).send({ users });
    });
};


const deleteChild = (req, res) => {
  const { child_id } = req.params;

  // التحقق إذا كان الطفل موجودًا
  db.query(`SELECT * FROM children WHERE child_id = ?`, [child_id], (error, results) => {
      if (error) {
          console.error(error);
          return res.status(500).json({ message: 'Error checking child existence', error: error.message });
      }

      if (results.length === 0) {
          // إذا لم يتم العثور على الطفل
          return res.status(200).json({ message: 'No child found with the given ID' });
      }

      // حذف بيانات الطفل إذا كان موجودًا
      db.query(`DELETE FROM children WHERE child_id = ?`, [child_id], (deleteError, deleteResult) => {
          if (deleteError) {
              console.error(deleteError);
              return res.status(500).json({ message: 'Error deleting child', error: deleteError.message });
          }

          if (deleteResult.affectedRows > 0) {
              // إذا تم الحذف بنجاح
              return res.status(200).json({ message: 'Child deleted successfully' });
          } else {
              // حالة نادرة: إذا لم يتم الحذف لسبب غير معروف
              return res.status(500).json({ message: 'Failed to delete child' });
          }
      });
  });
};






// استرجاع جميع الأطفال
const showAllChildren = (req, res) => {
db.query('SELECT * FROM children', (err, children) => {
if (err) {
    console.error('Error fetching children:', err);
    return res.status(500).send({ error: 'Internal server error' });
}
res.status(200).send({ children });
});
};






const addChild = async (req, res) => {
  const {
    child_id,
    mom_id, // الموم اي دي الذي يدخله المستخدم
    name,
    date_of_birth,
    gender,
    medical_conditions,
    blood_type,
    birth_weight,
    current_weight,
    current_height,
    head_circumference,
    birth_place,
    birth_hospital,
    birth_type,
    pregnancy_weeks,
    birth_height,
  } = req.body;

  try {
    // الخطوة الأولى: جلب parent_id باستخدام mom_id
    const getParentQuery = 'SELECT id FROM registrations WHERE momId = ?';
    db.query(getParentQuery, [mom_id], (err, parentResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error fetching parent_id', error: err.message });
      }

      if (parentResult.length === 0) {
        return res.status(200).json({ message: 'لا توجد أم لها رقم الهوية هذا' });
      }

      const parent_id = parentResult[0].id;

      // الخطوة الثانية: التحقق إذا كان child_id موجودًا مسبقًا
      const checkQuery = 'SELECT * FROM children WHERE child_id = ?';
      db.query(checkQuery, [child_id], (err, childResult) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Error checking child_id', error: err.message });
        }

        if (childResult.length > 0) {
          return res.status(200).json({ message: 'هذا الطفل موجود مسبقًا في النظام' });
        }

        // الخطوة الثالثة: إضافة الطفل
        const insertQuery = `
          INSERT INTO children (
            child_id, parent_id, name, date_of_birth, gender,
            medical_conditions, blood_type, birth_weight, current_weight,
            current_height, head_circumference, birth_place, birth_hospital,
            birth_type, pregnancy_weeks, birth_height
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          child_id, parent_id, name, date_of_birth, gender,
          medical_conditions, blood_type, birth_weight, current_weight,
          current_height, head_circumference, birth_place, birth_hospital,
          birth_type, pregnancy_weeks, birth_height,
        ];

        db.query(insertQuery, values, (err, insertResult) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error adding child', error: err.message });
          }

          res.status(200).json({ message: 'تم إضافة الطفل بنجاح' });
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding child', error: error.message });
  }
};


const searchChild = (req, res) => {
    const { child_name, father_name } = req.body;
  
    if (!child_name || !father_name) {
      return res.status(400).json({ message: 'يجب توفير اسم الطفل واسم الأب.' });
    }
  
    const query = `
      SELECT 
        c.name AS child_name, 
        c.child_id, 
        c.date_of_birth, 
        c.gender, 
        c.blood_type, 
        c.birth_weight, 
        c.birth_height, 
        c.birth_type, 
        c.birth_place, 
        c.birth_hospital, 
        c.pregnancy_weeks, 
        c.medical_conditions, 
        r.name AS parent_name, 
        r.husbandName AS father_name
      FROM children AS c
      INNER JOIN registrations AS r
      ON c.parent_id = r.id
      WHERE c.name = ? AND r.husbandName = ?
    `;
  
    db.query(query, [child_name, father_name], (err, results) => {
      if (err) {
        console.error('خطأ في البحث عن الطفل:', err);
        return res.status(500).json({ message: 'حدث خطأ أثناء البحث.' });
      }
  
      if (results.length === 0) {
        // إذا لم يتم العثور على الطفل، إرجاع رسالة بدون خطأ
        return res.status(200).json({ message: 'لم يتم العثور على الطفل.', child: [] });
      }
  
      // إذا تم العثور على الطفل
      res.status(200).json({ message: 'تم العثور على الطفل.', child: results });
    });
  };
  const getChildById = (req, res) => {
    const { child_id } = req.params; // استخراج child_id من الطلب
  
    if (!child_id) {
      return res.status(400).json({ message: 'يجب توفير معرف الطفل.' });
    }
  
    const query = `
      SELECT 
        c.name AS child_name, 
        c.child_id, 
        c.date_of_birth, 
        c.gender, 
        c.blood_type, 
        c.birth_weight, 
        c.birth_height, 
        c.birth_type, 
        c.birth_place, 
        c.birth_hospital, 
        c.pregnancy_weeks, 
        c.medical_conditions, 
        r.name AS parent_name, 
        r.husbandName AS father_name
      FROM children AS c
      INNER JOIN registrations AS r
      ON c.parent_id = r.id
      WHERE c.child_id = ?
    `;
  
    db.query(query, [child_id], (err, results) => {
      if (err) {
        console.error('خطأ في البحث عن الطفل:', err);
        return res.status(500).json({ message: 'حدث خطأ أثناء البحث.' });
      }
  
      if (results.length === 0) {
        // إذا لم يتم العثور على الطفل، إرجاع رسالة بدون خطأ
        return res.status(200).json({ message: 'لم يتم العثور على الطفل.', child: null });
      }
  
      // إذا تم العثور على الطفل
      res.status(200).json({ message: 'تم العثور على الطفل.', child: results[0] });
    });
  };
  const updateChildField = (req, res) => {
    const { child_id } = req.params;
    const { field, value } = req.body; // الحقل والبيانات الجديدة
  
    // بناء استعلام لتحديث الحقل المحدد فقط
    let query = `UPDATE children SET ${field} = ? WHERE child_id = ?`;
    const queryParams = [value, child_id];
  
    db.query(query, queryParams, (error, result) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating child field', error: error.message });
      }
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'No child found with the given ID' });
      }
  
      return res.status(200).json({ message: 'Child field updated successfully' });
    });
  };
  const getChildren = (req, res) => {
    const { gender, age, city, birth_type, child_id } = req.query;

    // بناء الاستعلام الأساسي مع الانضمام إلى جدول registrations
    let query = `
        SELECT 
            children.*, 
            registrations.name AS mother_name, 
            registrations.husbandName AS father_name, 
            registrations.contactNumber 
        FROM children
        JOIN registrations ON children.parent_id = registrations.id
        WHERE 1=1
    `;

    // إضافة فلاتر الجندر
    if (gender) query += ` AND children.gender = '${gender}'`;

    // إضافة فلاتر العمر بناءً على الفئات
    if (age) {
        switch (age) {
            case 'حديث الولادة':
                query += ` AND TIMESTAMPDIFF(MONTH, children.date_of_birth, CURDATE()) <= 1`;
                break;
            case 'شهر':
                query += ` AND TIMESTAMPDIFF(MONTH, children.date_of_birth, CURDATE()) = 1`;
                break;
            case 'شهر-شهرين':
                query += ` AND TIMESTAMPDIFF(MONTH, children.date_of_birth, CURDATE()) BETWEEN 1 AND 2`;
                break;
            case 'شهرين-شهور':
                query += ` AND TIMESTAMPDIFF(MONTH, children.date_of_birth, CURDATE()) BETWEEN 2 AND 4`;
                break;
            case '4شهور-6شهور':
                query += ` AND TIMESTAMPDIFF(MONTH, children.date_of_birth, CURDATE()) BETWEEN 4 AND 6`;
                break;
            case '6شهور-سنه':
                query += ` AND TIMESTAMPDIFF(MONTH, children.date_of_birth, CURDATE()) BETWEEN 6 AND 12`;
                break;
            case 'سنه-سنة ونصف':
                query += ` AND TIMESTAMPDIFF(YEAR, children.date_of_birth, CURDATE()) BETWEEN 1 AND 1.5`;
                break;
            case 'سنة ونصف-3سنوات':
                query += ` AND TIMESTAMPDIFF(YEAR, children.date_of_birth, CURDATE()) BETWEEN 1.5 AND 3`;
                break;
            case '3سنوات-6سنوات':
                query += ` AND TIMESTAMPDIFF(YEAR, children.date_of_birth, CURDATE()) BETWEEN 3 AND 6`;
                break;
            case '6سنوات-خمسة عشر سنة':
                query += ` AND TIMESTAMPDIFF(YEAR, children.date_of_birth, CURDATE()) BETWEEN 6 AND 15`;
                break;
            case '15سنه واكثر':
                query += ` AND TIMESTAMPDIFF(YEAR, children.date_of_birth, CURDATE()) >= 15`;
                break;
            default:
                break;
        }
    }

    // إضافة فلاتر المدينة
    if (city) query += ` AND children.birth_place = '${city}'`;

    // إضافة فلاتر نوع الولادة
    if (birth_type) query += ` AND children.birth_type = '${birth_type}'`;

    // إضافة فلتر رقم الطفل إذا تم توفيره
    if (child_id) query += ` AND children.child_id = '${child_id}'`;

    // تنفيذ الاستعلام
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching data:', err);
            res.status(500).send('Error fetching data');
        } else {
            res.json(results);
        }
    });
};
const getPerent = (req, res) => {
  const id = req.params.id;

  db.query('SELECT * FROM registrations WHERE id = ?', [id], (err, users) => {
      if (err) {
          return res.status(500).send({ error: 'Internal server error' });
      }
      if (users.length === 0) {
          return res.status(404).send({ error: 'No parent found for this ID!' });
      }
      res.status(200).send({ users });
  });
};
// childService.js

const getChildInfo = (child_id, callback) => {
  const query = `
    SELECT 
      child_id,
      DATE_FORMAT(date_of_birth, '%m') AS Birth_month,
      DATE_FORMAT(date_of_birth, '%Y') AS Birth_Year,
      TIMESTAMPDIFF(MONTH, date_of_birth, CURDATE()) AS Childs_age_in_months
    FROM children
    WHERE child_id = ?
  `;

  db.query(query, [child_id], (err, result) => {
    if (err) {
      return callback(err, null);
    }
    if (result.length > 0) {
      return callback(null, result[0]);
    } else {
      return callback(null, null);
    }
  });
};
// جلب بيانات تسجيل الأهل بناءً على ID
const getRegistrationById = (req, res) => {
  const { id } = req.params;

  const query = `
      SELECT 
          name , 
          husbandName , 
          contactNumber 
      FROM registrations 
      WHERE id = ?
  `;

  db.query(query, [id], (err, results) => {
      if (err) {
          console.error('Error fetching registration data:', err);
          res.status(500).send('Error fetching registration data');
      } else if (results.length === 0) {
          res.status(404).send('Registration not found');
      } else {
          res.json(results[0]);
      }
  });
};

  
module.exports = {
  getChildAge,
  getChildrenByParentId,
  showAllChildrenById,
  showAllChildren,
  deleteChild,
  addChild,
  searchChild,
  getChildById,
  updateChildField,
  getChildren,
  getPerent,
  getChildInfo,
  getRegistrationById
};
