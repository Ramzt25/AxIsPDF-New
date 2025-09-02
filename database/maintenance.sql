-- ===================================================================
-- TeamBeam Database Maintenance Script
-- ===================================================================
-- This script contains maintenance operations that cannot be run
-- inside transaction blocks. Run these manually as needed.
-- ===================================================================

-- Database vacuum and analyze operations
-- Note: These commands must be run outside of transaction blocks

-- Full vacuum analyze (reclaims space and updates statistics)
DO $$ BEGIN
    RAISE NOTICE 'Running VACUUM ANALYZE...';
END $$;
VACUUM ANALYZE;

-- Analyze specific tables for better query planning
DO $$ BEGIN
    RAISE NOTICE 'Analyzing core tables...';
END $$;
ANALYZE organizations;
ANALYZE users;
ANALYZE projects;
ANALYZE documents;
ANALYZE markups;
ANALYZE tasks;
ANALYZE issues;
ANALYZE rfis;
ANALYZE meetings;
ANALYZE chat_messages;

-- Completion message
DO $$ BEGIN
    RAISE NOTICE 'Database maintenance completed successfully.';
END $$;

-- ===================================================================
-- USAGE INSTRUCTIONS
-- ===================================================================
-- 
-- To run this maintenance script:
-- 1. Connect to your database using any SQL client
-- 2. Ensure no long-running transactions are active
-- 3. Execute this entire script (or run commands individually)
-- 
-- For psql users, you can also use: \i maintenance.sql
-- For Supabase users: Copy and paste into SQL Editor
-- 
-- Recommended frequency:
-- - VACUUM ANALYZE: Weekly or after large data changes
-- - ANALYZE only: Daily for high-activity tables
-- 
-- Note: VACUUM operations must be run outside of transaction blocks
-- If using a client that auto-wraps in transactions, run commands individually
-- 
-- ===================================================================