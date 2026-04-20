import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

const WEBHOOK = process.env.WEBHOOK_URL;

// 🧠 memoria simple (en RAM)
const ipData = {};

app.post("/send", async (req, res) => {

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.headers["x-real-ip"] ||
    req.socket.remoteAddress;

  const now = Date.now();

  // Inicializar si no existe
  if (!ipData[ip]) {
    ipData[ip] = {
      count: 0,
      lastRequest: 0
    };
  }

  const data = ipData[ip];

  // ⏱ COOLDOWN (30 segundos)
  if (now - data.lastRequest < 30000) {
    return res.status(429).json({
      error: "Cooldown activo — espera unos segundos antes de enviar otra postulación."
    });
  }

  data.lastRequest = now;
  data.count++;

  // 🧠 detectar spam
  const isSpam = data.count >= 3; // 3 envíos = sospechoso

  console.log(`IP: ${ip} | Count: ${data.count}`);

  const body = req.body;

  if (body.embeds && body.embeds[0]) {

    // 🌐 IP
    body.embeds[0].fields.push({
      name: "🌐 IP",
      value: ip || "Desconocida",
      inline: false
    });

    // 🚨 ALERTA
    if (isSpam) {
      body.embeds[0].fields.push({
        name: "🚨 ALERTA",
        value: "Posible SPAM detectado (múltiples envíos desde la misma IP)",
        inline: false
      });

      // color rojo si spam
      body.embeds[0].color = 0xE74C3C;
    }
  }

  try {
    const response = await fetch(WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      res.json({ success: true });
    } else {
      const text = await response.text();
      console.log("Error Discord:", text);
      res.status(500).json({ error: text });
    }

  } catch (err) {
    console.log("Error servidor:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend activo");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running"));
