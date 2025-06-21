// Import required modules
const fs = require("fs")
const url = require('url')

// Create an HTTP server
const http = require('http').createServer((req, res) => {
    // Handle request to join a room
    if (req.url == "/join") {
        fs.readFile("./open.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        })
    }
    // Handle request to check if a room is available
    else if (req.path == "/room") {
        let response;
        try {
            response = rooms[room][-1] != "going"
        } catch (error) {
            response = true
        }
        const room = url.parse(req.url, true).query["room"]
        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end(response, 'utf-8');
    }
    // Serve the main index.html for all other requests
    else {
        fs.readFile("./index.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        })
    }
})

// Import topics from external file
const topics = require("./dat.js")

// Function to shuffle an array
const array_sort = (array) => { return array.slice().sort(() => 0.5 - Math.random()) }

// Set up Socket.io for real-time communication
const io = require('socket.io')(http, { cors: { origin: "*" } });

// In-memory storage for rooms, sockets, and odd player assignment
let rooms = {}
let sockets = {}
let odds = {}
let votes = {}
let messages={}
io.on("connection", socket => {
    // Store connected socket
    sockets[socket.id] = socket
    let room, name;

    // Handle join event: add player to a room
    socket.on("join", data => {
        room = data.room
        name = data.name
        socket.gameName = data.name
        if (!rooms[room]) { socket.emit('host') } // Notify if user is host (first in room)
        rooms[room] = rooms[room] || []
        rooms[room].push(socket)
        // Build a list of members in the room
        let members = []
        rooms[room].forEach(e => { members.push({ id: e.id, name: e.gameName }) })
        // Notify all members of the updated member list
        rooms[room].forEach(e => { e.emit("members", members) })

    })

    // Broadcast topic selection to all members in the room
    socket.on("topic", str => { rooms[room].forEach(e => { e.emit("topic", str) }) })

    // Handle game start event
    socket.on("start", (topic) => {
        if (rooms[room].length > 3) { // Minimum players required
            //rooms[room].push("going") 
            // Mark the room as in-game
            // Randomly select one player as the "impostor" (odd one out)
            odds[room] = rooms[room][Math.floor(Math.random() * rooms[room].length)]
            // Shuffle topic words
            let words = array_sort(topics[topic])
            // Assign words and timer to each player
            rooms[room].forEach(e => {
                try {
                    if (e == odds[room]) {
                        e.emit("word", words[0])
                    } else {
                        e.emit("word", words[1])
                    }
                    e.emit("time", 60 * rooms[room].length)
                    messages[room]=0;
                    socket.emit("chance")
                } catch (error) {
                }

            })
            // End the game after a set time
            setTimeout(rooms[room].forEach, 60000 * rooms[room].length, e => { e.emit("end"); votes[room][e.id] = 0 })
            setTimeout(rooms[room].forEach, 60000 * rooms[room].length + 60000, e => { e.emit("votes", votes[room]) })
        } else {
            // Not enough players to start
            socket.emit("error", 1)
        }
    })
    //Chance handling
    socket.on("chance" ,()=>{
        messages[room]++;
        rooms[room][messages[room]%rooms[room].length].emit("chance")
    })

    // Broadcast chat messages to all members in the room
    socket.on("msg", data => {
        rooms[room].forEach(e => { e.emit("msg", data) })
    })

    // Direct messages to selected users
    socket.on("dm", d => {
        d.users.forEach(element => {
            sockets[element].emit("msg", d.msg)
        })
    })

    //Handle votes
    socket.on("vote", id => { votes[room][id]++ })

    // Handle user disconnect
    socket.on("disconnect", () => {
        // Remove the socket from the room
        if (rooms[room].indexOf(socket) > -1) {
            rooms[room].splice(rooms[room].indexOf(socket), 1)
        }
        // Delete the room if empty
        if (rooms[room].length == 0) { delete rooms[room] }
        // Notify remaining members of the updated member list
        rooms[room].forEach(e => { e.emit("members", members) })
        delete sockets[socket.id]
        console.log(socket.id, " Left ", room)
        console.log(rooms[room])
    })
})

// Start listening on port 8080
http.listen(8080, "0.0.0.0")