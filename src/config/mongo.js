const mongoose = require("mongoose");

async function connectMongo() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("Connecté à MongoDB");
}

module.exports = connectMongo;
