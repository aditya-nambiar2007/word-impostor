
const fs = require("fs")
const url = require('url')


const http = require('http').createServer((req, res) => {

    if (req.url == "/join") {
        fs.readFile("./open.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        })
    }

    /*else if (req.path == "/room") {
        let response;
        try {
            response = db.read(room)[-1] != "going"
        } catch (error) {
            response = true
        }
        const room = url.parse(req.url, true).query["room"]
        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end(response, 'utf-8');
    }*/

    else {
        fs.readFile("./index.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        })
    }
})


const topics = require("./JS/dat.js")
const db = require("./JS/db.js")

const array_sort = (array) => { return array.slice().sort(() => 0.5 - Math.random()) }


const io = require('socket.io')(http, { cors: { origin: "*" } });


let sockets = {}
let odds = {}
let votes = {}
let messages = {}
io.on("connection", socket => {

    sockets[socket.id] = socket
    let room, name;


    socket.on("join", data => {
        room = data.room
        name = data.name

        let res=db.read(room);
                if (!res) { socket.emit('host');db.create_room(room);db.insert(socket.id,0,name,room) }
                else {
                    sockets[socket.id] = socket
                    db.insert(socket.id, 0, name, room)

                    let members = []
                    db.read(room).forEach(e => { members.push({ id: e.sid, name: e.name }) })

                    db.read(room).forEach(e => { sockets[e.sid].emit("members", members) })

                    
                }
            
    })


    socket.on("topic", str => { db.read(room).forEach(e => { sockets[e.sid].emit("topic", str) }) })


    socket.on("start", (topic) => {
        if (db.read(room).length > 3) {
            odds[room] = db.read(room)[Math.floor(Math.random() * db.read(room).length)]

            let words = array_sort(topics[topic])

            db.read(room).forEach(e => {
                try {
                    if (e == odds[room]) {
                        sockets[e.sid].emit("word", words[0])
                    } else {
                        sockets[e.sid].emit("word", words[1])
                    }
                    sockets[e.sid].emit("time", 60 * db.read(room).length)
                    messages[room] = 0;
                    socket.emit("chance")
                } catch (error) {
                }

            })

            setTimeout(db.read(room).forEach, 60000 * db.read(room).length, e => { sockets[e.sid].emit("end"); votes[room][e.id] = 0 })
            setTimeout(db.read(room).forEach, 60000 * db.read(room).length + 60000, e => { sockets[e.sid].emit("votes", votes[room], odds[room]) })
        } else {

            socket.emit("error", 1)
        }
    })

    socket.on("chance", () => {
        messages[room]++;
        db.read(room)[messages[room] % db.read(room).length].emit("chance")
    })


    socket.on("msg", data => {
        db.read(room).forEach(e => { sockets[e.sid].emit("msg", data) })
    })


    socket.on("dm", d => {
        d.users.forEach(element => {
            sockets[element].emit("msg", d.msg)
        })
    })


    socket.on("vote", id => { votes[room][id]++ })


    socket.on("disconnect", () => {

        db.delete(socket.id, room);

        db.read(room).forEach(e => { sockets[e.sid].emit("members", members) })
        delete sockets[socket.id]
        console.log(socket.id, " Left ", room)
        console.log(db.read(room))
    })
})


http.listen(8080, "0.0.0.0")
