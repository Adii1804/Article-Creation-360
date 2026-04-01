-- ============================================================
-- MIGRATION: Update NECK attribute HOOD shortForm from HUD to HD
--
-- Changes shortForm 'HUD' -> 'HD' in attribute_allowed_values
-- only for the NECK attribute (key = 'NECK'), fullForm = 'HOOD'.
-- Safe to re-run (uses DO block with existence check).
-- ============================================================

DO $$
DECLARE
  v_attribute_id INT;
BEGIN
  -- Get the id for the NECK attribute
  SELECT id INTO v_attribute_id
  FROM master_attributes
  WHERE key = 'NECK'
  LIMIT 1;

  IF v_attribute_id IS NULL THEN
    RAISE NOTICE 'NECK attribute not found — skipping.';
    RETURN;
  END IF;

  -- Only update if HUD still exists (idempotent)
  IF EXISTS (
    SELECT 1 FROM attribute_allowed_values
    WHERE attribute_id = v_attribute_id
      AND short_form = 'HUD'
      AND full_form  = 'HOOD'
  ) THEN
    UPDATE attribute_allowed_values
    SET short_form = 'HD'
    WHERE attribute_id = v_attribute_id
      AND short_form   = 'HUD'
      AND full_form    = 'HOOD';

    RAISE NOTICE 'Updated HOOD short_form from HUD to HD for NECK attribute (id = %).', v_attribute_id;
  ELSE
    RAISE NOTICE 'HUD not found for NECK HOOD — already migrated or does not exist. No changes made.';
  END IF;
END;
$$;
