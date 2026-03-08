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

app.get("/", (req, res) => {
  res.send("AI Receptionist Server Running");
});

app.post("/voice", (req, res) => {
  res.type("text/xml");

  res.send(`
<Response>
<Gather input="speech" action="/process-speech" method="POST" timeout="5">
<Say>Hello. Thank you for calling. How can I help you today?</Say>
</Gather>
</Response>
`);
});

app.post("/process-speech", async (req, res) => {

  const speech = req.body.SpeechResult || "I didn't catch that";

  let aiReply = "I'm sorry, something went wrong.";

  try {

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly AI receptionist for a business. Keep answers short and helpful."
        },
        {
          role: "user",
          content: speech
        }
      ]
    });

    aiReply = completion.choices[0].message.content;

  } catch (error) {
    console.error(error);
  }

  res.type("text/xml");

  res.send(`
<Response>
<Say>${aiReply}</Say>
function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

app.post("/process-speech", async (req, res) => {

  const speech = req.body.SpeechResult || "I didn't catch that";
  let aiReply = "Sorry, something went wrong.";

  try {

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly AI receptionist. Keep responses under 25 words."
        },
        {
          role: "user",
          content: speech
        }
      ]
    });

    aiReply = completion.choices[0].message.content;

  } catch (error) {
    console.error("OpenAI Error:", error);
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
