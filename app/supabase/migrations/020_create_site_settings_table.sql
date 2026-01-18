-- Migration: Create Site Settings Table
-- Version: 020
-- Description: Create site_settings table for centralized configuration management
-- Date: 2025-10-29

BEGIN;

-- ============================================
-- CREATE SITE_SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS site_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) NOT NULL, -- 'text', 'number', 'boolean', 'json', 'email'
    category VARCHAR(50) NOT NULL, -- 'shipping', 'payment', 'general', 'email', 'social'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- If true, can be read by public (e.g., for frontend)
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_site_settings_key ON site_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_site_settings_category ON site_settings(category);
CREATE INDEX IF NOT EXISTS idx_site_settings_is_public ON site_settings(is_public);

-- ============================================
-- ADD COMMENTS
-- ============================================

COMMENT ON TABLE site_settings IS 'Centralized site configuration and settings';
COMMENT ON COLUMN site_settings.setting_key IS 'Unique key for the setting (e.g., shipping_flat_rate)';
COMMENT ON COLUMN site_settings.setting_value IS 'JSONB value allowing flexible data types';
COMMENT ON COLUMN site_settings.setting_type IS 'Data type: text, number, boolean, json, email';
COMMENT ON COLUMN site_settings.category IS 'Setting category for organization';
COMMENT ON COLUMN site_settings.is_public IS 'If true, setting can be read by unauthenticated users';

-- ============================================
-- ADD TRIGGERS
-- ============================================

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_site_settings_updated_at 
    BEFORE UPDATE ON site_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Public can read public settings
CREATE POLICY "Public read public settings" 
    ON site_settings FOR SELECT 
    USING (is_public = true);

-- Authenticated users (admins) can do everything
CREATE POLICY "Admins manage settings" 
    ON site_settings FOR ALL 
    USING (auth.role() = 'authenticated');

-- ============================================
-- HELPER FUNCTION: Get setting value
-- ============================================

CREATE OR REPLACE FUNCTION get_setting(
    key VARCHAR(100),
    default_value JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT setting_value INTO result
    FROM site_settings
    WHERE setting_key = key;
    
    IF NOT FOUND THEN
        RETURN default_value;
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_setting IS 'Retrieves a setting value by key, returns default if not found';

-- ============================================
-- HELPER FUNCTION: Set setting value
-- ============================================

CREATE OR REPLACE FUNCTION set_setting(
    key VARCHAR(100),
    value JSONB,
    type VARCHAR(50) DEFAULT 'json',
    category_name VARCHAR(50) DEFAULT 'general',
    description_text TEXT DEFAULT NULL,
    public BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO site_settings (setting_key, setting_value, setting_type, category, description, is_public)
    VALUES (key, value, type, category_name, description_text, public)
    ON CONFLICT (setting_key) 
    DO UPDATE SET 
        setting_value = EXCLUDED.setting_value,
        setting_type = EXCLUDED.setting_type,
        category = EXCLUDED.category,
        description = EXCLUDED.description,
        is_public = EXCLUDED.is_public,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_setting IS 'Inserts or updates a setting value';

-- ============================================
-- HELPER VIEW: Settings by category
-- ============================================

CREATE OR REPLACE VIEW v_settings_by_category AS
SELECT 
    category,
    setting_key,
    setting_value,
    setting_type,
    description,
    is_public,
    updated_at
FROM site_settings
ORDER BY category, setting_key;

COMMENT ON VIEW v_settings_by_category IS 'Settings organized by category for easy browsing';

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check table exists
-- SELECT * FROM site_settings LIMIT 1;

-- Check indexes
-- SELECT indexname FROM pg_indexes WHERE tablename = 'site_settings';

-- Test helper functions
-- SELECT get_setting('shipping_flat_rate', '{"value": 0}'::JSONB);
-- SELECT set_setting('test_key', '{"value": "test"}'::JSONB, 'json', 'general', 'Test setting', true);

