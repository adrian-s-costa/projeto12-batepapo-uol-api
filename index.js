import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.URL_CONNECT_MONGO);
let db;

mongoClient.connect().then(() => {
	db = mongoClient.db("users");
})

app.get("/", async (req, res) => {
	
    try{
        await mongoClient.connect();
        const dbUsers = db.collection("users");
        const users = await dbUsers.find({}).toArray();
        
        res.send(users);
        mongoClient.close();
    }catch(error){
        res.status(500);
        mongoClient.close();
    }
    
});

app.listen(5000);