require('dotenv').config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const cors = require("cors");
const port = process.env.PORT || 3000;
const uri = process.env.DATABASE_URL;

app.use(cors());
app.use(express.json());

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'Unauthorized access' });
    }
    req.user = decoded;
    next();
  });
};

// MongoDB client
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const moviesDB = client.db("moviesDB");
    const userData = client.db("userData");
    const moviesCollection = moviesDB.collection("moviesCollection");
    const seriesCollection = moviesDB.collection("seriesCollection");
    const userCollectionData = userData.collection("userCollectionData");

    // Helper function to create a token
    const createToken = (user) => {
      return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    };

    // Routes
    // Movies
    app.post("/movies", verifyToken, async (req, res) => {
      const moviesData = req.body;
      const result = await moviesCollection.insertOne(moviesData);
      res.send(result);
    });

    app.get("/movies", async (req, res) => {
      const moviesData = moviesCollection.find();
      const result = await moviesData.toArray();
      res.send(result);
    });

    app.get("/movies/:id", async (req, res) => {
      const id = req.params.id;
      const moviesData = await moviesCollection.findOne({ _id: new ObjectId(id) });
      res.send(moviesData);
    });

    app.patch("/movies/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const upData = req.body;
      const moviesData = await moviesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: upData }
      );
      res.send(moviesData);
    });

    app.delete("/movies/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const moviesData = await moviesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(moviesData);
    });

    // Series
    app.post("/series", verifyToken, async (req, res) => {
      const seriesData = req.body;
      const result = await seriesCollection.insertOne(seriesData);
      res.send(result);
    });

    app.get("/series", async (req, res) => {
      const seriesData = seriesCollection.find();
      const result = await seriesData.toArray();
      res.send(result);
    });

    app.get("/series/:id", async (req, res) => {
      const id = req.params.id;
      const seriesData = await seriesCollection.findOne({ _id: new ObjectId(id) });
      res.send(seriesData);
    });

    app.patch("/series/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const upData = req.body;
      const seriesData = await seriesCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: upData }
      );
      res.send(seriesData);
    });

    app.delete("/series/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const seriesData = await seriesCollection.deleteOne({ _id: new ObjectId(id) });
      res.send(seriesData);
    });

    // User
    app.post("/users", async (req, res) => {
      const user = req.body;
      const token = createToken(user);
      const isUserExist = await userCollectionData.findOne({ email: user.email });
      if (isUserExist) {
        return res.send({
          status: "success",
          message: "Login success",
          token,
        });
      }
      await userCollectionData.insertOne(user);
      res.send({ token });
    });

    app.get("/users/get/:id", async (req, res) => {
      const id = req.params.id;
      const result = await userCollectionData.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const result = await userCollectionData.findOne({ email });
      res.send(result);
    });

    app.patch("/users/:email", async (req, res) => {
      const email = req.params.email;
      const userData = req.body;
      const result = await userCollectionData.updateOne(
        { email },
        { $set: userData },
        { upsert: true }
      );
      res.send(result);
    });

    console.log("Database connected to MongoDB!");
  } catch (err) {
    console.error("Error connecting to database:", err);
  }
}

run().catch(console.error);

app.get("/", (req, res) => {
  res.send("Route is Working");
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Internal Server Error");
});

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
