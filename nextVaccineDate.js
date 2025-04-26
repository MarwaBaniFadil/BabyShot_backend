const db = require('../config/dbconnection');

// تعديل دالة getNextAge لتستقبل req و res مباشرة
const getNextAge = (req, res) => {
  const childId = req.params.childId; // أخذ childId من المعاملات

  const query = `
    SELECT 
      CASE
        WHEN month0 = 0 THEN 'month0'
        WHEN month1 = 0 THEN 'month1'
        WHEN month2 = 0 THEN 'month2'
        WHEN month4 = 0 THEN 'month4'
        WHEN month6 = 0 THEN 'month6'
        WHEN month12 = 0 THEN 'month12'
        WHEN month18 = 0 THEN 'month18'
        WHEN year6 = 0 THEN 'year6'
        WHEN year15 = 0 THEN 'year15'
        ELSE NULL
      END AS nextAge
    FROM vaccineschild
    WHERE id_child = ?
    LIMIT 1;
  `;

  db.query(query, [childId], (err, results) => {
    if (err) {
      console.error('خطأ أثناء الاستعلام:', err);
      return res.status(500).json({ error: 'خطأ في الخادم' });  // إرسال الخطأ عبر res
    }

    if (results.length === 0) {
      return res.status(200).json({ message: 'لم يتم العثور على الطفل.' });  // إرسال رسالة عدم العثور عبر res
    }

    const nextAge = results[0].nextAge;
    if (!nextAge) {
      return res.json({ message: 'جميع الأعمار تم تسجيلها بالفعل.' });  // إذا كانت جميع الأعمار مسجلة، إرسال الرسالة عبر res
    }

    res.json({ nextAge });  // إرسال nextAge عبر res
  });
};
const moment = require('moment');

// جدول الطعوم
const vaccinationSchedule = [
  { key: 'month0', age: 0 },
  { key: 'month1', age: 1 },
  { key: 'month2', age: 2 },
  { key: 'month4', age: 4 },
  { key: 'month6', age: 6 },
  { key: 'month12', age: 12 },
  { key: 'month18', age: 18 },
  { key: 'year6', age: 72 },  // 6 سنوات = 72 شهر
  { key: 'year15', age: 180 } // 15 سنة = 180 شهر
];

// دالة لحساب العمر
const calculateAge = (birthDate) => {
  const now = moment();
  const age = moment(birthDate);
  const years = now.diff(age, 'years');
  age.add(years, 'years');
  const months = now.diff(age, 'months');
  age.add(months, 'months');
  const days = now.diff(age, 'days');

  return { years, months, days };
};

// دالة لحساب أول طعم أكبر من عمر الطفل أو الطعم نفسه إذا كان بالضبط
const getNextVaccine = (ageInMonths, ageInDays) => {
  // التحقق إذا كان عمر الطفل يطابق أحد الأعمار في الجدول
  const exactMatch = vaccinationSchedule.find(vaccine => ageInMonths === vaccine.age && ageInDays === 0);

  if (exactMatch) {
    return exactMatch;  // إذا كان هناك تطابق دقيق مع الطعم في الجدول
  }

  // إذا لم يكن هناك تطابق دقيق، نرجع أول طعم أكبر من العمر
  const upcomingVaccines = vaccinationSchedule.filter(vaccine => ageInMonths < vaccine.age);

  if (upcomingVaccines.length > 0) {
    return upcomingVaccines[0];
  } else {
    return null; // إذا لم يكن هناك طعم مناسب
  }
};

// استرجاع عمر الطفل وتحديد أول طعم أكبر من عمره أو نفسه
const getChildAgeAndVaccine = (req, res) => {
  const childId = req.params.id;  // نأخذ رقم الطفل من المعاملات

  db.query('SELECT date_of_birth FROM children WHERE child_id = ?', [childId], (err, result) => {
    if (err) {
      return res.status(500).send({ error: 'Internal server error' });
    }
    if (result.length === 0) {
      return res.status(404).send({ error: 'No child found for this ID!' });
    }

    const dateOfBirth = result[0].date_of_birth;
    const age = calculateAge(dateOfBirth);

    // تحويل العمر إلى شهور وأيام
    const ageInMonths = age.years * 12 + age.months;
    const ageInDays = age.days;

    // تحديد أول طعم أكبر من عمر الطفل أو نفسه
    const nextVaccine = getNextVaccine(ageInMonths, ageInDays);

    if (nextVaccine) {
      // إضافة العمر المناسب إلى تاريخ الميلاد لحساب تاريخ الطعم
      const nextVaccineDate = moment(dateOfBirth).add(nextVaccine.age, 'months').format('YYYY-MM-DD');
      
      return res.status(200).send({
        child_id: childId,
        age,
        nextVaccine: nextVaccine.key,
        nextVaccineDate
      });
    } else {
      return res.status(200).send({
        child_id: childId,
        age,
        nextVaccine: "لا يوجد",
        nextVaccineDate: "لا يوجد"
      });
        }
  });
};

module.exports = { getChildAgeAndVaccine,getNextAge };

