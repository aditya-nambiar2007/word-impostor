const { MongoClient } = require("mongodb");
const url = 'mongodb://127.0.0.1:27017/';
const dbName = "clients";

async function getDb() {
    const client = new MongoClient(url);
    await client.connect();
    return client;
}

const mod = {
    create_room: async (room) => {
        const client = await getDb();
        const dbo = client.db(dbName);
        await dbo.createCollection(room);
        await client.close();
    },

    insert: async (sid, odd_one, name, room) => {
        const client = await getDb();
        const dbo = client.db(dbName);
        await dbo.collection(room).insertOne({ sid, odd_one, name });
        await client.close();
    },

    delete: async (sid, room) => {
        const client = await getDb();
        const dbo = client.db(dbName);
        await dbo.collection(room).deleteOne({ sid });
        await client.close();
    },

    delete_room: async (room) => {
        const client = await getDb();
        const dbo = client.db(dbName);
        await dbo.dropCollection(room);
        await client.close();
    },

    edit: async (sid, v, room) => {
        const client = await getDb();
        const dbo = client.db(dbName);
        await dbo.collection(room).updateOne({ sid }, { $set: { odd_one: v } });
        await client.close();
    },

    read: async (room) => {
        const client = await getDb();
        const dbo = client.db(dbName);
        const result = await dbo.collection(room).find({}).toArray();
        await client.close();
        return new Promise((resolve, reject) => {
            result ? resolve(result) : reject(false);
        });
    }
};

module.exports = mod;