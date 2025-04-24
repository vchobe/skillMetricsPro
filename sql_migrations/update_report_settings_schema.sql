-- Update Report Settings Schema
-- This migration updates the report_settings table to add support for custom hostnames
-- and updates existing column names for consistency

-- Add new columns
ALTER TABLE report_settings
ADD COLUMN IF NOT EXISTS base_url TEXT,
ADD COLUMN IF NOT EXISTS description TEXT;

-- Rename columns for consistency
ALTER TABLE report_settings
RENAME COLUMN recipients TO recipient_email;

ALTER TABLE report_settings
RENAME COLUMN is_active TO active;

-- Update frequency enum to include 'daily'
-- First, create a temporary type
CREATE TYPE report_frequency_updated AS ENUM ('daily', 'weekly', 'monthly');

-- Update frequency column
ALTER TABLE report_settings
ALTER COLUMN frequency TYPE report_frequency_updated
USING (
  CASE frequency
    WHEN 'weekly' THEN 'weekly'::report_frequency_updated
    WHEN 'biweekly' THEN 'weekly'::report_frequency_updated  -- Convert biweekly to weekly
    WHEN 'monthly' THEN 'monthly'::report_frequency_updated
    ELSE 'weekly'::report_frequency_updated  -- Default to weekly
  END
);

-- Drop old enum and rename new one
DROP TYPE IF EXISTS report_frequency CASCADE;
ALTER TYPE report_frequency_updated RENAME TO report_frequency;

-- Update comments
COMMENT ON COLUMN report_settings.recipient_email IS 'Primary recipient email address';
COMMENT ON COLUMN report_settings.base_url IS 'Custom hostname for links in emails';
COMMENT ON COLUMN report_settings.description IS 'Optional description of the report';
COMMENT ON COLUMN report_settings.day_of_week IS '0 = Sunday, 1 = Monday, etc.';