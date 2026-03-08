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

  let aiReply = "Sorry, something went wrong.";

  try {

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional AI receptionist. Be friendly, concise, and helpful."
        },
        {
          role: "user",
          content: speech
        }
      ]
    });

    aiReply = completion.choices[0].message.content;

  } catch (error) {
  console.error("OPENAI FULL ERROR:", error);
  console.error("OPENAI MESSAGE:", error.message);
}

  res.type("text/xml");

  res.send(`
<Response>
<Say>${aiReply}</Say>
<Gather input="speech" action="/process-speech" method="POST">
<Say>Is there anything else I can help you with?</Say>
</Gather>
</Response>
`);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
