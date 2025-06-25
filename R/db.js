const db = require("mysql")

const con = db.createConnection({
    host: "localhost",
    user: "root",
    password: "xxxx",
    database: "word_impostor"
})

con.connect();

const mod = {
    db:con,
    create_room: (room) => { con.query(`CREATE Table ${room} (sid VARCHAR(255), odd-one BOOL , name VARCHAR(255) )`) },
    insert: (sid, v, name, room) => { con.query(`INSERT INTO ${room} (sid, odd-one , name) VALUES ('${sid}', ${v} , '${name}')`) },
    delete: (sid, room) => { con.query(`DELETE FROM ${room} WHERE sid = '${sid}'`) },
    edit: (sid, v, room) => { con.query(`UPDATE ${room} SET odd-one = ${v} WHERE sid = '${sid}'`) },
    read: (db) => {
        let result;
        con.query(`SELECT * FROM ${db}`, (err, res, fields) => {
            result = res
        })
        return res;
    }
}

module.exports = mod