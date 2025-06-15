0
const fs = require("fs")
const http = require('http').createServer((req, res) => {
    fs.readFile("./index.html", function (error, content) {
        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end(content, 'utf-8');
    })
})
const topics = require("./dat.js")

const array_sort = (array) => { return array.slice().sort(() => 0.5 - Math.random()) }
//topics


const io = require('socket.io')(http, { cors: { origin: "*" } });
let rooms = {}
let sockets = {}
let odds = {}
io.on("connection", socket => {
    //connection:
    sockets[socket.id] = socket
    let room, name;

    //join:
    socket.on("join", data => {
        room = data.room
        name = data.name
        socket.gameName = data.name
        if (!rooms[room]) { socket.emit('host') }
        rooms[room] = rooms[room] || [];
        rooms[room].push(socket)
        let members = []
        rooms[room].forEach(e => { members.push({ id: e.id, name: e.gameName }) });
        rooms[room].forEach(e => { e.emit("members", members) });
        
        console.log(socket.id, " Joined ", room);
        console.log(rooms[room])
    })

    //start
    socket.on("topic", str => { rooms[room].forEach(e => { e.emit("topic", str) }) })

    socket.on("start", (topic) => {
        odds[room] = rooms[room][Math.floor(Math.random() * rooms[room].length)]
        let words = array_sort(topics[topic])
        rooms[room].forEach(e => {
            if (e == odds[room]) {
                e.emit("word", words[0])
            } else {
                e.emit("word", words[1])
            }
        });

        setTimeout(rooms[room].forEach(e => { e.emit("end") }),360000)
    })


    //message
    socket.on("msg", data => {
        rooms[room].forEach(e => { e.emit("msg", data) });
    })

    //dms
    socket.on("dm", d => {
        d.users.forEach(element => {
            sockets[element].emit("msg", d.msg)
        });
    })

    //disconnection

    socket.on("disconnect", () => {
        if (rooms[room].indexOf(socket) > -1) {
            rooms[room].splice(rooms[room].indexOf(socket), 1);
        }
        if(rooms[room].length==0){delete rooms[room]}
        rooms[room].forEach(e => { e.emit("members", members) });
        delete sockets[socket.id]
        console.log(socket.id, " Left ", room);
        console.log(rooms[room]);
    })
})

http.listen(8080, "0.0.0.0")