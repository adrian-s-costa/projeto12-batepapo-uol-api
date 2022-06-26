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
            
            await dbUsers.insertOne({
                name: userName.name,
                lastStatus: Date.now()
            })

            await dbMessages.insertOne({
                from: userName.name,
                to: "Todos",
                text: "entra na sala...",
                type: "status",
                time: dayjs().format('HH:mm:ss')
            })
            
            const messages = await dbMessages.find().toArray();

            console.log(messages);

            const users = await dbUsers.find({
                name: userName.name
            }).toArray();
            
            console.log(users);

            res.sendStatus(201);

        }else{
            console.log("teste 409");
            res.sendStatus(409);
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
        
    }catch{
        res.sendStatus(500);
    }
})

app.post("/messages", async (req, res) => {

    const message = {
        from: req.headers.user,
        to: req.body.to,
        text: req.body.text,
        type: req.body.type,
        time: dayjs().format('HH:mm:ss')
    }

    const userSchema = joi.object({
        from: joi.string().required(),
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required(),
        time: joi.string().required()
    })

    const validation = userSchema.validate(message);

    if (validation.error) {
        console.log(validation.error.details);
    }

    try{
        
        const dbMessages = await dbM.collection("messages")

        if (!validation.error){

            await dbMessages.insertOne({
                from: message.from,
                to: message.to,
                text: message.text,
                type: message.type,
                time: message.time
            });

            res.sendStatus(201)

        }else{
            res.sendStatus(409)
        }
    }
    catch(error){
        console.log(error)
    }
})

app.get("/messages", async (req, res)=>{
    const limit = parseInt(req.query.limit);
    const user = req.headers.user;

    try {
        const dbMessages = await dbM.collection("messages")
        const messages = await dbMessages.find({}).sort({_id: -1}).limit(limit).toArray();

        const messagesFiltered = messages.filter((message)=>{
            if (message.to === user || message.from === user || message.type !== "private_message" ){
                return message;
            }
        })

        res.send(messagesFiltered.reverse())

    }catch{
        res.sendStatus(500);
    }

})

app.listen(5000);