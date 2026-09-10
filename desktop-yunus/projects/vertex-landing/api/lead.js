const https = require("https");
const TELEGRAM_BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ||
  "YOUR_TELEGRAM_BOT_TOKEN_HERE";
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || "YOUR_CHAT_ID_HERE";
const allowCors = (fn) => async (req, res) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  return await fn(req, res);
};
function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}
const handler = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const data = req.body;
    const fullName = sanitize(data.fullName || "").substring(0, 100);
    const phone = sanitize(data.phone || "").substring(0, 20);
    const email = sanitize(data.email || "").substring(0, 100);
    const INTEREST_MAP = {
      gold: "Altın (XAU/USD)",
      silver: "Gümüş (XAG/USD)",
      oil: "Brent Petrol",
      nasdaq: "NASDAQ",
      bist: "BIST 100",
      crypto: "Kripto (BTC)",
      aibot: "VerteX AI Bot",
      all: "Hepsi",
    };
    const rawInterest = sanitize(data.interest || "").substring(0, 50);
    const interest = INTEREST_MAP[rawInterest] || rawInterest;
    const message = sanitize(data.message || "").substring(0, 500);
    const formatter = new Intl.DateTimeFormat("tr-TR", {
      timeZone: "Europe/Istanbul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    const timestamp = formatter.format(new Date());
    const telegramMsg =
      `<b>Yeni Lead — VerteX Markets</b>\n\n` +
      `• <b>Ad Soyad:</b> ${fullName}\n` +
      `• <b>Telefon:</b> ${phone}\n` +
      `• <b>E-posta:</b> ${email}\n` +
      `• <b>İlgi Alanı:</b> ${interest}\n` +
      `• <b>Mesaj:</b> ${message || "—"}\n` +
      `• <b>Tarih:</b> ${timestamp}`;
    await new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: telegramMsg,
        parse_mode: "HTML",
      });
      const options = {
        hostname: "api.telegram.org",
        port: 443,
        path: `/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      };
      const tgReq = https.request(options, (tgRes) => {
        let chunks = "";
        tgRes.on("data", (c) => (chunks += c));
        tgRes.on("end", () => {
          resolve(JSON.parse(chunks));
        });
      });
      tgReq.on("error", reject);
      tgReq.write(payload);
      tgReq.end();
    });
    res.status(200).json({ ok: true, message: "Lead received" });
  } catch (err) {
    console.error("Lead Error:", err);
    res.status(400).json({ ok: false, error: "Invalid data" });
  }
};
module.exports = allowCors(handler);
