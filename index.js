require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
require('./config/dbconnection');  // اتصال قاعدة البيانات

// استيراد دالة الإشعارات
const notificationScheduler = require('./controllers/notifications');  // تغيير المسار حسب المكان الذي وضعت فيه الكود
const newAppoimtmentNotification = require('./controllers/newAppoimtmentNotification');  // تغيير المسار حسب المكان الذي وضعت فيه الكود


const app = express();
app.use(express.json()); // Parse JSON bodies

const PORT = 8888;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

const userRoute = require('./routes/userRoute');
app.use('/APIS', userRoute);

// تشغيل وظيفة الإشعارات عند بدء السيرفر
const db = require('./config/dbconnection');  // إذا كان لديك ملف لإعداد الاتصال بقاعدة البيانات
notificationScheduler(db);  // تمرير الاتصال بقاعدة البيانات لدالة الإشعارات
newAppoimtmentNotification(db);
app.use((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.message = err.message || "Internal Index Error";
    res.status(err.statusCode).json({
        message: err.message,
    });
});

app.listen(PORT, () => {
    console.log(`Server started on Port ${PORT}`);
});
