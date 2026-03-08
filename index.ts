// ============================================================
// FORGE — Daily Reminder Edge Function
// File: supabase/functions/daily-reminder/index.ts
//
// This function runs every day at 5:00 PM New York time (ET).
// It fetches all users and sends:
//   • An SMS via Twilio
//   • An email via SendGrid
//
// Deploy instructions are in SETUP.md
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Environment variables (set in Supabase Dashboard → Edge Functions → Secrets) ──
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER")!; // e.g. +15557654321
const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY")!;
const SENDGRID_FROM_EMAIL = Deno.env.get("SENDGRID_FROM_EMAIL")!; // e.g. hello@yourapp.com
const SENDGRID_FROM_NAME = Deno.env.get("SENDGRID_FROM_NAME") || "FORGE";

// ── Motivational messages — rotated daily ──────────────────
const MESSAGES = [
  "Your body can do it. It's your mind you need to convince.",
  "The only bad workout is the one that didn't happen.",
  "You didn't come this far to only come this far.",
  "Every rep counts. Every set matters. Every day builds the life you want.",
  "Consistency beats perfection. Show up today.",
  "The pain you feel today will be the strength you feel tomorrow.",
  "You are one workout away from a good mood.",
  "Champions aren't born — they're forged. Get to work.",
  "Small progress is still progress. Keep going.",
  "Your future self is cheering you on. Don't let them down.",
];

const getDayMessage = () => {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return MESSAGES[dayOfYear % MESSAGES.length];
};

// ── SMS via Twilio ─────────────────────────────────────────
async function sendSMS(toPhone: string, name: string, dayNum: number, workoutName: string) {
  const motivation = getDayMessage();
  const body = `Hey ${name}! 💪 FORGE Reminder\n\nDay ${dayNum} — ${workoutName}\n\n${motivation}\n\nYour body won't build itself. Open FORGE and get it done! 🔥`;

  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        "Authorization": `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: toPhone,
        From: TWILIO_PHONE_NUMBER,
        Body: body,
      }),
    }
  );

  const result = await response.json();
  if (!response.ok) {
    console.error(`SMS failed for ${toPhone}:`, result);
    return false;
  }
  console.log(`✅ SMS sent to ${toPhone} (SID: ${result.sid})`);
  return true;
}

// ── Email via SendGrid ─────────────────────────────────────
async function sendEmail(toEmail: string, name: string, dayNum: number, workoutName: string, level: string) {
  const motivation = getDayMessage();
  const levelColors: Record<string, string> = {
    Beginner: "#47c8ff",
    Intermediate: "#e8ff47",
    Advanced: "#ff6b35",
    Master: "#ff4757",
  };
  const accentColor = levelColors[level] || "#e8ff47";

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0b;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#131316;border:1px solid #2a2a32;border-radius:16px;overflow:hidden;">
          
          <!-- Header bar -->
          <tr>
            <td style="background:linear-gradient(90deg,${accentColor},#ff6b35);height:4px;"></td>
          </tr>
          
          <!-- Logo -->
          <tr>
            <td style="padding:32px 36px 0;">
              <div style="font-family:Georgia,serif;font-size:2.4rem;font-weight:900;color:${accentColor};letter-spacing:0.1em;">FORGE.</div>
            </td>
          </tr>
          
          <!-- Greeting -->
          <tr>
            <td style="padding:20px 36px 0;">
              <p style="color:#6b6b7a;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">Daily Reminder · 5:00 PM ET</p>
              <h1 style="color:#f0f0f0;font-size:1.6rem;margin:0;line-height:1.3;">Hey ${name}, <br>it's time to train. 💪</h1>
            </td>
          </tr>
          
          <!-- Workout card -->
          <tr>
            <td style="padding:24px 36px;">
              <div style="background:#1c1c21;border:1px solid #2a2a32;border-radius:12px;padding:20px 22px;">
                <p style="color:#6b6b7a;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 6px;">Today's Session</p>
                <p style="color:#f0f0f0;font-size:1.25rem;font-weight:700;margin:0 0 8px;">Day ${dayNum} — ${workoutName}</p>
                <p style="color:#6b6b7a;font-size:0.83rem;margin:0;">Level: <span style="color:${accentColor};font-weight:600;">${level}</span></p>
              </div>
            </td>
          </tr>
          
          <!-- Motivation -->
          <tr>
            <td style="padding:0 36px 24px;">
              <p style="color:#a0a0b0;font-size:1rem;font-style:italic;line-height:1.65;margin:0;border-left:3px solid ${accentColor};padding-left:16px;">
                "${motivation}"
              </p>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding:0 36px 32px;">
              <a href="${SUPABASE_URL.replace('.supabase.co','')}" style="display:inline-block;background:${accentColor};color:#0a0a0b;padding:14px 28px;border-radius:8px;font-weight:700;font-size:0.9rem;text-decoration:none;letter-spacing:0.04em;">Open FORGE →</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #2a2a32;">
              <p style="color:#3a3a45;font-size:0.72rem;margin:0;line-height:1.6;">
                You're receiving this because you signed up for FORGE daily reminders.<br>
                These are sent every day at 5:00 PM Eastern Time.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textBody = `Hey ${name}!\n\nFORGE Daily Reminder — 5:00 PM ET\n\nDay ${dayNum}: ${workoutName}\nLevel: ${level}\n\n"${motivation}"\n\nDon't skip today. Your future self will thank you.\n\nOpen FORGE and get it done! 💪`;

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail, name }] }],
      from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
      subject: `💪 Day ${dayNum} — Time to FORGE, ${name.split(" ")[0]}!`,
      content: [
        { type: "text/plain", value: textBody },
        { type: "text/html", value: htmlBody },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error(`Email failed for ${toEmail}:`, err);
    return false;
  }
  console.log(`✅ Email sent to ${toEmail}`);
  return true;
}

// ── Calculate today's workout day ─────────────────────────
function getTodayWorkoutName(level: string, completedDays: Record<string, boolean>): { day: number; name: string } {
  // Find the next uncompleted workout day
  const schedule = [
    'Chest + Shoulders + Triceps','Leg Day 🔥','Back + Biceps + Arms','Rest & Recovery',
    'Full Body Circuit','Leg Day 🔥','Rest & Recovery',
  ];
  
  const completedCount = Object.keys(completedDays).length;
  const dayNum = Math.min(completedCount + 1, 31);
  const workoutName = schedule[(dayNum - 1) % schedule.length];
  
  return { day: dayNum, name: workoutName };
}

// ── Main handler ───────────────────────────────────────────
serve(async (req) => {
  // Allow both scheduled invocations and manual POST triggers
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Optional: verify a secret header when triggering manually
  const authHeader = req.headers.get("x-forge-secret");
  const expectedSecret = Deno.env.get("REMINDER_SECRET");
  if (expectedSecret && authHeader !== expectedSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  console.log("🔔 FORGE daily reminder job started —", new Date().toISOString());

  // Use service role to bypass RLS and read all users
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch all profiles
  const { data: profiles, error: profilesError } = await sb
    .from("profiles")
    .select("id, full_name, email, phone");

  if (profilesError || !profiles) {
    console.error("Failed to fetch profiles:", profilesError);
    return new Response(JSON.stringify({ error: "Failed to fetch profiles" }), { status: 500 });
  }

  console.log(`📋 Found ${profiles.length} user(s) to notify`);

  const results = { sms: { sent: 0, failed: 0 }, email: { sent: 0, failed: 0 } };

  for (const profile of profiles) {
    try {
      // Get their workout plan and progress
      const [{ data: plan }, { data: progress }] = await Promise.all([
        sb.from("workout_plans").select("level").eq("user_id", profile.id).single(),
        sb.from("progress").select("completed_days").eq("user_id", profile.id).single(),
      ]);

      // Skip users who haven't set up a plan yet
      if (!plan) {
        console.log(`⏭️  Skipping ${profile.full_name} — no plan yet`);
        continue;
      }

      const completedDays = progress?.completed_days || {};
      const { day, name: workoutName } = getTodayWorkoutName(plan.level, completedDays);

      // Send in parallel
      const [smsOk, emailOk] = await Promise.all([
        sendSMS(profile.phone, profile.full_name, day, workoutName),
        sendEmail(profile.email, profile.full_name, day, workoutName, plan.level),
      ]);

      if (smsOk) results.sms.sent++; else results.sms.failed++;
      if (emailOk) results.email.sent++; else results.email.failed++;

      // Small delay between users to avoid rate limits
      await new Promise(r => setTimeout(r, 300));

    } catch (err) {
      console.error(`Error processing ${profile.full_name}:`, err);
      results.sms.failed++;
      results.email.failed++;
    }
  }

  const summary = {
    timestamp: new Date().toISOString(),
    usersProcessed: profiles.length,
    results,
  };
  console.log("✅ Reminder job complete:", JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
