const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const bookRoutes = require("./routes/bookRoutes");
const authRoutes = require("./routes/authRoutes");
const userBookRoutes = require("./routes/userBookRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const summaryRoutes = require("./routes/summaryRoutes");

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

app.use("/", bookRoutes);
app.use("/", authRoutes);
app.use("/", userBookRoutes);
app.use("/", recommendationRoutes);
app.use("/", summaryRoutes);

module.exports = app;
