-- Option 1: Enable "Cascade Delete" (Recommended)
-- This automatically deletes all registrations when an event is deleted.
ALTER TABLE registrations
DROP CONSTRAINT IF EXISTS registrations_event_id_fkey,
ADD CONSTRAINT registrations_event_id_fkey
   FOREIGN KEY (event_id)
   REFERENCES events(id)
   ON DELETE CASCADE;

-- Option 2: Allow Admin to Delete Registrations (Alternative)
-- Run this if you prefer to keep the manual deletion logic but fix the permission error.
-- Make sure to replace 'ieeecisaseb@gmail.com' with your actual admin email if different.
CREATE POLICY "Admins can delete all registrations" ON registrations
FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' = 'ieeecisaseb@gmail.com');
