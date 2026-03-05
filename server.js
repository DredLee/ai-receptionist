const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: false }));

app.post("/voice", (req, res) => {
  res.set("Content-Type", "text/xml");

  res.send(`
    <Response>
      <Say voice="alice">
        Hello. Thank you for calling. Please hold while our AI receptionist assists you.
      </Say>
    </Response>
  `);
});

app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
