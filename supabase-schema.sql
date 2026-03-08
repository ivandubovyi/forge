-- ============================================================
-- FORGE App — Supabase Database Schema
-- Run this entire file in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- 1. PROFILES TABLE
-- Stores user info including phone number for SMS reminders
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,              -- E.164 format, e.g. +15551234567
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WORKOUT PLANS TABLE
-- Stores the user's fitness profile and level (one row per user)
CREATE TABLE IF NOT EXISTS public.workout_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  age INTEGER,
  weight NUMERIC,
  height NUMERIC,
  goal TEXT,
  reps JSONB,                       -- { pushup, situp, squat, burpee, lunge, plank }
  level TEXT,                       -- Beginner / Intermediate / Advanced / Master
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)                   -- One plan per user (upsert-friendly)
);

-- 3. PROGRESS TABLE
-- Stores daily check-ins, completed workouts, and water intake
CREATE TABLE IF NOT EXISTS public.progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_days JSONB DEFAULT '{}', -- { "1": true, "5": true, ... }
  checked_exercises JSONB DEFAULT '{}', -- { "0-2": true, "1-0": true, ... }
  water_cups INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Each user can only read/write their own data
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;

-- Profiles: users can manage their own row
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Workout plans: users can manage their own
CREATE POLICY "Users can manage own workout plan"
  ON public.workout_plans FOR ALL USING (auth.uid() = user_id);

-- Progress: users can manage their own
CREATE POLICY "Users can manage own progress"
  ON public.progress FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- SERVICE ROLE READ ACCESS (for the reminder Edge Function)
-- The reminder function uses the service role key, which
-- bypasses RLS automatically — no extra policy needed.
-- ============================================================

-- Done! Your schema is ready.
-- Next step: deploy the Edge Function (see reminder-function/index.ts)
