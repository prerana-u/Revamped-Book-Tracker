const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Useer = require("../models/User");

const SECRET_KEY = "your_secret_key_here"; // ideally from .env

// Register
const registerUser = async (req, res) => {
  const { username, email, password, age } = req.body;

  try {
    const existing = await Useer.findOne({ username });
    if (existing)
      return res.status(409).json({ error: "Username already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new Useer({
      username,
      email,
      password: hashedPassword,
      age,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Registration failed", details: err.message });
  }
};

// Login
const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await Useer.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid password" });

    const token = user._id + user.username; // Simplified token for demo purposes

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

module.exports = { registerUser, loginUser };
