const fs = require("fs");
const url = require("url");
const http = require("http").createServer((req, res) => {
  if (req.url == "/join") {
    fs.readFile("./open.html", function (error, content) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content, "utf-8");
    });
  } else if (req.path == "/room") {
    let response;
    try {
      response = rooms[room][-1] != "going";
    } catch (error) {
      response = true;
    }

    const room = url.parse(req.url, true).query["room"];
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(response, "utf-8");
  } else {
    fs.readFile("./index.html", function (error, content) {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(content, "utf-8");
    });
  }
});
const topics = require("./dat.js");

const array_sort = (array) => {
  return array.slice().sort(() => 0.5 - Math.random());
};
//topics

const io = require("socket.io")(http, { cors: { origin: "*" } });
let rooms = {};
let sockets = {};
let odds = {};
let i=0;

io.on("connection", (socket) => {
  //connection:
  sockets[socket.id] = socket;
  let room, name;

  //join:
  socket.on("join", (data) => {
    room = data.room;
    name = data.name;
    socket.gameName = data.name;
    if (!rooms[room]) {
      socket.emit("host");
    }
    rooms[room] = rooms[room] || [];
    rooms[room].push(socket);
    let members = [];

    rooms[room].forEach((e) => {
      members.push({ id: e.id, name: e.gameName });
    });
    rooms[room].forEach((e) => {
      e.emit("members", members);
    });

    
  });

  //start
  socket.on("topic", (str) => {
    rooms[room].forEach((e) => {
      e.emit("topic", str);
    });
  });

  socket.on("start", (topic) => {
    if (rooms[room].length > 4) {
      rooms[room].push("going");
      odds[room] = rooms[room][Math.floor(Math.random() * rooms[room].length)];
      let words = array_sort(topics[topic]);
      rooms[room].forEach((e) => {
        if (e != "going") {
          if (e == odds[room]) {
            e.emit("word", words[0]);
            e.emit("time", 60 * rooms[room].length);
          } else {
            e.emit("word", words[1]);
            e.emit("time", 60 * rooms[room].length);
          }
        }
      });
      rooms[room].forEach(async (e,index) => {
        socket.emit("perm", () => {
          i=index;
          
        });
        await setTimeout(() => {}, 2000);
      });

      setTimeout(rooms[room].forEach, 60000 * rooms[room].length, (e) => {
        e.emit("end");
      });
    } else {
      socket.emit("error", 1);
    }
  });

  //message
  socket.on("msg", (data) => {
    
    if (socket == rooms[room][i]) {
      rooms[room].forEach((e) => {
        if (e != "going") {
          e.emit("msg", data);
        }
      });
    } else {
      console.log("Not allowed but sent!");
    }
  });

  //dms
  socket.on("dm", (d) => {
    d.users.forEach((element) => {
      sockets[element].emit("msg", d.msg);
    });
  });

  //disconnection

  socket.on("disconnect", () => {
    if (rooms[room]) {
      if (rooms[room].indexOf(socket) > -1) {
        rooms[room].splice(rooms[room].indexOf(socket), 1);
      }
      if (rooms[room].length == 0) {
        delete rooms[room];
      }
      rooms[room].forEach((e) => {
        // e.emit("members", members);
        // members is not defined here idk what you tryna do
      });
      delete sockets[socket.id];
     
    }
  });
});

http.listen(8080, "0.0.0.0");
