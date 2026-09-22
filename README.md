# Leave Request Form

A leave-request form that submits to a Telegram group, and optionally logs
each submission to a Google Sheet. The Telegram bot token and chat ID are
kept server-side in a Vercel serverless function — they never reach the
browser.

## Project structure

```
.
├── index.html        the form itself
├── api/submit.js      serverless function that talks to Telegram + Sheets
├── package.json
└── .env.example       template for the environment variables you need
```

## 1. Get a Telegram bot token and chat ID

1. Message `@BotFather` on Telegram, send `/newbot`, and follow the prompts.
   You'll get a token like `123456789:AAExampleTokenText`.
2. Add the bot to your group, then send any message in the group.
3. Visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` in a browser
   and read the `"chat":{"id": ...}` value — that's your chat ID (negative
   for groups).

## 2. (Optional) Set up the Google Sheet

1. Create a Google Sheet with this header row:
   `Timestamp | Name | Position | Office | Duration | Reason | From Date | To Date`
2. In the sheet: **Extensions → Apps Script**, delete the placeholder code,
   and paste:

   ```javascript
   function doPost(e) {
     const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
     const p = e.parameter;
     sheet.appendRow([
       new Date(),
       p.name || "",
       p.position || "",
       p.office || "",
       p.duration || "",
       p.reason || "",
       p.fromDate || "",
       p.toDate || "",
     ]);
     return ContentService.createTextOutput("OK");
   }
   ```

3. **Deploy → New deployment → Web app → execute as "Me" → who has access
   "Anyone" → Deploy.** Copy the URL ending in `/exec`.

## 3. Deploy to Vercel

```bash
npm i -g vercel
cd leave-request-vercel
vercel --prod
```

Or push this folder to a GitHub repo and import it at vercel.com/new.

## 4. Set environment variables

In the Vercel dashboard: **Project → Settings → Environment Variables**, add:

| Name                 | Value                                  |
|-----------------------|-----------------------------------------|
| `TELEGRAM_BOT_TOKEN`  | your bot token from step 1              |
| `TELEGRAM_CHAT_ID`    | your chat ID from step 1                |
| `SHEET_WEBHOOK_URL`   | your Apps Script URL from step 2 (optional) |

Redeploy after adding them (Vercel doesn't apply new env vars to already-built
deployments) — either `vercel --prod` again, or click **Redeploy** in the
dashboard.

## Local testing

```bash
cp .env.example .env   # then fill in real values
vercel dev
```
