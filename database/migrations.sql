-- ===================================================================
-- TeamBeam Database Migration Script
-- ===================================================================
-- This script provides incremental migration capabilities for the
-- TeamBeam database schema. Use this for updating existing databases.
-- ===================================================================

-- Migration version tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    description TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if this migration has already been applied
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '2025.09.02.001') THEN
        -- Insert migration record
        INSERT INTO schema_migrations (version, description) 
        VALUES ('2025.09.02.001', 'Initial comprehensive schema deployment');
        
        -- Enable extensions if not already enabled
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        CREATE EXTENSION IF NOT EXISTS "postgis";
        CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
        CREATE EXTENSION IF NOT EXISTS "pg_trgm";
        CREATE EXTENSION IF NOT EXISTS "btree_gin";
        
        RAISE NOTICE 'Migration 2025.09.02.001 - Initial schema - Applied successfully';
    ELSE
        RAISE NOTICE 'Migration 2025.09.02.001 already applied, skipping';
    END IF;
END
$$;

-- Future migrations can be added here following the same pattern:

-- Example future migration:
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version = '2025.09.02.002') THEN
--         INSERT INTO schema_migrations (version, description) 
--         VALUES ('2025.09.02.002', 'Add new feature XYZ');
--         
--         -- Migration SQL here
--         -- ALTER TABLE users ADD COLUMN new_field TEXT;
--         
--         RAISE NOTICE 'Migration 2025.09.02.002 - New feature XYZ - Applied successfully';
--     ELSE
--         RAISE NOTICE 'Migration 2025.09.02.002 already applied, skipping';
--     END IF;
-- END
-- $$;