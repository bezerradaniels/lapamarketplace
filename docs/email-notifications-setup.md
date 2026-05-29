# Email Notifications Setup

This document explains how email notifications are configured for signup, trial completion, and subscription events.

## Overview

You will receive emails at `daniel.ddsb@gmail.com` for the following events:

1. **New user signup** - When someone creates an account
2. **Trial completion** - When a user's 7-day trial ends
3. **Subscription created** - When a user starts a paid subscription
4. **Subscription updated** - When a subscription is modified
5. **Subscription canceled** - When a subscription is canceled

## Architecture

### 1. Signup Notification (Already Implemented)

**File:** `supabase/functions/signup-notification/index.ts`

- Called automatically after successful signup via `src/features/auth/api/mutations.ts`
- Sends email with user's name and email
- Already configured to send to `daniel.ddsb@gmail.com`

### 2. Billing Notification (New)

**File:** `supabase/functions/billing-notification/index.ts`

- Handles all billing-related notifications
- Called by:
  - `stripe-webhook` for subscription events
  - `check-trial-completions` for trial completion
- Sends formatted emails with store details

### 3. Stripe Webhook Integration (Updated)

**File:** `supabase/functions/stripe-webhook/index.ts`

- Updated to call `billing-notification` for:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

### 4. Trial Completion Check (New)

**File:** `supabase/functions/check-trial-completions/index.ts`

- Checks for trials that ended in the last 24 hours
- Sends notification for each completed trial
- Updates subscription status to `past_due`
- **Must be called daily via cron job**

## Setup Instructions

### Step 1: Deploy Edge Functions

Deploy the new edge functions to Supabase:

```bash
supabase functions deploy billing-notification
supabase functions deploy check-trial-completions
```

### Step 2: Set Environment Variables

Ensure these environment variables are set in your Supabase project:

```
RESEND_API_KEY=your_resend_api_key
ADMIN_EMAIL=daniel.ddsb@gmail.com
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 3: Set Up Daily Cron Job

You need to call the `check-trial-completions` function daily. Choose one of these methods:

#### Option A: GitHub Actions (Recommended)

Create a GitHub Action in your repository:

```yaml
# .github/workflows/check-trial-completions.yml
name: Check Trial Completions

on:
  schedule:
    - cron: '0 9 * * *' # Runs daily at 9 AM UTC
  workflow_dispatch: # Allow manual trigger

jobs:
  check-trials:
    runs-on: ubuntu-latest
    steps:
      - name: Call check-trial-completions function
        run: |
          curl -X POST \
            '${{ secrets.SUPABASE_URL }}/functions/v1/check-trial-completions' \
            -H 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}' \
            -H 'Content-Type: application/json'
```

Add these secrets to your GitHub repository:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

#### Option B: External Cron Service

Use a service like cron-job.org, EasyCron, or similar:

```
URL: https://your-project.supabase.co/functions/v1/check-trial-completions
Method: POST
Headers:
  Authorization: Bearer YOUR_SERVICE_ROLE_KEY
  Content-Type: application/json
```

#### Option C: Supabase pg_cron (If Available)

If your Supabase project has pg_cron enabled, you can create a migration:

```sql
-- Enable pg_cron
create extension if not exists pg_cron;

-- Schedule daily check at 9 AM UTC
select cron.schedule(
  'check-trial-completions',
  '0 9 * * *',
  $$
  select net.http_post(
    current_setting('app.supabase_url', true) || '/functions/v1/check-trial-completions',
    '{}'::jsonb,
    jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.service_role_key', true),
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

Note: This requires the `pg_net` extension and proper configuration.

### Step 4: Test the Setup

#### Test Signup Notification

1. Create a new test account (use email with `+teste` to avoid sending real notification)
2. Check if you receive the email at `daniel.ddsb@gmail.com`

#### Test Subscription Notification

1. Create a test subscription via Stripe test mode
2. Check if you receive the subscription email

#### Test Trial Completion

1. Manually trigger the check function:
```bash
curl -X POST \
  'https://your-project.supabase.co/functions/v1/check-trial-completions' \
  -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \
  -H 'Content-Type: application/json'
```

2. Or update a trial's `trial_ends_at` to the past and run the check

## Email Templates

All emails follow a consistent design with:
- Lapa Marketplace branding
- Clear subject lines with emojis
- Color-coded borders (green for success, yellow for warnings, red for cancellations)
- Store and owner details
- Professional footer

## Troubleshooting

### Not Receiving Emails

1. Check Supabase function logs for errors
2. Verify RESEND_API_KEY is valid
3. Check if ADMIN_EMAIL is set correctly
4. Ensure the edge functions are deployed

### Trial Completion Not Working

1. Verify the cron job is running
2. Check function logs for errors
3. Ensure `check-trial-completions` is being called with service role key
4. Check if trials have `trial_ends_at` in the past

### TypeScript Errors in IDE

The TypeScript errors about `Deno` are expected - these are Deno edge functions. The IDE doesn't have Deno types configured, but this won't affect functionality in Supabase.

## Files Modified/Created

### Created
- `supabase/functions/billing-notification/index.ts` - Main billing notification handler
- `supabase/functions/check-trial-completions/index.ts` - Trial completion checker
- `supabase/migrations/20260529180000_trial_completion_notification.sql` - (Placeholder, using edge function approach)

### Modified
- `supabase/functions/stripe-webhook/index.ts` - Added billing notification calls

### Existing (No Changes Needed)
- `supabase/functions/signup-notification/index.ts` - Already working
- `src/features/auth/api/mutations.ts` - Already calls signup-notification
