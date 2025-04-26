const db = require('../config/dbconnection'); 

const ageGroups = [
  "حديث الولادة",
  "الشهر الأول",
  "الشهر الثاني",
  "الشهر الرابع",
  "الشهر السادس",
  "السنة",
  "السنة ونصف",
  "الستّ سنوات",
  "الخمسة عشر"
];

// API لعرض الطعومات بناءً على الكلمات المفتاحية والعمر
const getVaccinesHandler = (req, res) => {
  const { question } = req.body;

  if (!question) {
    return res.status(400).json({ message: 'يرجى تقديم السؤال' });
  }

  // استخراج العمر من السؤال
  const age = extractAgeFromQuestion(question);
  console.log('العمر المستخرج:', age);

  // إذا تم العثور على العمر
  if (!age) {
    return res.status(400).json({ message: 'لم يتم تحديد العمر بشكل صحيح في السؤال' });
  }

  // البحث عن الكلمات المفتاحية المرتبطة بالطعومات
  const keywordMatch = extractVaccineKeywords(question);

  if (!keywordMatch) {
    return res.status(400).json({ message: 'لم يتم العثور على كلمات مفتاحية تتعلق بالطعومات' });
  }

  // استعلام للبحث عن الطعومات بناءً على العمر
  const query = `SELECT name, age_group FROM vaccines WHERE age_group LIKE ?`;

  // استخدام db.query لتنفيذ الاستعلام
  db.query(query, [`%${age}%`], (err, results) => {
    if (err) {
      console.error('حدث خطأ في استرجاع البيانات:', err);
      return res.status(500).json({ message: 'حدث خطأ في استرجاع البيانات' });
    }

    console.log('النتائج المسترجعة من قاعدة البيانات:', results);

    if (results.length === 0) {
      return res.status(404).json({ message: 'لا توجد طعومات لهذه الفئة العمرية' });
    }

    // التأكد من أن البيانات في results هي مصفوفة تحتوي على الكائنات الصحيحة
    if (!Array.isArray(results)) {
      return res.status(500).json({ message: 'البيانات غير صحيحة، يرجى التحقق من قاعدة البيانات' });
    }

    // استخراج أسماء اللقاحات والتأكد من أنها مصفوفة
    const vaccines = results
      .filter(v => v.name && typeof v.name === 'string' && v.name.trim() !== '') // تصفية النتائج لتشمل فقط اللقاحات التي تحتوي على اسم غير فارغ
      .map(v => v.name.trim()); // استخراج اسم اللقاح فقط مع إزالة المسافات الزائدة

    console.log('الطعومات المستخرجة:', vaccines);

    // التحقق من أن vaccines هي مصفوفة غير فارغة
    if (!Array.isArray(vaccines) || vaccines.length === 0) {
      return res.status(404).json({ message: 'لا توجد طعومات لهذه الفئة العمرية' });
    }

    // استخدام join بعد التأكد أن vaccines هي مصفوفة
    const vaccinesList = vaccines.join(', ');

    res.json({ vaccines: vaccinesList });
  });
};

// استخراج العمر من السؤال باستخدام تعبيرات عادية
const extractAgeFromQuestion = (question) => {
  // البحث عن العمر باستخدام الـ ageGroups
  for (const age of ageGroups) {
    if (question.includes(age)) {
      return age;
    }
  }
  return null; // في حالة عدم العثور على العمر في السؤال
};

// استخراج الكلمات المفتاحية المتعلقة بالطعومات
const extractVaccineKeywords = (question) => {
  const keywords = ['التطعيمات', 'الطعومات', 'المطاعيم', 'اللقاحات'];
  for (let keyword of keywords) {
    if (question.includes(keyword)) {
      return true;
    }
  }
  return false;
};

module.exports = { getVaccinesHandler };
