-- Create the report_settings table
CREATE TABLE IF NOT EXISTS report_settings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  frequency VARCHAR(50) NOT NULL,
  day_of_week INTEGER,
  day_of_month INTEGER,
  recipients TEXT NOT NULL,
  client_id INTEGER REFERENCES clients(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  next_scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index on client_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_report_settings_client_id ON report_settings(client_id);

-- Create an index on next_scheduled_at for faster scheduling queries
CREATE INDEX IF NOT EXISTS idx_report_settings_next_scheduled_at ON report_settings(next_scheduled_at);

-- Create a default weekly report setting
INSERT INTO report_settings (
  name, 
  frequency, 
  day_of_week, 
  recipients, 
  is_active, 
  next_scheduled_at
) 
VALUES (
  'Weekly Project Resources Report', 
  'weekly', 
  1, -- Monday
  COALESCE(current_setting('app.sales_team_email', true), 'vinayak.chobe@atyeti.com'),
  TRUE,
  (
    CASE 
      WHEN EXTRACT(DOW FROM NOW()) = 1 -- If today is Monday
      THEN NOW() + INTERVAL '7 day' -- Next Monday
      ELSE NOW() + INTERVAL '1 day' * (8 - EXTRACT(DOW FROM NOW()))::INTEGER -- Next Monday
    END
  )::DATE + INTERVAL '9 hour' -- 9:00 AM
) 
ON CONFLICT DO NOTHING;

-- Create a comment
COMMENT ON TABLE report_settings IS 'Stores configuration for periodic reports including frequency, recipients, and schedule';