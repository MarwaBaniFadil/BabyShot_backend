const db = require('../config/dbconnection');

const showAllemails = (req, res) => {
    db.query('SELECT email FROM registrations', (err, email) => {
        if (err) {
            console.error('Error fetching email:', err);
            return res.status(500).send({ error: 'Internal server error' });
        }
        res.status(200).send({ email });
    });
};
module.exports = {
    showAllemails,
};
