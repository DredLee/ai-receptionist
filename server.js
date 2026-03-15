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

// Temporary in-memory conversation store
// Key = Twilio CallSid
// Value = array of messages for OpenAI
const conversations = {};

// Escape text so it doesn't break Twilio XML
function escapeXml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Root route
app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

// Handle incoming voice call
function handleVoice(req, res) {
  const callSid = req.body.CallSid || req.query.CallSid || "unknown";

  // Start a fresh conversation for this call
  conversations[callSid] = [
    {
      role: "system",
      content:
        "You are a friendly and professional AI receptionist for a business. " +
        "Keep responses short, natural, and helpful. " +
        "Ask follow-up questions when needed. " +
        "If asked about business hours, say: We are open Monday through Friday from 9 AM to 5 PM. " +
        "If someone wants to book an appointment, ask what day and time they prefer."
    }
  ];

  console.log("New call started:", callSid);

  res.type("text/xml");
  res.send(`
<Response>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5" speechTimeout="auto">
    <Say>Hello. How can I help you today?</Say>
  </Gather>
  <Say>Sorry, I didn't hear anything. Please call again.</Say>
</Response>
`);
}

app.get("/voice", handleVoice);
app.post("/voice", handleVoice);

// Process caller speech with memory
app.post("/process-speech", async (req, res) => {
  const callSid = req.body.CallSid || "unknown";
  const speech = req.body.SpeechResult || "I didn't catch that";

  console.log("CallSid:", callSid);
  console.log("Caller said:", speech);

  // Create conversation if missing
  if (!conversations[callSid]) {
    conversations[callSid] = [
      {
        role: "system",
        content:
          "You are a friendly and professional AI receptionist for a business. " +
          "Keep responses short, natural, and helpful. " +
          "Ask follow-up questions when needed. " +
          "If asked about business hours, say: We are open Monday through Friday from 9 AM to 5 PM. " +
          "If someone wants to book an appointment, ask what day and time they prefer."
      }
    ];
  }

  // Add caller message to memory
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
      completion.choices?.[0]?.message?.content ||
      "Sorry, something went wrong.";

    // Add AI response to memory
    conversations[callSid].push({
      role: "assistant",
      content: aiReply
    });

    // Prevent memory from growing too large
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
  <Say>Thank you for calling. Goodbye.</Say>
</Response>
`);
});

// Optional endpoint to clear a conversation manually
app.post("/end-call", (req, res) => {
  const callSid = req.body.CallSid || "unknown";

  if (conversations[callSid]) {
    delete conversations[callSid];
    console.log("Conversation cleared for:", callSid);
  }

  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
