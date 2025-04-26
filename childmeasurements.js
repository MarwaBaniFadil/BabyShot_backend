const db = require('../config/dbconnection');

const getmeasurementsChildrenById = (req, res) => {
    const id = req.params.id;

    db.query('SELECT DISTINCT Birth_Year, Birth_month FROM childmeasurements WHERE child_id = ?', [id], (err, child) => {
        if (err) {
            return res.status(500).send({ error: 'Internal server error' });
        }

        if (child.length === 0) {
            return res.status(500).send({ error: "No measurements found for this child ID!" });
        }

        res.status(200).send({ child });
    });
};













const weightHight=(req,res)=>{

    const id = req.params.id;

    db.query('SELECT height,weight,Childs_age_in_months_at_the_time_of_measurement,head_circumference FROM childmeasurements WHERE child_id=?',id,(err, child) => {
        if (err) {
            // console.error('Error fetching users:', err);
            return res.status(500).send({ error: 'Internal server error' });
        }
        
if (child==""){ res.status(500).send({ error: "no any measurement ! " });}
  else          res.status(200).send({ child });
       
           
        
    });

};



const ideal_child_data = (req,res) => {

    db.query('SELECT * FROM ideal_child_data ', (err, ideal_child_data) => {
        if (err) {
            console.error('Error fetching ideal_child_data:', err);
            return res.status(500).send({ error: 'Internal server error' });
        }
            res.status(200).send({ ideal_child_data });
                 
       });
}
const ideal_child_data_female = (req,res) => {

    db.query('SELECT * FROM ideal_child_data_famale', (err, ideal_child_data_famale) => {
        if (err) {
            console.error('Error fetching ideal_child_data:', err);
            return res.status(500).send({ error: 'Internal server error' });
        }
            res.status(200).send({ ideal_child_data_famale });
                 
       });
}

 


module.exports = {
    getmeasurementsChildrenById,
    weightHight,
    ideal_child_data,
    ideal_child_data_female,
};
