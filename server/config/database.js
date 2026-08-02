const mongoose = require("mongoose");
const { mongoUri } = require("./env");

mongoose.set("strictQuery", false);

function connectDatabase() {
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const connection = mongoose.connection;

  connection.once("open", () => {
    console.log("MongoDB connection established successfully");
  });

  connection.on("error", (error) => {
    console.error(error);
  });

  return connection;
}

module.exports = { connectDatabase };
