const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// Root route (for testing server)
app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

// Twilio voice webhook
app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
<Gather input="speech" action="/process-speech" method="POST" timeout="5">
<Say>Hello. Thank you for calling. How can I help you today?</Say>
</Gather>
<Say>Sorry, I didn't hear anything. Please call again.</Say>
</Response>
`);
});

// Process caller speech
app.post("/process-speech", (req, res) => {
  const speech = req.body.SpeechResult || "I didn't catch that";

  res.type("text/xml");

  res.send(`
<Response>
<Say>You said: ${speech}</Say>
</Response>
`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});;
