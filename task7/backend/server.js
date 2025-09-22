// mock api that sends error 50% of the time
const express = require("express");
const cors = require("cors");


const app = express();
const PORT = 4000;

app.use(cors());

app.get("/api/data", (req, res) => {
  const random = Math.random();
  if (random < 0.5) {
    return res.status(503).json({ error: "Service Unavailable" });
  } else {
    return res.json({ message: "Data fetched successfully!" });
  }
});

app.listen(PORT, () => {
  console.log(`Mock API running at localhost${PORT}`);
});