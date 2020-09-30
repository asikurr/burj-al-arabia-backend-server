const express = require('express')
const admin = require('firebase-admin')
const app = express()
const port = 4000
const pass = 'oV7AYzO5B8merwcm'
const bodyParser = require('body-parser')
const cors = require('cors')
app.use(cors())
app.use(bodyParser.json())
require('dotenv').config()

const serviceAccount = require("./configs/burj-al-ara-firebase-adminsdk-px3nr-c8578be2c7.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xjikz.mongodb.net/burjAlArabDB?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const bookingCollection = client.db("burjAlArabDB").collection("bookings");

    app.post("/addBooking", (req, res) => {
        const booking = req.body
        bookingCollection.insertOne(booking)
            .then(result => {
                res.send(result.insertedCount > 0)
            })
            .catch(err => console.log(err))
    })

    app.get("/bookings", (req, res) => {
        const bearer = req.headers.authorization;

        if (bearer && bearer.startsWith("Bearer ")) {
            const token = bearer.split(" ")[1];
            //idToken comes from the client app
            admin.auth().verifyIdToken(token)
                .then(decodedToken => {
                    const tokenEmail = decodedToken.email;
                    const quaryEmail = req.query.email;
                    // console.log(tokenEmail, quaryEmail)
                    if (tokenEmail === quaryEmail) {
                        bookingCollection.find({ email: quaryEmail})
                        .toArray((err, documents) => {
                            res.status(200).send(documents)
                        })
                    } else {
                        res.status(401).send("un-Authorize Access.")
                    }
                }).catch(error => {
                    res.status(401).send("un-Authorize Access.")
                });
        }
        else {
            res.status(401).send("un-Authorize Access.")
        }
    })


    console.log("Database connection established.")
    //  client.close();
});



app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})