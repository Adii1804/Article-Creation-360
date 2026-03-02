-- ============================================================
-- SAFE MIGRATION: Add 10 new business columns to
--                 extraction_results_flat table
--
-- PostgreSQL compatible. Uses IF NOT EXISTS so it is safe to
-- run multiple times without error or data loss.
-- NO rows are deleted or modified.
-- ============================================================

-- 1. Vendor Code  (SAP vendor code, separate from vendor name)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(100) DEFAULT NULL;

-- 2. MRP  (Maximum Retail Price - strictly numeric)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS mrp DECIMAL(10, 2) DEFAULT NULL;

-- 3. MC Code  (Merchandise Category code)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS mc_code VARCHAR(100) DEFAULT NULL;

-- 4. Segment  (e.g. PREMIUM, VALUE, ECONOMY)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS segment VARCHAR(100) DEFAULT NULL;

-- 5. Season  (e.g. SS24, AW25)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS season VARCHAR(100) DEFAULT NULL;

-- 6. HSN Tax Code
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS hsn_tax_code VARCHAR(100) DEFAULT NULL;

-- 7. Article Description  (free-form text)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS article_description TEXT DEFAULT NULL;

-- 8. Fashion Grid  (e.g. BASIC, FASHION, TREND)
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS fashion_grid VARCHAR(100) DEFAULT NULL;

-- 9. Year  (e.g. "2024-25")
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS year VARCHAR(20) DEFAULT NULL;

-- 10. Article Type
ALTER TABLE extraction_results_flat
  ADD COLUMN IF NOT EXISTS article_type VARCHAR(100) DEFAULT NULL;

-- ============================================================
-- Verify: confirm the new columns exist
-- ============================================================
SELECT column_name, data_type, character_maximum_length, is_nullable
FROM information_schema.columns
WHERE table_name = 'extraction_results_flat'
  AND column_name IN (
    'vendor_code', 'mrp', 'mc_code', 'segment', 'season',
    'hsn_tax_code', 'article_description', 'fashion_grid',
    'year', 'article_type'
  )
ORDER BY ordinal_position;
