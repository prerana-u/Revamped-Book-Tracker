const jwt = require("jsonwebtoken");
const { User } = require("../schemas");
const { jwtSecret } = require("../config/env");

const insertUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const newUser = new User({ username, password });
    await newUser.save();
    res
      .status(201)
      .json({ message: "User inserted into users collection", data: newUser });
  } catch (err) {
    console.error("Insert failed:", err);
    res.status(500).json({ error: "Insert failed", details: err.message });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });

    const isPasswordMatch = password === user.password;
    if (!isPasswordMatch)
      return res.status(401).json({ error: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, username: user.username },
      jwtSecret,
      { expiresIn: "1h" },
    );

    res.json({
      message: "Login successful",
      token,
      expiresIn: "1h",
      user: { id: user._id, username: user.username },
    });
  } catch (err) {
    res.status(500).json({ error: "Login failed", details: err.message });
  }
};

module.exports = { insertUser, loginUser };
