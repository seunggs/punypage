-- Add INSERT policy for profiles table
-- Users can insert their own profile (needed for the trigger to work)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
