const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

function handleVoice(req, res) {
  res.type("text/xml");

  res.send(`
<Response>
<Gather input="speech" action="/process-speech" method="POST">
<Say>Hello. Thank you for calling. How can I help you today?</Say>
</Gather>
</Response>
`);
}

app.post("/process-speech", (req, res) => {
  const speech = req.body.SpeechResult || "I didn't catch that";

  res.type("text/xml");

  res.send(`
<Response>
<Say>You said: ${speech}</Say>
</Response>
`);
});

app.post("/voice", handleVoice);
app.get("/voice", handleVoice);

app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

app.listen(port, () => {
  console.log("Server running on port " + port);
});
