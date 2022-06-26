import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from "joi";
import { abort } from 'process';

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

app.post("/participants", async (req, res) => {
    
    const userName = req.body;

    const userSchema = joi.object({
        name: joi.string().required()
    })

    const validation = userSchema.validate(userName);

    if (validation.error) {
        console.log(validation.error.details);
    }

    try{
        const dbUsers = db.collection("users");
        const users = await dbUsers.find({
            name: userName.name
        }).toArray();

        console.log(users.length)

        if (users.length === 0 && !validation.error){
            
            dbUsers.insertOne({
                name: userName.name,
                lastStatus: Date.now()
            })
            
            res.status(201).send();
            
            const users = await dbUsers.find({
                name: userName.name
            }).toArray();
            
            console.log(users);

        }else{
            console.log("teste 409");
            res.status(409).send();
        }
    }
    catch(error){
        console.log(error)
    }
})

app.listen(5000);