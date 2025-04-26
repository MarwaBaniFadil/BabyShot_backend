const db = require('../config/dbconnection'); 
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken');

// Function to validate email format
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Function to validate ID and contact number lengths
const isValidId = (id) => /^\d{9}$/.test(id);
const isValidContactNumber = (number) => /^\d{10}$/.test(number);

// Function to register a new user
exports.register = async (req, res) => {
    const {
        momId,
        name,
        email,
        password,
        birthDate,
        bloodType,
        childrenCount,
        husbandName,
        husbandId,
        address,
        contactNumber
    } = req.body;

    // Validate email format
    if (!validateEmail(email)) {
        return res.status(400).json({ message: 'تنسيق البريد الإلكتروني غير صالح' });
    }

    // Validate ID and contact number lengths
    if (!isValidId(momId)) {
        return res.status(400).json({ message: 'رقم هوية الأم غير صالح!' });
    }
    if (!isValidId(husbandId)) {
        return res.status(400).json({ message: 'رقم هوية الأب غير صالح!' });
    }
    if (!isValidContactNumber(contactNumber)) {
        return res.status(400).json({ message: 'رقم الهاتف غير صالح!' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // SQL query to check for existing email
        const checkEmail_sql = `SELECT * FROM users WHERE email = ?`;
        db.query(checkEmail_sql, [email], (error, results) => {
            if (error) {
                console.error('Error checking email:', error);
                return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
            }

            if (results.length > 0) {
                // Email already exists
                return res.status(400).json({ message: 'البريد الإلكتروني موجود بالفعل' });
            }

            // SQL query to insert the registration data
            const register_sql = `
                INSERT INTO registrations (momId, name, email, password, birthDate, bloodType, childrenCount, husbandName, husbandId, address, contactNumber) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            // Execute the SQL query for registration
            db.query(register_sql, [momId, name, email, hashedPassword, birthDate, bloodType, childrenCount, husbandName, husbandId, address, contactNumber], (error, results) => {
                if (error) {
                    console.error('Error inserting registration data:', error);
                    return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
                }

                // Insert the user data into the users table
                const user_sql = `
                    INSERT INTO users (email, password_hash, role) 
                    VALUES (?, ?, ?)`;

                // Execute the SQL query for the user
                db.query(user_sql, [email, hashedPassword, 'parent'], (error, userResults) => {
                    if (error) {
                        console.error('Error inserting user data:', error);
                        return res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
                    }

                    // Generate a JWT token
                    const token = jwt.sign({ id: userResults.insertId, momId, email }, process.env.JWT_SECRET, { expiresIn: '1h' });

                    // Respond with success message, user ID, and JWT token
                    res.status(201).json({ message: 'تم التسجيل بنجاح! ، الان يمكنك تسجيل الدخول ', id: userResults.insertId, token });
                });
            });
        });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'خطأ في الخادم الداخلي' });
    }
};
