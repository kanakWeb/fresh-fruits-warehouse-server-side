const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;

require("dotenv").config();
const {
  MongoClient,
  ServerApiVersion,
  ObjectId,
} = require("mongodb");
const app = express();

//middleware
app.use(cors());
app.use(express.json());


//Verify


function verifyJWT(req,res,next){
  const AuthHeader=req.headers.authorization
  console.log('inside verifyJWT',AuthHeader);
next()
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sfzcd.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const inventoryItemsCollection = client
      .db("FreshFruits")
      .collection("InventoryItems");

    //User Auth
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(
        user,
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1d",
        }
      );
      res.send({ accessToken });
    });

    //all items api
    app.get("/inventoryItem", async (req, res) => {
      const query = {};
      const cursor = inventoryItemsCollection.find(query);

      const InventoryItems = await cursor.toArray();
      res.send(InventoryItems);
    });

    app.get("/inventoryItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const inventoryItem = await inventoryItemsCollection.findOne(
        query
      );
      res.send(inventoryItem);
    });

    //post

    app.post("/inventoryItem", async (req, res) => {
      const addItem = req.body;
      const result = await inventoryItemsCollection.insertOne(
        addItem
      );
      res.send(result);
    });

    //delete
    app.delete("/inventoryItem/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await inventoryItemsCollection.deleteOne(query);
      res.send(result);
    });

    //Quantity update

    app.put("/inventoryItem/:id", async (req, res) => {
      const id = req.params.id;
      const updateItem = req.body;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: updateItem.newQuantity,
        },
      };

      const result = await inventoryItemsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    app.put("/delivery/:id", async (req, res) => {
      const id = req.params.id;
      const newQuantity = req.body;
      const deliverItem = newQuantity.quantity - 1;
      const query = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          quantity: deliverItem,
        },
      };

      const result = await inventoryItemsCollection.updateOne(
        query,
        updateDoc,
        options
      );
      res.send(result);
    });

    //add user items..
    app.get("/inventoryItems",verifyJWT, async (req, res) => {
      
      const email = req.query;
      const query = {};
      const cursor = inventoryItemsCollection.find(query);
      const addUserItems = await cursor.toArray();
      res.send(addUserItems);
    });
  } finally {
    /* await client.close(); */
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("connect");
});

app.listen(port, () => {
  console.log("port connect", port);
});
