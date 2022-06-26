import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import joi from "joi";
import dayjs from "dayjs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.URL_CONNECT_MONGO);
let db;
let dbM;

mongoClient.connect().then(() => {
	db = mongoClient.db("users");
    dbM = mongoClient.db("messages");
})

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
        const dbUsers = await db.collection("users");
        const dbMessages = await dbM.collection("messages")
        const users = await dbUsers.find({
            name: userName.name
        }).toArray();

        if (users.length === 0 && !validation.error){
            
            dbUsers.insertOne({
                name: userName.name,
                lastStatus: Date.now()
            })

            dbMessages.insertOne({
                from: userName.name,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: dayjs().format('HH:mm:ss')
            })
            
            const messages = await dbMessages.find().toArray();

            console.log(messages)

            const users = await dbUsers.find({
                name: userName.name
            }).toArray();
            
            console.log(users);

            res.status(201).send();

        }else{
            console.log("teste 409");
            res.status(409).send();
        }
    }
    catch(error){
        console.log(error)
    }
})

app.get("/participants", async (req, res)=>{
    try{
        const dbUsers = await db.collection("users");
        const users = await dbUsers.find({}).toArray();

        res.send(users);
        mongoClient.close();
    }catch{
        res.status(500).send();
        mongoClient.close();
    }
})

app.listen(5000);