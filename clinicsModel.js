const db = require('../config/dbconnection');
require('dotenv').config();
// Endpoint لجلب العيادات
exports.getClinics = (req, res) => {
    const sql = `SELECT clinic_id, name, city, address, contact_number, latitude, longitude FROM clinics`;

    db.query(sql, (error, results) => {
        if (error) {
            console.error('Error fetching clinics:', error);
            return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
        }

        if (results.length === 0) {
            return res.status(404).json({ message: 'لا توجد عيادات مسجلة' });
        }

        // إعادة النتائج بصيغة JSON
        res.status(200).json({
            message: 'تم جلب العيادات بنجاح',
            clinics: results
        });
    });
};
