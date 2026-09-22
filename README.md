# Leave Request Form

A leave-request form that sends each submission to Telegram and saves it to a
Google Sheet through a Vercel serverless function.

## Project structure

```
.
├── index.html        the form itself
├── api/submit.js      serverless function that sends to Telegram and Sheets
├── package.json
└── .env.example       template for the environment variables you need
```

## 1. Set up Telegram

Create a bot with `@BotFather`, add it to your Telegram chat, and set the bot
token and chat ID in the environment variables below.

## 2. Set up the Google Sheet

1. Create a Google Sheet with this header row:
   `Timestamp | ឈ្មោះ | តួនាទី | រយៈពេលសុំច្បាប់ | ចាប់ពីថ្ងៃទី | ដល់ថ្ងៃទី | ធ្វើនៅថ្ងៃទី | ការិយាល័យ | មូលហេតុ`
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
       p.duration || "",
       p.fromDate || "",
       p.toDate || "",
      p.performedDate || "",
      p.office || "",
      p.reason || "",
     ]);
     return ContentService.createTextOutput("OK");
   }
   ```

3. **Deploy → New deployment → Web app → Execute as "Me" → Who has access
   "Anyone" → Deploy.** If the deployment already exists, use **Manage
   deployments → Edit**, select **Anyone**, and deploy a new version. Copy the
   URL ending in `/exec`. Opening this URL in a private browser window must not
   redirect to Google sign-in.

   <!-- https://script.google.com/macros/s/AKfycbwF191GFxhz3TxENwUejJ5mPW6SzjUC2cI6HIfa3nAa5G1EmMLsKRYi7EJeMr8_u3t-/exec -->

## 3. Deploy to Vercel

```bash
npm i -g vercel
cd leave-request-vercel
vercel --prod
```

Or push this folder to a GitHub repo and import it at vercel.com/new.

## 4. Set the environment variables

In the Vercel dashboard: **Project → Settings → Environment Variables**, add:

| Name                 | Value                                  |
|-----------------------|-----------------------------------------|
| `TELEGRAM_BOT_TOKEN` | your Telegram bot token                 |
| `TELEGRAM_CHAT_ID`   | your Telegram chat ID                   |
| `SHEET_WEBHOOK_URL`   | your Apps Script URL from step 1        |

Redeploy after adding them (Vercel doesn't apply new env vars to already-built
deployments) — either `vercel --prod` again, or click **Redeploy** in the
dashboard.

## Local testing

```bash
cp .env.example .env   # then fill in real values
vercel dev
```
