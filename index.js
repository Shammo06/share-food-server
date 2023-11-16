const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.1u0fohl.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const foodCollection = client.db('FoodDB').collection('food');
    const requestCollection = client.db('RequestDB').collection('food');

    app.get('/food', async (req, res) => {
        let nameQuery = {};
        let sortQuery = {};       
        if (req.query?.foodName) {           
            nameQuery = { foodName : req.query.foodName }; 
        }
        if (req.query?.donarEmail) {           
            nameQuery = { donarEmail : req.query.donarEmail }; 
        }
        if (req.query?.date) {
            sortQuery = { date: parseInt(req.query.date) }; 
        }                 
        const result = await foodCollection.find(nameQuery).sort(sortQuery).toArray();
        res.send(result);
    }); 
    app.get('/food/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) }
        const result = await foodCollection.findOne(query);
        res.send(result);
      })

    app.post('/food', async (req, res) => {
      const food = req.body;
      const result = await foodCollection.insertOne(food);
      res.send(result);
    })

    app.post('/requestfood', async (req, res) => {
        const requestFood = req.body;
        const result = await requestCollection.insertOne(requestFood);
        res.send(result);
    })
    app.get('/requestfood/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await requestCollection.findOne(query);
      res.send(result);
    })
    app.get('/requestfood', async (req, res) => {
        let emailQuery = {};      
        if (req.query?.reqEmail) {           
            emailQuery = { reqEmail : req.query.reqEmail }; 
        }
       const result = await requestCollection.find(emailQuery).sort({date:1}).toArray();
        res.send(result);
    });

    app.delete('/food/:id', async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await foodCollection.deleteOne(query);
        res.send(result);
    })

    



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req,res) =>{
    res.send('server is running')
})

app.listen(port,(res,req) => {
    console.log(`server is running at ${port}`)
})