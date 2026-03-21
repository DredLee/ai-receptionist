const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("ENDOR RECEPTIONIST LIVE");
});

function respond(res, message) {
  res.type("text/xml");
  res.send(`
<Response>
  <Say>${message}</Say>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Is there anything else I can help you with?</Say>
  </Gather>
  <Say>Thank you for calling Endor. Goodbye.</Say>
</Response>
`);
}

function handleVoice(req, res) {
  res.type("text/xml");
  res.send(`
<Response>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Hello, thank you for calling Endor. How can I help you today?</Say>
  </Gather>
  <Say>Sorry, I didn't hear anything. Please call again.</Say>
</Response>
`);
}

app.get("/voice", handleVoice);
app.post("/voice", handleVoice);

app.post("/process-speech", (req, res) => {
  const speech = (req.body.SpeechResult || "").toLowerCase().trim();

  console.log("Caller said:", speech);

  if (
    speech.includes("hours") ||
    speech.includes("hour") ||
    speech.includes("open") ||
    speech.includes("close")
  ) {
    return respond(res, "We are open Monday to Friday from 9 AM to 5 PM.");
  }

  if (
    speech.includes("service") ||
    speech.includes("services") ||
    speech.includes("offer") ||
    speech.includes("what do you do")
  ) {
    return respond(res, "We offer AI voice agents and AI receptionists.");
  }

  if (
    speech.includes("location") ||
    speech.includes("located") ||
    speech.includes("where are you") ||
    speech.includes("address")
  ) {
    return respond(res, "We are based in Toronto.");
  }

  if (
    speech.includes("appointment") ||
    speech.includes("book") ||
    speech.includes("booking") ||
    speech.includes("schedule")
  ) {
    return respond(res, "Appointments are not required, and same day bookings are allowed. May I have your name, email address, and phone number?");
  }

  return respond(
    res,
    "I do not have that information. Management will call you back to address that question. May I have your name, email address, and phone number?"
  );
});

app.listen(PORT, () => {
  console.log(`ENDOR RECEPTIONIST LIVE on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`ENDOR VERSION TEST 7 running on port ${PORT}`);
});
