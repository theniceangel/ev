const mysql = require('mysql')

let connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mysql'
})

connection.query('show tables', function(error, results, fields){
    if(error) throw error;
    console.log(fields);
    console.log(results);
})
connection.end();
