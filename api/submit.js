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

  if (!SHEET_WEBHOOK_URL) {
    res.status(500).json({ ok: false, error: "Server is missing SHEET_WEBHOOK_URL" });
    return;
  }

  try {
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

    const sheetRes = await fetch(SHEET_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: new URLSearchParams(sheetData).toString(),
    });

    if (!sheetRes.ok) {
      res.status(502).json({ ok: false, error: "Google Sheet rejected the submission" });
      return;
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
}
