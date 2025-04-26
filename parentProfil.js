const db = require('../config/dbconnection');

// استرجاع بيانات المستخدم بناءً على الـ ID
const getUserProfile = (userId, callback) => {
    const query = `
      SELECT momId, name, birthDate, bloodType, address, contactNumber
      FROM registrations
      WHERE id = ?;
    `;
  
    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return callback(err, null);
      }
  
      if (results.length === 0) {
        return callback(null, 'User not found');
      }
  
      // إرجاع البيانات في حالة النجاح
      callback(null, results[0]);
    });
  };
  // دالة لتحديث رقم الهاتف
const updateContactNumber = (userId, newContactNumber, callback) => {
    const query = `
      UPDATE registrations
      SET contactNumber = ?
      WHERE id = ?;
    `;
  
    db.query(query, [newContactNumber, userId], (err, results) => {
      if (err) {
        console.error('Error updating contact number:', err);
        return callback(err, null);
      }
  
      // إذا لم يتم العثور على المستخدم أو لم يتم التحديث
      if (results.affectedRows === 0) {
        return callback(null, 'User not found');
      }
  
      // إذا تم التحديث بنجاح
      callback(null, 'Contact number updated successfully');
    });
  };
  
  const updateAddress = (userId, newAddress, callback) => {
    const query = `
      UPDATE registrations
      SET address = ?
      WHERE id = ?;
    `;
  
    db.query(query, [newAddress, userId], (err, results) => {
      if (err) {
        console.error('Error updating address:', err);
        return callback(err, null);
      }
  
      // إذا لم يتم العثور على المستخدم أو لم يتم التحديث
      if (results.affectedRows === 0) {
        return callback(null, 'User not found');
      }
  
      // إذا تم التحديث بنجاح
      callback(null, 'Address updated successfully');
    });
  };
  module.exports = { getUserProfile , updateContactNumber ,updateAddress};