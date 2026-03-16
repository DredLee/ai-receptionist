const express = require("express");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

console.log("OPENAI KEY PRESENT:", !!process.env.OPENAI_API_KEY);

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
You are a friendly and professional AI receptionist for a business called Endor.

Business details:
- Business name: Endor
- Location: Toronto
- Hours: Monday to Friday, 9:00 AM to 5:00 PM
- Services: AI voice agents and AI receptionists
- Appointments are not required
- Same-day bookings are allowed

Your behavior rules:
- Keep responses short, natural, and helpful for a phone call.
- Answer only using the business information provided.
- If asked about hours, say: "We are open Monday to Friday from 9:00 AM to 5:00 PM."
- If asked about services, say: "We offer AI voice agents and AI receptionists."
- If asked about location, say: "We are based in Toronto."
- If someone wants to book, tell them same-day bookings are allowed and ask what day and time they prefer.
- If you do not know the answer, do not invent information. Politely say: "Management will call you back to address that question."
- When needed, collect the caller's:
  1. name
  2. email address
  3. phone number
- Ask for those details naturally, one or two at a time.
- Keep answers concise.
`
  };
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
  const speech = req.body.SpeechResult || "I didn't catch that";

  console.log("CallSid:", callSid);
  console.log("Caller said:", speech);

  if (!conversations[callSid]) {
    conversations[callSid] = [systemPrompt()];
  }

  conversations[callSid].push({
    role: "user",
    content: speech
  });

  let aiReply = "Sorry, something went wrong.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversations[callSid]
    });

    aiReply =
      completion.choices &&
      completion.choices[0] &&
      completion.choices[0].message &&
      completion.choices[0].message.content
        ? completion.choices[0].message.content
        : "Sorry, something went wrong.";

    conversations[callSid].push({
      role: "assistant",
      content: aiReply
    });

    if (conversations[callSid].length > 12) {
      const systemMessage = conversations[callSid][0];
      const recentMessages = conversations[callSid].slice(-10);
      conversations[callSid] = [systemMessage, ...recentMessages];
    }
  } catch (error) {
    console.error("OPENAI STATUS:", error.status);
    console.error("OPENAI CODE:", error.code);
    console.error("OPENAI MESSAGE:", error.message);
    console.error("OPENAI DETAILS:", error.error);
  }

  aiReply = escapeXml(aiReply);

  res.type("text/xml");
  res.send(`
<Response>
  <Say>${aiReply}</Say>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Is there anything else I can help you with?</Say>
  </Gather>
  <Say>Thank you for calling Endor. Goodbye.</Say>
</Response>
`);
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
