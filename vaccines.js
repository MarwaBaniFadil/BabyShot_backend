const db = require('../config/dbconnection');
const axios = require('axios');



    const showallvaccines = (req,res) => {

      db.query('SELECT * FROM vaccines ', (err, vaccines) => {
          if (err) {
              console.error('Error fetching vaccines:', err);
              return res.status(500).send({ error: 'Internal server error' });
          }
              res.status(200).send({ vaccines });
                   
         });
  }


  const showallvaccinesbyname=(req,res)=>{

    const id = req.params.id;

    db.query('SELECT * FROM vaccines WHERE name=?',id,(err, users) => {
        if (err) {
            // console.error('Error fetching users:', err);
            return res.status(500).send({ error: 'Internal server error' });
        }
        
if (users==""){ res.status(500).send({ error: "no any child to this  child id  ! " });}
  else          res.status(200).send({ users });
       
           
        
    });

};
const vaccineschild = (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM vaccineschild WHERE id_child=?', id, (err, users) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }

        if (!users || users.length === 0) { 
            return res.status(200).send({ message: "No vaccination records found for this child ID." });
        }

        return res.status(200).send({ users });
    });
};



const getVaccinationStats = async () => {
  return new Promise((resolve, reject) => {
      // 1. الحصول على العدد الكلي للأطفال
      const childrenQuery = 'SELECT COUNT(*) AS totalChildren FROM children';
      db.query(childrenQuery, async (err, result) => {
          if (err) return reject(err);
          const totalChildren = result[0].totalChildren;

          // 2. الحصول على بيانات الأطفال
          const childrenIdsQuery = 'SELECT child_id FROM children';
          db.query(childrenIdsQuery, async (err, children) => {
              if (err) return reject(err);

              // إعداد متغيرات الإحصائيات
              const vaccinationStats = {
                  totalChildren,
                  months: {
                      month0: 0,
                      month1: 0,
                      month2: 0,
                      month4: 0,
                      month6: 0,
                      month12: 0,
                      month18: 0,
                      year6: 0,
                      year15: 0
                  }
              };

              // Loop على كل طفل للحصول على بياناته من API
              for (const child of children) {
                  const childId = child.child_id;

                  try {
                      const response = await axios.get(`http://localhost:8888/APIS/vaccineschild/${childId}`);
                      const vaccineData = response.data.users[0];
                      console.log(`Data for child ID ${childId}:`, vaccineData); // طباعة البيانات للتحقق

                      // تحديث الإحصائيات بناءً على البيانات
                      for (const month in vaccinationStats.months) {
                          if (vaccineData[month] === 1) {
                              vaccinationStats.months[month]++;
                          }
                      }
                  } catch (error) {
                      console.error(`Error fetching data for child ID ${childId}:`, error.message);
                  }
              }

              // 3. إرجاع النتائج
              resolve(vaccinationStats);
          });
      });
  });
};



module.exports = {
  showallvaccines,
  vaccineschild,
  showallvaccinesbyname,
  getVaccinationStats
};



