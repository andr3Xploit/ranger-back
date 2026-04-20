import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());

const WEBHOOK = process.env.WEBHOOK_URL;

app.post("/send", async (req, res) => {
  try {
    const response = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (response.ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: "Discord error" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend activo");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running"));
