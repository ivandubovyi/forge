# FORGE — Complete Setup Guide
## Auth + Progress Saving + Daily 5 PM Reminders

---

## What You'll Set Up

| Service | Purpose | Cost |
|---|---|---|
| Supabase | Database + Auth + Edge Functions | Free tier |
| Twilio | SMS reminders | ~$0.0079/SMS |
| SendGrid | Email reminders | Free up to 100/day |

---

## PART 1 — Supabase (Database & Auth)

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **Start your project** → Sign up
2. Click **New Project**
3. Name it `forge-app`, choose a region close to you, set a database password
4. Wait ~2 minutes for it to provision

### Step 2: Create the Database Tables

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `supabase-schema.sql` from this folder
4. Copy the entire contents and paste into the SQL Editor
5. Click **Run** — you should see "Success"

### Step 3: Configure Auth Settings

1. Go to **Authentication** → **Settings**
2. Under **Email**, make sure "Enable email confirmations" is **ON**
   - (Users will get a confirm email before they can log in)
3. Under **URL Configuration**, set your Site URL to wherever you host the app
   - For local testing: `http://localhost` or `file://` works too

### Step 4: Get Your API Keys

1. Go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcxyz123.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)

### Step 5: Add Keys to index.html

Open `index.html` and find these two lines near the top of the `<script>` tag:

```javascript
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace with your actual values:

```javascript
const SUPABASE_URL = 'https://abcxyz123.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6...';
```

---

## PART 2 — Twilio (SMS Reminders)

### Step 1: Create a Twilio Account

1. Go to [twilio.com](https://twilio.com) → **Sign Up** (free trial available)
2. Verify your email and phone number

### Step 2: Get a Phone Number

1. In the Twilio Console, go to **Phone Numbers** → **Buy a Number**
2. Make sure it has **SMS** capability
3. Buy it (around $1/month, covered by free trial credit)

### Step 3: Get Your Credentials

From the Twilio Console homepage, copy:
- **Account SID** (starts with `AC...`)
- **Auth Token** (click the eye icon to reveal)
- Your **Twilio Phone Number** (format: `+15557654321`)

---

## PART 3 — SendGrid (Email Reminders)

### Step 1: Create a SendGrid Account

1. Go to [sendgrid.com](https://sendgrid.com) → **Start for Free**
2. Verify your email

### Step 2: Create an API Key

1. Go to **Settings** → **API Keys** → **Create API Key**
2. Name: `forge-reminder`
3. Permission: **Full Access** (or restricted to Mail Send)
4. Copy the key — **you won't see it again!**

### Step 3: Verify a Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your name and the email address you'll send FROM
4. Click the verification link sent to that email

---

## PART 4 — Deploy the Edge Function

### Step 1: Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Windows (via scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Or via npm
npm install -g supabase
```

### Step 2: Link to Your Project

```bash
cd forge-app
supabase login
supabase link --project-ref YOUR_PROJECT_ID
```

Your project ID is in your Supabase URL: `https://YOUR_PROJECT_ID.supabase.co`

### Step 3: Set Environment Secrets

```bash
supabase secrets set TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+15557654321
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx
supabase secrets set SENDGRID_FROM_EMAIL=hello@yourdomain.com
supabase secrets set SENDGRID_FROM_NAME=FORGE
supabase secrets set REMINDER_SECRET=pick_any_long_random_string_here
```

### Step 4: Deploy the Function

```bash
supabase functions deploy daily-reminder
```

You should see: `✅ Done: deployed daily-reminder`

### Step 5: Test It Manually

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/daily-reminder \
  -H "Content-Type: application/json" \
  -H "x-forge-secret: pick_any_long_random_string_here" \
  -d '{}'
```

You should receive an SMS + email within 30 seconds.

---

## PART 5 — Schedule the Daily Cron Job

### Step 1: Enable Required Extensions

In Supabase SQL Editor, run:
```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS http;
```

### Step 2: Schedule the Job

Open `supabase/cron-schedule.sql`, replace:
- `YOUR_PROJECT_ID` with your actual project ID
- `YOUR_REMINDER_SECRET` with the same secret you set above

Then run the entire file in the SQL Editor.

### Step 3: Verify

```sql
SELECT * FROM cron.job;
```

You should see a row with `forge-daily-reminder` and `0 21 * * *`.

---

## PART 6 — Host the App (Optional)

The app is a single HTML file. Hosting options:

### Option A: Netlify (Free, easiest)
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `index.html` file
3. Done! You get a live URL instantly.

### Option B: GitHub Pages (Free)
1. Create a GitHub repo
2. Push `index.html` as the root file
3. Go to repo Settings → Pages → Source: main branch
4. Your URL: `https://yourusername.github.io/repo-name`

### Option C: Run Locally
Just open `index.html` in any browser — it works locally too.

---

## Summary Checklist

- [ ] Supabase project created
- [ ] Database schema deployed (`supabase-schema.sql`)
- [ ] API keys added to `index.html`
- [ ] Twilio account + phone number ready
- [ ] SendGrid account + sender verified
- [ ] Edge function secrets set via CLI
- [ ] Edge function deployed
- [ ] Manual test successful (SMS + email received)
- [ ] Cron job scheduled
- [ ] App hosted or opened locally

---

## Troubleshooting

**"Invalid API key" on login:**
Double-check your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `index.html`.

**SMS not arriving:**
- Make sure the phone number in E.164 format: `+15551234567`
- Check Twilio Console → Logs → Messaging for errors
- Verify your Twilio trial account has credit

**Email going to spam:**
- Complete SendGrid domain authentication (optional but recommended)
- Check SendGrid Activity Feed for delivery status

**Edge function errors:**
```bash
supabase functions logs daily-reminder
```

**Cron not firing:**
- Make sure `pg_cron` and `http` extensions are enabled
- Verify with: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;`
