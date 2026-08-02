const { port } = require("./config/env");
const { connectDatabase } = require("./config/database");
const app = require("./app");

connectDatabase();

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
