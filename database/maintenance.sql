-- ===================================================================
-- TeamBeam Database Maintenance Script
-- ===================================================================
-- This script contains maintenance operations that cannot be run
-- inside transaction blocks. Run these manually as needed.
-- ===================================================================

-- Database vacuum and analyze operations
-- Note: These commands must be run outside of transaction blocks

-- Full vacuum analyze (reclaims space and updates statistics)
\echo 'Running VACUUM ANALYZE...'
VACUUM ANALYZE;

-- Analyze specific tables for better query planning
\echo 'Analyzing core tables...'
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

-- Reindex operations (if needed for performance)
\echo 'Database maintenance completed.'

-- ===================================================================
-- USAGE INSTRUCTIONS
-- ===================================================================
-- 
-- To run this maintenance script:
-- 1. Connect to your database using psql or your preferred client
-- 2. Ensure no long-running transactions are active
-- 3. Run: \i maintenance.sql
-- 
-- Recommended frequency:
-- - VACUUM ANALYZE: Weekly or after large data changes
-- - ANALYZE only: Daily for high-activity tables
-- 
-- ===================================================================