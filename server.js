 const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("ENDOR VERSION TEST 7");
});

function handleVoice(req, res) {
  res.type("text/xml");
  res.send(`
<Response>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Hello. This is Endor version test 7. Ask me about services or location.</Say>
  </Gather>
</Response>
`);
}

app.get("/voice", handleVoice);
app.post("/voice", handleVoice);

app.post("/process-speech", (req, res) => {
  const speech = (req.body.SpeechResult || "").toLowerCase();

  console.log("TEST 7 Caller said:", speech);

  let reply = "Management will call you back.";

  if (speech.includes("service") || speech.includes("offer")) {
    reply = "Version test 7. We offer AI voice agents and AI receptionists only.";
  } else if (
    speech.includes("location") ||
    speech.includes("located") ||
    speech.includes("address") ||
    speech.includes("where are you")
  ) {
    reply = "Version test 7. We are based in Toronto only.";
  } else if (
    speech.includes("hour") ||
    speech.includes("open") ||
    speech.includes("close")
  ) {
    reply = "Version test 7. We are open Monday to Friday from 9 AM to 5 PM.";
  }

  res.type("text/xml");
  res.send(`
<Response>
  <Say>${reply}</Say>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Anything else?</Say>
  </Gather>
</Response>
`);
});

app.listen(PORT, () => {
  console.log(`ENDOR VERSION TEST 7 running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`ENDOR VERSION TEST 7 running on port ${PORT}`);
});
