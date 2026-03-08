-- ============================================================
-- FORGE — Cron Job: Daily Reminder at 5:00 PM New York Time
-- Run this in your Supabase SQL Editor AFTER deploying the
-- Edge Function.
--
-- 5:00 PM ET = 22:00 UTC (EST, Nov–Mar)
--            = 21:00 UTC (EDT, Mar–Nov)
--
-- We use 21:00 UTC which covers EDT (summer).
-- For EST (winter), adjust to 22:00 UTC or use both entries.
-- The cron extension handles this automatically in newer Supabase.
-- ============================================================

-- Enable the pg_cron extension (only needed once per project)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable the http extension to call Edge Functions
CREATE EXTENSION IF NOT EXISTS http;

-- ============================================================
-- Schedule: Every day at 5:00 PM ET
-- Cron format: minute hour day-of-month month day-of-week
-- 
-- Using 21:00 UTC = 5:00 PM EDT (Eastern Daylight Time)
-- Adjust to 22:00 UTC for Eastern Standard Time (winter)
-- ============================================================
SELECT cron.schedule(
  'forge-daily-reminder',         -- unique job name
  '0 21 * * *',                   -- every day at 21:00 UTC (5 PM EDT)
  $$
  SELECT
    net.http_post(
      url    := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/daily-reminder',
      headers := '{"Content-Type": "application/json", "x-forge-secret": "YOUR_REMINDER_SECRET"}'::jsonb,
      body   := '{}'::jsonb
    ) AS request_id;
  $$
);

-- ============================================================
-- To verify the job was created:
-- SELECT * FROM cron.job;
--
-- To remove it:
-- SELECT cron.unschedule('forge-daily-reminder');
--
-- To manually trigger it for testing:
-- SELECT net.http_post(
--   url    := 'https://YOUR_PROJECT_ID.supabase.co/functions/v1/daily-reminder',
--   headers := '{"Content-Type": "application/json", "x-forge-secret": "YOUR_REMINDER_SECRET"}'::jsonb,
--   body   := '{}'::jsonb
-- );
-- ============================================================
