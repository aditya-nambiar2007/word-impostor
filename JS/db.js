const db = require("mongodb").MongoClient

const mod = {
    create_room: (room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.createCollection(room)
        })
    },
    insert: (sid, odd_one, name, room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.collection(room).insertOne({ sid: sid, odd_one: odd_one, name: name })
        })
    },

    delete: (sid, room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.deleteOne({ sid: sid, room: room })
        })
    },

    delete_room: (room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.dropCollection(room)
        })
    },

    edit: (sid, v, room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.collection(room).updateOne({ sid: sid }, { $set: { odd_one: v } })
        })
    },

    read: (room) => {
        let result=0;
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.collection(room).find({}).toArray((err, res) => {
                result = res;
            });

        })
        return result;
    }
}

module.exports = mod