-- Create training_templates table
CREATE TABLE IF NOT EXISTS training_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  workout_type TEXT NOT NULL CHECK (workout_type IN ('table_practice', 'strength', 'technique', 'endurance', 'sparring')),
  suggested_duration_minutes INTEGER CHECK (suggested_duration_minutes >= 1 AND suggested_duration_minutes <= 480),
  suggested_intensity INTEGER CHECK (suggested_intensity >= 1 AND suggested_intensity <= 10),
  exercises JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  modified_at TIMESTAMPTZ DEFAULT NOW(),
  deleted BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_training_templates_user_id ON training_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_training_templates_workout_type ON training_templates(workout_type);
CREATE INDEX IF NOT EXISTS idx_training_templates_deleted ON training_templates(deleted);
CREATE INDEX IF NOT EXISTS idx_training_templates_modified_at ON training_templates(modified_at);

-- Enable Row Level Security
ALTER TABLE training_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own templates" ON training_templates;
DROP POLICY IF EXISTS "Users can create their own templates" ON training_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON training_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON training_templates;

-- RLS Policies
CREATE POLICY "Users can view their own templates"
  ON training_templates
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own templates"
  ON training_templates
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON training_templates
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON training_templates
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_training_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_training_templates_updated_at
  BEFORE UPDATE ON training_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_training_templates_updated_at();

-- Add comment to table
COMMENT ON TABLE training_templates IS 'Reusable workout templates created by users. Exercises stored as JSONB array.';
