const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors())
app.use(express.json());
require("dotenv").config();
var jwt = require('jsonwebtoken');


app.get('/', (req, res) => {
    res.send("running")
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bbqqyyb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res,next){
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if(!authHeader){
        return res.status(401).send({message: "Unauthorizes access"})
    }
    const token = authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
      
        if(err){
            return res.status(403).send({message: "Forbidden Access"})
        }
        req.decoded = decoded;
        next()
      });
}

async function run() {
    try {
        const serviceCollection = client.db("genius-car").collection("services");
        const ordersCollection = client.db("genius-car").collection("orders");
        app.get("/services", async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" });
            res.send({ token })
        })

        app.get("/services/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const service = await serviceCollection.findOne(query);
            res.send(service)
        })
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result)
        })
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })
        app.patch('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const status = req.body.status;
            const updatedDoc = {
                $set: {
                    status: status
                }
            }
            const result = await ordersCollection.updateOne(query, updatedDoc);
            res.send(result);
        })
        app.get('/orders',verifyJWT, async (req, res) => {
            const decoded = req.decoded;
            if(decoded.email !== req.query.email){
              return  res.status(403).send({message: "unauthorized access"})
            }
            console.log(req.headers.authorization);
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = ordersCollection.find(query);
            const result = await cursor.toArray()
            res.send(result)
        })
    } finally {

    }
}
run().catch(error => console.log(error));

app.listen(port, () => {
    console.log("running")
})
