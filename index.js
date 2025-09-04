const fs = require("fs")
const url = require('url')


const http = require('http').createServer((req, res) => {

    //Server Handling
    if (req.url == "/join") {
        fs.readFile("./open.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        })
    }

    else if (req.path == "/room") {
        let response;
        db.read(room,true).then(cont =>{ response = cont
        const room = url.parse(req.url, true).query["room"]
        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end(response, 'utf-8');
        }
    )
    }

    else {
        fs.readFile("./index.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        })
    }
})


const topics = require("./JS/dat.js")
const db = require("./JS/db.js");

const array_sort = (array) => { return array.slice().sort(() => 0.5 - Math.random()) }


const io = require('socket.io')(http, { cors: { origin: "*" } });


let sockets = {}
let messages = {}

//Socketio initiation
io.on("connection", socket => {

    sockets[socket.id] = socket
    let room, name, colour;

    //Event initiation
    socket.on("join", async data => {
        room = data.room
        name = data.name
        colour = data.colour

        let res = await db.read(room).catch(() => false)

        //If room is empty make the player a host else make him a normal player
        if (res.length == 0) {
            socket.emit('host');
            db.create_room(room);
            console.log("Host Maken");
        }

        sockets[socket.id] = socket
        db.insert(socket.id, 0, name, [], room, colour)
        res = await db.read(room).catch(() => false)
        let members = []
        db.read(room).then(cont => cont.forEach(e => { members.push({ id: e.sid, name: e.name, colour: e.colour }) }))

        db.read(room).then(cont => cont.forEach(e => { sockets[e.sid].emit("members", members) }))



    })

    //Real time topic updates
    socket.on("topic", str => { db.read(room).then(cont => cont.forEach(e => { sockets[e.sid].emit("topic", str) })) })

    //Start of game
    socket.on("start", async (topic) => {
        db
        let content = await db.read(room).catch(() => false)
        if (content.length >= 3) {
            let odds = content[Math.floor(Math.random() * content.length)]
            db.edit(odds.sid, 1, room)
            let words = array_sort(topics[topic])
            //make impostor
            content.forEach(e => {
                try {
                    if (e == odds) {
                        sockets[e.sid].emit("word", words[0])

                    } else {
                        sockets[e.sid].emit("word", words[1])
                    }
                    sockets[e.sid].emit("time", 60 * content.length)
                    messages[room] = 0;
                    //socket.emit("chance")
                } catch (error) {
                }

            })

            //Game End
            setTimeout(() => {
                content.forEach(e => {
                    sockets[e.sid].emit("end")
                })
            }, 60000 * content.length)

            //Vote End
            setTimeout(() => {
                content.forEach(async e => {
                    let votes = {}
                    db.read(room).then(players => players.forEach(e => { votes[e.sid] = e.votes.length }))
                    let imp = await db.impostor(room)
                    sockets[e.sid].emit("votes", votes, imp)
                    console.log(votes,imp);
                    db.delete_room(room)
                    
                })
            }, 60000 * content.length + 60000)
        } else {

            socket.emit("error", 1)
        }
    })

    /*socket.on("chance", () => {
        messages[room]++;
        let content;
        db.read(room).then(c=>content=c)
        content[messages[room] % content.length].emit("chance")
    })*/


    //Message and DM handling
    socket.on("msg", data => {
        db.read(room).then(c => c.forEach(e => { sockets[e.sid].emit("msg", data) }))
    })
    socket.on("dm", d => {
        d.users.forEach(element => {
            sockets[element].emit("msg", d.msg)
        })
    })

    //vote handling
    socket.on("vote", id => {
        console.log(id, socket.id, room)
        db.vote(id, socket.id, room)//votes[room][id]++ 
    })

    //Disconnection handler
    socket.on("disconnect", () => {

        db.delete(socket.id, room);
        delete sockets[socket.id]

        let members = []
        db.read(room).then(cont => cont.forEach(e => { members.push({ id: e.sid, name: e.name }) }))

        db.read(room).then(c => c.forEach(e => { sockets[e.sid].emit("members", members) }))
        console.log(socket.id, " Left ", room)
        db.read(room).then(cont => console.log(cont))
    })
})

//Common You know this shit
http.listen(8080, "0.0.0.0")