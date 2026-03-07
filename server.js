const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

function handleVoice(req, res) {
  res.type("text/xml");

  res.send(`
<Response>
<Say>Hello. Thank you for calling. Please hold while our AI receptionist assists you.</Say>
</Response>
`);
}

app.post("/voice", handleVoice);
app.get("/voice", handleVoice);

app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
