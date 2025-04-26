const { DATABASE, DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD } = process.env;
var mysql = require("mysql");

function createConnection() {
    return mysql.createConnection({
        connectionLimit: 10,  // الحد الأقصى لعدد الإتصالات المفتوحة في نفس الوقت
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        port: process.env.MYSQL_PORT
    });
}

var conn = createConnection();

function handleDisconnect() {
    conn.connect((error) => {
        if (error) {
            console.error("Database connection failed: ", error.stack);
            process.kill(process.pid, 'SIGINT');
            setTimeout(handleDisconnect, 2000); // محاولة إعادة الاتصال بعد 2 ثانية
        } else {
            console.log("Database Connection successful...");
        }
    });

    conn.on("error", function (err) {
        console.error("Database error: ", err);
        if (err.code) {
            // إعادة الاتصال عند فقدان الاتصال
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect(); // محاولة الاتصال الأولية

module.exports = conn;