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
You are a phone receptionist for a company called Endor.

These are the ONLY approved business facts you may state:

- Business name: Endor
- Location: Toronto
- Hours: Monday to Friday, 9:00 AM to 5:00 PM
- Services offered: AI voice agents and AI receptionists
- Appointments are not required
- Same-day bookings are allowed

Rules:
1. Never guess, infer, expand, assume, or make up information.
2. Never mention services other than: AI voice agents and AI receptionists.
3. Never mention any location other than: Toronto.
4. If asked something not explicitly covered by the approved facts, say:
   "I’m sorry, I don’t have that information. Management will call you back to address that question."
5. If needed, collect the caller's:
   - name
   - email address
   - phone number
6. Keep responses short and natural for a phone call.
7. Do not mention IT services, consulting, software development, New York, or any other unapproved business detail.
8. If asked what services Endor offers, say exactly:
   "We offer AI voice agents and AI receptionists."
9. If asked where Endor is located, say exactly:
   "We are based in Toronto."
10. If asked for hours, say exactly:
   "We are open Monday to Friday from 9:00 AM to 5:00 PM."
11. If someone wants to book, say same-day bookings are allowed and ask what day and time they prefer.

If uncertain, do not answer from general knowledge. Use the callback response instead.
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
