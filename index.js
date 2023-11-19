const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());


const verifyToken = (req, res, next) => {
   
  if(req.query.date){
    next();
  } 
  else{
    const token = req?.cookies?.token;
 
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'unauthorized access' })
        }
        req.user = decoded;
        next();
    })
  }
  
}


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
    
    //food
    app.get('/food',verifyToken, async (req, res) => {
        let nameQuery = {};
        let sortQuery = {date:1};
        if(req.query.date){             
          if (req.query?.foodName) {           
              nameQuery = { foodName : req.query.foodName }; 
          }
         
          if (req.query?.date) {
              sortQuery = { date: parseInt(req.query.date) }; 
          } 
        }
        
        else{
          if (req.user?.email !== req.query.donorEmail) {
            return res.status(403).send({ message: 'forbidden access' })
          }        
          if (req.query?.donorEmail) {
              query = { donorEmail: req.query.email }
          }
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
    app.delete('/food/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodCollection.deleteOne(query);
      res.send(result);
    })
    app.patch('/food/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedStatus = req.body;
      const updateDoc = {
          $set: {
              status: updatedStatus.status
          },
      };
      const result = await foodCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    //request food
    app.delete('/requestfood/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    })
    app.post('/requestfood', async (req, res) => {
        const requestFood = req.body;
        const result = await requestCollection.insertOne(requestFood);
        res.send(result);
    })
   
    app.get('/requestfood', verifyToken, async (req, res) => {        
        let query = {};
        if (req.user?.email !== req.query.reqEmail) {
          return res.status(403).send({ message: 'forbidden access' })
        }       
        if (req.query?.reqEmail) {           
            query = { reqEmail : req.query.reqEmail }; 
        }
        const result = await requestCollection.find(query).sort({date:1}).toArray();
        res.send(result);
    });

    app.patch('/requestfood/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedStatus = req.body;
      const updateDoc = {
          $set: {
              status: updatedStatus.status
          },
      };
      const result = await requestCollection.updateOne(filter, updateDoc);
      res.send(result);
    })


    
    //webtoken

    app.post('/jwt', async ( req, res) => {
      const user = req.body; 
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET , {expiresIn: '1h'});
        res.cookie('token', token, {
                httpOnly: true,
                secure: false,
                sameSite: 'strict'
            })
                .send(token);
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