-- ===================================================================
-- TeamBeam Database Maintenance Script - Safe Mode
-- ===================================================================
-- This version uses individual statements that can be run safely
-- in any SQL client, including those that auto-wrap in transactions.
-- ===================================================================

-- Step 1: Analyze tables (safe to run in transactions)
-- =====================================================

-- Update table statistics for better query planning
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
ANALYZE notifications;
ANALYZE activity_logs;
ANALYZE collaboration_sessions;
ANALYZE ai_analyses;

-- Step 2: VACUUM operations (run these individually, outside transactions)
-- =======================================================================
-- 
-- Copy and paste these commands ONE AT A TIME in your SQL client:
-- 
-- VACUUM ANALYZE organizations;
-- VACUUM ANALYZE users;
-- VACUUM ANALYZE projects;
-- VACUUM ANALYZE documents;
-- VACUUM ANALYZE markups;
-- VACUUM ANALYZE tasks;
-- VACUUM ANALYZE issues;
-- VACUUM ANALYZE rfis;
-- VACUUM ANALYZE meetings;
-- VACUUM ANALYZE chat_messages;
-- VACUUM ANALYZE notifications;
-- VACUUM ANALYZE activity_logs;
-- VACUUM ANALYZE collaboration_sessions;
-- VACUUM ANALYZE ai_analyses;
-- 
-- Or run a full database vacuum:
-- VACUUM ANALYZE;

-- ===================================================================
-- USAGE INSTRUCTIONS
-- ===================================================================
-- 
-- For Supabase SQL Editor:
-- 1. Run the ANALYZE statements above (they execute safely)
-- 2. For VACUUM operations, run each VACUUM command individually
-- 
-- For psql or direct database connections:
-- 1. Run all ANALYZE statements together
-- 2. Run VACUUM commands outside of any transaction block
-- 
-- For automated maintenance:
-- 1. Use a cron job or scheduled task
-- 2. Connect directly to database (not through connection pooler)
-- 3. Run VACUUM operations during low-traffic periods
-- 
-- ===================================================================