const jwt = require("jsonwebtoken");
const { jwtSecret } = require("../config/env");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access denied. No token provided" });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ error: "Invalid or expired token", details: err.message });
    }
    req.user = decoded;
    next();
  });
}

module.exports = { authenticateToken };
