// استرجاع تفاصيل طفل بناءً على child_id

const db = require('../config/dbconnection');


const showdoctornameByid = (req, res) => {
    const id = req.params.id;

    db.query('SELECT name FROM doctors WHERE doctor_id = ?', [id], (err, users) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }
        if (users.length === 0) {
            return res.status(404).send({ error: 'No doctor found for this ID!' });
        }
        res.status(200).send({ users });
    });
};


const showclinicnameByid = (req, res) => {
    const id = req.params.id;

    db.query('SELECT name FROM clinics WHERE clinic_id = ?', [id], (err, users) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }
        if (users.length === 0) {
            return res.status(404).send({ error: 'No clinic found for this ID!' });
        }
        res.status(200).send({ users });
    });
};


const showAlltestToChildrenById = (req, res) => {
    const id = req.params.id;

    db.query('SELECT * FROM tests WHERE child_id = ?', [id], (err, users) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }
        if (users.length === 0) {
            return res.status(200).send({ error: 'No child found for this ID!' });
        }
        res.status(200).send({ users });
    });
};




module.exports = {
   
    showAlltestToChildrenById,
    showdoctornameByid,
    showclinicnameByid,
  
  };
  