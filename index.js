const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
const fileUpload = require('express-fileupload');
const Pusher = require('pusher');
const mongoose = require('mongoose');
require('dotenv').config();


// From: pusher.com>'app'(whoahapp)>'Getting Started'>'index.js'
const pusher = new Pusher({
  appId: "1213615",
  key: "cbd3c980b7267266d8b0",
  secret: "2e239b004770eaa1278a",
  cluster: "ap2",
  useTLS: true
});


const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(express.static('services'));
app.use(fileUpload())

const port = 5000;

app.get('/', function (req, res) {
  res.send('hello world')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pjygh.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true })
const db = mongoose.connection;
const messagesCollection = db.collection("messagecontents");

// client.connect((err) => {

  db.once('open', () => {

  console.log('db connection successfully');
  // const messagesCollection = db.collection("messagecontents");
  const changeStream = messagesCollection.watch();

  changeStream.on('change', (change) => {//change hocche

    if (change.operationType === 'insert') {//change hobar type jodi 'insert' hoy
      const messageDetails = change.fullDocument;//ja ja change hoilo ta ache change.fullDocument a, seta ke rakha holo messageDetails a.

      pusher.trigger('messages', 'inserted',//ekhon pusher vaike daaki je esob joma koro real-time a.
        {
          message: messageDetails.message,
          name: messageDetails.name,
          email: messageDetails.email,
          timestamp: messageDetails.timestamp,
        });

    }
    else {
      console.log('Error triggering Pusher');
    }

  });//changeStream on
});//db.once('open')



  //getting the messages
  app.get("/storedmessages", (req, res) => {

    messagesCollection.find({}).toArray((err, documents) => {
      res.send(documents);
    });
  });



  //To add a service to the server
  app.post("/newmessage", (req, res) => {

    const message = req.body.message;
    const name = req.body.name;
    const email = req.body.email;
    const timestamp = req.body.timestamp;


    messagesCollection
      .insertOne({ message, name, email, timestamp })
      .then((result) => {
        res.send(result.insertedCount > 0);
      });
  });



// });//client.connect

app.listen(process.env.PORT || 5000)