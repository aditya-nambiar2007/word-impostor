const { MongoClient } = require("mongodb");
const url = 'mongodb://127.0.0.1:27017/';
const clientsDbName = "clients";
const roomsDbName = "rooms";

let client;
async function getClientsDb() {
    if (!client) {
        client = new MongoClient(url);
        await client.connect();
    }
    return client.db(clientsDbName);
}

let roomsClient;
async function getRoomsDb() {
    if (!roomsClient) {
        roomsClient = new MongoClient(url);
        await roomsClient.connect();
    }
    return roomsClient.db(roomsDbName);
}

const mod = {
    db: getClientsDb,

    create_room: async (room) => {
        // Create room in clients DB
        const clientsDb = await getClientsDb();
        await clientsDb.createCollection(room);

        // Create room in rooms DB
        const roomsDb = await getRoomsDb();
        await roomsDb.createCollection(room);
        await roomsDb.collection(room).insertOne({ start: false });
    },

    start: async (room) => {
        const roomsDb = await getRoomsDb();
        await roomsDb.collection(room).updateOne({ start: false }, { $set: { start: true } });
    },

    room_started: async (room) => {
        const roomsDb = await getRoomsDb();
        const res = !!(await roomsDb.collection(room).findOne({ start: true }));
        return res;
    },

    insert: async (sid, odd_one, name, votes, room, colour) => {
        const clientsDb = await getClientsDb();
        await clientsDb.collection(room).insertOne({ sid, odd_one, name, votes, colour });
    },

    delete: async (sid, room) => {
        const clientsDb = await getClientsDb();
        await clientsDb.collection(room).deleteOne({ sid });
    },

    delete_room: async (room) => {
        const clientsDb = await getClientsDb();
        await clientsDb.dropCollection(room);

        const roomsDb = await getRoomsDb();
        await roomsDb.dropCollection(room);
    },

    edit: async (sid, v, room) => {
        const clientsDb = await getClientsDb();
        await clientsDb.collection(room).updateOne({ sid }, { $set: { odd_one: v } });
    },

    read: async (room) => {
        const clientsDb = await getClientsDb();
        const result = await clientsDb.collection(room).find({}).toArray();
        return result;
    },

    vote: async (sid, user, room) => {
        const clientsDb = await getClientsDb();
        await clientsDb.collection(room).updateOne({ sid }, { $addToSet: { votes: user } });
    },

    impostor: async (room) => {
        const clientsDb = await getClientsDb();
        const result = await clientsDb.collection(room).find({ odd_one: 1 }).toArray();
        return result;
    }
};

module.exports = mod;