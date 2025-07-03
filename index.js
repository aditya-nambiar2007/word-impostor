// Import required modules
const fs = require("fs");
const url = require('url');

// Create an HTTP server
const http = require('http').createServer((req, res) => {

    // Serve open.html when user joins a room
    if (req.url == "/join") {
        fs.readFile("./open.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        });
    }

    /*
    // (Commented out code for handling room status)
    else if (req.path == "/room") {
        let response;
        try {
            response = db.read(room)[-1] != "going";
        } catch (error) {
            response = true;
        }
        const room = url.parse(req.url, true).query["room"];
        res.writeHead(200, { 'Content-Type': "text/html" });
        res.end(response, 'utf-8');
    }
    */

    // Serve index.html for all other routes
    else {
        fs.readFile("./index.html", function (error, content) {
            res.writeHead(200, { 'Content-Type': "text/html" });
            res.end(content, 'utf-8');
        });
    }
});

// Import game topics and database utility modules
const topics = require("./JS/dat.js");
const db = require("./JS/db.js");

// Helper function to randomly shuffle an array
const array_sort = (array) => { return array.slice().sort(() => 0.5 - Math.random()) };

// Setup socket.io for real-time communication
const io = require('socket.io')(http, { cors: { origin: "*" } });

// State objects for sockets, impostor odds, votes, and chat messages
let sockets = {};
let odds = {};
let votes = {};
let messages = {};

// Handle socket connections
io.on("connection", socket => {

    sockets[socket.id] = socket;
    let room, name;

    // Event: User joins a room
    socket.on("join", data => {
        room = data.room;
        name = data.name;

        let res = db.read(room);
        if (!res) {
            // If room does not exist, user becomes host and creates room
            socket.emit('host');
            db.create_room(room);
            db.insert(socket.id, 0, name, room);
        } else {
            // If room exists, add user to room and notify all members
            sockets[socket.id] = socket;
            db.insert(socket.id, 0, name, room);
            let members = [];
            db.read(room).forEach(e => { members.push({ id: e.sid, name: e.name }); });
            db.read(room).forEach(e => { sockets[e.sid].emit("members", members); });
        }
    });

    // Event: Broadcast topic to all room members
    socket.on("topic", str => { db.read(room).forEach(e => { sockets[e.sid].emit("topic", str); }); });

    // Event: Start the game
    socket.on("start", (topic) => {
        if (db.read(room).length > 3) {
            // Randomly select impostor and assign words
            odds[room] = db.read(room)[Math.floor(Math.random() * db.read(room).length)];
            let words = array_sort(topics[topic]);

            db.read(room).forEach(e => {
                try {
                    if (e == odds[room]) {
                        // Impostor gets a different word
                        sockets[e.sid].emit("word", words[0]);
                    } else {
                        // Others get the main word
                        sockets[e.sid].emit("word", words[1]);
                    }
                    sockets[e.sid].emit("time", 60 * db.read(room).length); // Set round time
                    messages[room] = 0;
                    socket.emit("chance");
                } catch (error) {
                    // Handle any errors (e.g., socket disconnects)
                }
            });

            // Schedule end of round and voting phase
            setTimeout(db.read(room).forEach, 60000 * db.read(room).length, e => { sockets[e.sid].emit("end"); votes[room][e.id] = 0; });
            setTimeout(db.read(room).forEach, 60000 * db.read(room).length + 60000, e => { sockets[e.sid].emit("votes", votes[room], odds[room]); });
        } else {
            // Not enough players to start the game
            socket.emit("error", 1);
        }
    });

    // Event: Give speaking turn to next player
    socket.on("chance", () => {
        messages[room]++;
        db.read(room)[messages[room] % db.read(room).length].emit("chance");
    });

    // Event: Broadcast chat message to all room members
    socket.on("msg", data => {
        db.read(room).forEach(e => { sockets[e.sid].emit("msg", data); });
    });

    // Event: Direct message (DM) to selected users
    socket.on("dm", d => {
        d.users.forEach(element => {
            sockets[element].emit("msg", d.msg);
        });
    });

    // Event: Vote for a player
    socket.on("vote", id => { votes[room][id]++; });

    // Event: Handle user disconnecting from server
    socket.on("disconnect", () => {
        db.delete(socket.id, room);
        db.read(room).forEach(e => { sockets[e.sid].emit("members", members); });
        delete sockets[socket.id];
        console.log(socket.id, " Left ", room);
        console.log(db.read(room));
    });
});

// Start the HTTP server on port 8080
http.listen(8080, "0.0.0.0");
