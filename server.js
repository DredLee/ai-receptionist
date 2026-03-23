const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

app.get("/", (req, res) => {
  res.send("GOODBYE TEST LIVE");
});

app.get("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say>This is a goodbye test.</Say>
  <Pause length="1"/>
  <Say>Thank you for calling Endor. Goodbye.</Say>
  <Pause length="2"/>
  <Hangup/>
</Response>
`);
});

app.post("/voice", (req, res) => {
  res.type("text/xml");
  res.send(`
<Response>
  <Say>This is a goodbye test.</Say>
  <Pause length="1"/>
  <Say>Thank you for calling Endor. Goodbye.</Say>
  <Pause length="2"/>
  <Hangup/>
</Response>
`);
});

app.listen(PORT, () => {
  console.log(`GOODBYE TEST LIVE on port ${PORT}`);
});
