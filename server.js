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

function escapeXml(text = "") {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

function handleVoice(req, res) {
  res.type("text/xml");
  res.send(`
<Response>
  <Gather input="speech" action="/process-speech" method="POST" timeout="5">
    <Say>Hello. How can I help you today?</Say>
  </Gather>
  <Say>Sorry, I didn't hear anything. Please call again.</Say>
</Response>
`);
}

app.get("/voice", handleVoice);
app.post("/voice", handleVoice);

app.post("/process-speech", async (req, res) => {
  const speech = req.body.SpeechResult || "I didn't catch that";
  console.log("Caller said:", speech);

  let aiReply = "Sorry, something went wrong.";

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a friendly AI receptionist for a business. Keep answers short, clear, and helpful."
        },
        {
          role: "user",
          content: speech
        }
      ]
    });

    aiReply = completion.choices?.[0]?.message?.content || "Sorry, something went wrong.";
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
  <Gather input="speech" action="/process-speech" method="POST" timeout="5">
    <Say>Is there anything else I can help you with?</Say>
  </Gather>
</Response>
`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
