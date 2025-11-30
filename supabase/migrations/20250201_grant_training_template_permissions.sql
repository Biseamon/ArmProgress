-- Fix permissions for training_templates
-- Root cause: Table was created after global grants, so authenticated role lacks table privileges.
-- This migration grants the necessary permissions so RLS policies can be evaluated.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.training_templates TO authenticated;

-- Ensure RLS stays enabled (defensive)
ALTER TABLE public.training_templates ENABLE ROW LEVEL SECURITY;
