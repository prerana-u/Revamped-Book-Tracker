const express = require("express");
const router = express.Router();
const { insertUser, loginUser } = require("../controllers/authController");

router.post("/create-user", insertUser);
router.post("/login", loginUser);

module.exports = router;
