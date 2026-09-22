export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  let body = req.body || {};
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { name, position, office, duration, reason, fromDate, toDate, performedDate } = body;

  const dateFormat = /^\d{2}\/\d{2}\/\d{4}$/;
  const required = { name, position, office, duration, reason, fromDate, toDate };
  const missing = Object.entries(required).some(([, v]) => !v || !String(v).trim());
  const badDates = !dateFormat.test(fromDate || "") || !dateFormat.test(toDate || "");

  if (missing || badDates) {
    res.status(400).json({ ok: false, error: "Missing or invalid fields" });
    return;
  }

  const SHEET_WEBHOOK_URL = process.env.SHEET_WEBHOOK_URL;
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!SHEET_WEBHOOK_URL || !BOT_TOKEN || !CHAT_ID) {
    res.status(500).json({ ok: false, error: "Server is missing a required Google Sheet or Telegram environment variable" });
    return;
  }

  try {
    const text =
      "📋 សំណើសុំច្បាប់ថ្មី\n\n" +
      `ឈ្មោះ: ${name || "-"}\n` +
      `តួនាទី: ${position}\n` +
      `រយៈពេលសុំច្បាប់: ${duration}\n` +
      `ចាប់ពីថ្ងៃទី: ${fromDate}\n` +
      `ដល់ថ្ងៃទី: ${toDate}\n` +
      `ធ្វើនៅថ្ងៃទី: ${performedDate || "-"}\n` +
      `ការិយាល័យ: ${office}\n` +
      `មូលហេតុ: ${reason}`;

    const sheetData = {
      timestamp: new Date().toISOString(),
      name: name || "",
      position,
      duration,
      fromDate,
      toDate,
      performedDate: performedDate || "",
      office,
      reason,
    };

    const [tgRes, sheetRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text }),
      }),
      fetch(SHEET_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
        body: new URLSearchParams(sheetData).toString(),
      }),
    ]);

    let tgData = {};
    try {
      tgData = await tgRes.json();
    } catch {
      tgData = {};
    }

    if (!tgRes.ok || !tgData.ok) {
      res.status(502).json({ ok: false, error: tgData.description || "Telegram rejected the submission" });
      return;
    }

    if (!sheetRes.ok) {
      res.status(502).json({ ok: false, error: "Google Sheet rejected the submission" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
