-- =============================================================================
-- SUPABASE REGISTRATION FIX — Run this in Supabase SQL Editor (Dashboard > SQL)
-- =============================================================================
-- This script creates:
--   1. A unique constraint to prevent duplicate registrations
--   2. A trigger function that ATOMICALLY enforces:
--      - registration_status must be 'open'
--      - max_registrations limit (race-condition-proof via advisory lock)
--      - event must not have already started (auto-closes registration)
--   3. The trigger itself on the registrations table
-- =============================================================================

-- 1. Prevent duplicate registrations at the database level
--    (If this constraint already exists, this will harmlessly error — that's fine)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'registrations_event_user_unique'
    ) THEN
        ALTER TABLE public.registrations
        ADD CONSTRAINT registrations_event_user_unique UNIQUE (event_id, user_id);
    END IF;
END $$;


-- 2. Create the trigger function
CREATE OR REPLACE FUNCTION public.check_registration_limit()
RETURNS TRIGGER AS $$
DECLARE
    v_current_count INTEGER;
    v_max_reg       INTEGER;
    v_status        TEXT;
    v_event_date    TIMESTAMPTZ;
    v_start_time    TEXT;
    v_computed_start TIMESTAMPTZ;
    v_parsed_time   TIME;
BEGIN
    -- =========================================================================
    -- ADVISORY LOCK: Serialize all concurrent registrations for the SAME event.
    -- This prevents the race condition where 200 users all pass the count check
    -- before any insert completes.
    -- =========================================================================
    PERFORM pg_advisory_xact_lock(hashtext(NEW.event_id::text));

    -- Fetch event details
    SELECT registration_status, max_registrations, date, start_time
    INTO   v_status, v_max_reg, v_event_date, v_start_time
    FROM   public.events
    WHERE  id = NEW.event_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EVENT_NOT_FOUND: Event does not exist';
    END IF;

    -- =========================================================================
    -- CHECK 1: Is registration explicitly closed by admin?
    -- =========================================================================
    IF v_status = 'closed' THEN
        RAISE EXCEPTION 'REGISTRATION_CLOSED: Registration has been closed for this event';
    END IF;

    -- =========================================================================
    -- CHECK 2: Has the event already started? (auto-close registration)
    -- Uses Asia/Kolkata timezone for Amrita University events.
    -- =========================================================================
    IF v_event_date IS NOT NULL THEN
        v_computed_start := v_event_date;

        -- Try to parse start_time for a more accurate check
        IF v_start_time IS NOT NULL AND v_start_time != '' THEN
            BEGIN
                -- Handle "HH:MI AM/PM" format
                IF v_start_time ~* '\d{1,2}:\d{2}\s*(AM|PM)' THEN
                    v_parsed_time := to_timestamp(v_start_time, 'HH12:MI AM')::TIME;
                    v_computed_start := (
                        date_trunc('day', v_event_date AT TIME ZONE 'Asia/Kolkata')
                        + v_parsed_time
                    ) AT TIME ZONE 'Asia/Kolkata';

                -- Handle "HH:MI" 24-hour format
                ELSIF v_start_time ~ '^\d{1,2}:\d{2}$' THEN
                    v_parsed_time := v_start_time::TIME;
                    v_computed_start := (
                        date_trunc('day', v_event_date AT TIME ZONE 'Asia/Kolkata')
                        + v_parsed_time
                    ) AT TIME ZONE 'Asia/Kolkata';
                END IF;
            EXCEPTION WHEN OTHERS THEN
                -- If time parsing fails, fall back to using the event_date as-is
                v_computed_start := v_event_date;
            END;
        END IF;

        IF v_computed_start <= NOW() THEN
            -- Auto-close registration in the database so real-time subscribers get notified
            UPDATE public.events
            SET    registration_status = 'closed'
            WHERE  id = NEW.event_id
              AND  registration_status != 'closed';

            RAISE EXCEPTION 'EVENT_STARTED: Event has already started, registration is closed';
        END IF;
    END IF;

    -- =========================================================================
    -- CHECK 3: Has the event reached its max_registrations?
    -- The advisory lock ensures only ONE insert is evaluated at a time,
    -- so the COUNT(*) is always accurate.
    -- =========================================================================
    IF v_max_reg IS NOT NULL THEN
        SELECT COUNT(*) INTO v_current_count
        FROM   public.registrations
        WHERE  event_id = NEW.event_id;

        IF v_current_count >= v_max_reg THEN
            -- Auto-close registration so real-time subscribers get notified
            UPDATE public.events
            SET    registration_status = 'closed'
            WHERE  id = NEW.event_id
              AND  registration_status != 'closed';

            RAISE EXCEPTION 'EVENT_FULL: Registration limit reached (% / %)', v_current_count, v_max_reg;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Attach the trigger (drop first to avoid duplicates)
DROP TRIGGER IF EXISTS enforce_registration_limit ON public.registrations;

CREATE TRIGGER enforce_registration_limit
    BEFORE INSERT ON public.registrations
    FOR EACH ROW
    EXECUTE FUNCTION public.check_registration_limit();


-- =============================================================================
-- VERIFICATION: Run these queries to confirm everything was created
-- =============================================================================
-- SELECT * FROM pg_constraint WHERE conname = 'registrations_event_user_unique';
-- SELECT * FROM pg_trigger WHERE tgname = 'enforce_registration_limit';
-- SELECT * FROM pg_proc WHERE proname = 'check_registration_limit';
