// Import the MongoDB client from the 'mongodb' package
const db = require("mongodb").MongoClient

// Module that provides functions to interact with the MongoDB database
const mod = {
    // Creates a new collection (room) in the 'clients' database
    create_room: (room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.createCollection(room)
        })
    },

    // Inserts a new document with sid, odd_one, and name into the specified room (collection)
    insert: (sid, odd_one, name, room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.collection(room).insertOne({ sid: sid, odd_one: odd_one, name: name })
        })
    },

    // Deletes a document by sid and room from the 'clients' database
    delete: (sid, room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.deleteOne({ sid: sid, room: room })
        })
    },

    // Drops (deletes) the entire room (collection) from the 'clients' database
    delete_room: (room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.dropCollection(room)
        })
    },

    // Updates the 'odd_one' field of a document identified by sid in the specified room
    edit: (sid, v, room) => {
        db.connect('mongodb://localhost:27017/', (err, db) => {
            dbo = db.db("clients")
            dbo.collection(room).updateOne({ sid: sid }, { $set: { odd_one: v } })
        })
    },

    // Reads all documents from the specified room (collection)
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

// Export the module so it can be used in other parts of the application
module.exports = mod
