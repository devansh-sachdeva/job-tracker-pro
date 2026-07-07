/*
# Create job_applications table for Job & Internship Tracker

1. New Tables
- `job_applications`
  - `id` (uuid, primary key)
  - `user_id` (uuid, not null, references auth.users, defaults to auth.uid())
  - `company_name` (text, not null)
  - `job_role` (text, not null)
  - `date_applied` (date, not null)
  - `status` (text, not null, default 'Applied')
  - `job_url` (text, nullable)
  - `notes` (text, nullable)
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Indexes
- Index on user_id for faster queries
- Index on status for filtering
- Index on date_applied for sorting

3. Security
- Enable RLS on `job_applications`
- Owner-scoped CRUD: each authenticated user can only access their own job applications
- Policies for SELECT, INSERT, UPDATE, DELETE

4. Notes
- Status values: 'Applied', 'Interview Scheduled', 'Offer Received', 'Rejected'
- user_id defaults to auth.uid() so inserts work without client passing user_id
*/

CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  job_role text NOT NULL,
  date_applied date NOT NULL,
  status text NOT NULL DEFAULT 'Applied',
  job_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_date_applied ON job_applications(date_applied DESC);

-- Enable Row Level Security
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "select_own_applications" ON job_applications;
DROP POLICY IF EXISTS "insert_own_applications" ON job_applications;
DROP POLICY IF EXISTS "update_own_applications" ON job_applications;
DROP POLICY IF EXISTS "delete_own_applications" ON job_applications;

-- Create policies for authenticated users to manage their own applications
CREATE POLICY "select_own_applications"
  ON job_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "insert_own_applications"
  ON job_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_applications"
  ON job_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_applications"
  ON job_applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_job_applications_updated_at ON job_applications;
CREATE TRIGGER update_job_applications_updated_at
  BEFORE UPDATE ON job_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();