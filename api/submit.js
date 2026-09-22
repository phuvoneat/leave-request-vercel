export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const { name, position, office, duration, reason, fromDate, toDate } = req.body || {};

  const dateFormat = /^\d{2}\/\d{2}\/\d{4}$/;
  const required = { name, position, office, duration, reason, fromDate, toDate };
  const missing = Object.entries(required).some(([, v]) => !v || !String(v).trim());
  const badDates = !dateFormat.test(fromDate || "") || !dateFormat.test(toDate || "");

  if (missing || badDates) {
    res.status(400).json({ ok: false, error: "Missing or invalid fields" });
    return;
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
  const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL;

  if (!BOT_TOKEN || !CHAT_ID) {
    res.status(500).json({ ok: false, error: "Server is missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID" });
    return;
  }

  const text =
    "📋 សំណើសុំច្បាប់ថ្មី\n\n" +
    `ឈ្មោះ: ${name || "-"}\n` +
    `តួនាទី: ${position}\n` +
    `ការិយាល័យ: ${office}\n` +
    `រយៈពេលសុំច្បាប់: ${duration}\n` +
    `មូលហេតុ: ${reason}\n` +
    `ចាប់ពីថ្ងៃទី: ${fromDate}\n` +
    `ដល់ថ្ងៃទី: ${toDate}`;

  try {
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text }),
    });
    const tgData = await tgRes.json();

    if (!tgData.ok) {
      res.status(502).json({ ok: false, error: tgData.description || "Telegram rejected the message" });
      return;
    }

    if (SHEET_WEBHOOK_URL) {
      try {
        await fetch(SHEET_WEBHOOK_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ name: name || "", position, office, duration, reason, fromDate, toDate }).toString(),
        });
      } catch (err) {
        // Best-effort only — don't fail the whole request over the Sheet save
        console.warn("Sheet save failed:", err);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
