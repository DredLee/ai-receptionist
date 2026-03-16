const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PORT = process.env.PORT || 10000;
const conversations = {};

function escapeXml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function systemPrompt() {
  return {
    role: "system",
    content: `
You are the receptionist for Endor.

Approved facts:
- Business name: Endor
- Location: Toronto
- Hours: Monday to Friday, 9:00 AM to 5:00 PM
- Services: AI voice agents and AI receptionists
- Appointments are not required
- Same-day bookings are allowed

Rules:
- Never invent services, industries, addresses, or locations.
- If you do not know the answer, say:
  "I’m sorry, I don’t have that information. Management will call you back to address that question."
- If needed, collect the caller's name, email address, and phone number.
- Keep responses short.
`
  };
}

function getExactBusinessReply(speech) {
  const text = (speech || "").toLowerCase().trim();

  if (
    text.includes("hours") ||
    text.includes("hour") ||
    text.includes("open") ||
    text.includes("close")
  ) {
    return "We are open Monday to Friday from 9:00 AM to 5:00 PM.";
  }

  if (
    text.includes("location") ||
    text.includes("located") ||
    text.includes("where are you") ||
    text.includes("where you're located") ||
    text.includes("address")
  ) {
    return "We are based in Toronto.";
  }

  if (
    text.includes("services") ||
    text.includes("what do you offer") ||
    text.includes("what do you do") ||
    text === "offer" ||
    text.includes("service")
  ) {
    return "We offer AI voice agents and AI receptionists.";
  }

  if (
    text.includes("book") ||
    text.includes("booking") ||
    text.includes("appointment") ||
    text.includes("schedule")
  ) {
    return "Same-day bookings are allowed. What day and time would you prefer?";
  }

  return null;
}

function sendVoiceResponse(res, reply) {
  const safeReply = escapeXml(reply);

  res.type("text/xml");
  res.send(`
<Response>
  <Say>${safeReply}</Say>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Is there anything else I can help you with?</Say>
  </Gather>
  <Say>Thank you for calling Endor. Goodbye.</Say>
</Response>
`);
}

app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

function handleVoice(req, res) {
  const callSid = req.body.CallSid || req.query.CallSid || "unknown";
  conversations[callSid] = [systemPrompt()];
  console.log("New call started:", callSid);

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

app.post("/process-speech", async (req, res) => {
  const callSid = req.body.CallSid || "unknown";
  const speech = req.body.SpeechResult || "";

  console.log("CallSid:", callSid);
  console.log("Caller said:", speech);

  const exactReply = getExactBusinessReply(speech);

  // IMPORTANT: never call OpenAI for core business facts
  if (exactReply) {
    console.log("Using exact business reply:", exactReply);
    return sendVoiceResponse(res, exactReply);
  }

  if (!conversations[callSid]) {
    conversations[callSid] = [systemPrompt()];
  }

  conversations[callSid].push({
    role: "user",
    content: speech
  });

  let aiReply =
    "I’m sorry, I don’t have that information. Management will call you back to address that question.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.1,
      messages: conversations[callSid]
    });

    aiReply =
      completion.choices &&
      completion.choices[0] &&
      completion.choices[0].message &&
      completion.choices[0].message.content
        ? completion.choices[0].message.content
        : aiReply;

    conversations[callSid].push({
      role: "assistant",
      content: aiReply
    });
  } catch (error) {
    console.error("OPENAI STATUS:", error.status);
    console.error("OPENAI CODE:", error.code);
    console.error("OPENAI MESSAGE:", error.message);
  }

  return sendVoiceResponse(res, aiReply);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
