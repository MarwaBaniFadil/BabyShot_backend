const db = require('../config/dbconnection');


const showallclincName = (req,res) => {

db.query('SELECT * FROM clinics ', (err, clinics) => {
    if (err) {
        console.error('Error fetching clinics:', err);
        return res.status(500).send({ error: 'Internal server error' });
    }
        res.status(200).send({ clinics });
             
   });
}


const getclinirenByid=(req,res)=>{

const id = req.params.id;

db.query('SELECT name FROM clinics WHERE clinic_id=?',id,(err, users) => {
    if (err) {
        // console.error('Error fetching users:', err);
        return res.status(500).send({ error: 'Internal server error' });
    }
    
if (users==""){ res.status(500).send({ error: "no any clinic to this  clinic id  ! " });}
else          res.status(200).send({ users });
   
       
    
});

};

const getClinicIdByName = (req, res) => {
    const clinicName = req.params.name; // اسم العيادة من الرابط
    
    const query = 'SELECT clinic_id FROM clinics WHERE name = ?'; // استعلام SQL
    db.query(query, [clinicName], (error, results) => {
      if (error) {
        console.error('Error fetching clinic ID:', error);
        return res.status(500).json({ error: 'Database error' });
      }
  
      if (results.length === 0) {
        return res.status(404).json({ message: 'Clinic not found' });
      }
  
      res.json({ clinic_id: results[0].clinic_id }); // إرسال الـ ID كاستجابة
    });
  };



module.exports = {
showallclincName,
getclinirenByid,
getClinicIdByName
};



