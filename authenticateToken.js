const jwt = require('jsonwebtoken');
const JWT_SECRET_KEY = 'my-super-strong-secret'; 
const db = require('../config/dbconnection');
var islog;

const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            // console.log(err)
            return res.status(403).json({ message: 'Forbidden. Invalid token.' });
        }

        const sql = 'SELECT token FROM users WHERE token = ? ';
        db.query(sql, [token] ,(error, results) => {
            if (error) {
                console.error(error);
                return res.status(500).json({ error: 'An error occurred while verifying token.' });
            }

            if (results.length === 0) {
                return res.status(403).json({ message: 'You are logged out, please login again' });
            }

            req.user = decoded;
            next();
        });
    });
};









module.exports = { authenticateJWT, JWT_SECRET_KEY };