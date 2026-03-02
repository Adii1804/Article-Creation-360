-- Migration: Add extraction_results_flat table
-- Created: 2026-02-12
-- Purpose: Create denormalized flat table for fast querying and Excel export
-- Safe: No data loss, only adds new table

-- Create extraction_results_flat table
CREATE TABLE IF NOT EXISTS "extraction_results_flat" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "job_id" TEXT NOT NULL UNIQUE,
  
  -- Essential Metadata
  "image_name" VARCHAR(255),
  "image_url" TEXT,
  "article_number" VARCHAR(100),
  "category_code" VARCHAR(100),
  "category_name" VARCHAR(200),
  "department_name" VARCHAR(200),
  "sub_department_name" VARCHAR(200),
  "extraction_status" VARCHAR(50),
  "ai_model" VARCHAR(100),
  "avg_confidence" DECIMAL(5, 2),
  "processing_time_ms" INTEGER,
  "total_attributes" INTEGER,
  "extracted_count" INTEGER,
  
  -- Token Usage & Cost Tracking
  "input_tokens" INTEGER,
  "output_tokens" INTEGER,
  "total_tokens" INTEGER,
  "api_cost" DECIMAL(10, 6),
  
  -- User Info
  "user_id" INTEGER,
  "user_name" VARCHAR(200),
  
  -- Timestamps (Date only)
  "extraction_date" DATE,
  "created_at" DATE NOT NULL DEFAULT CURRENT_DATE,
  "updated_at" DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Extracted Attributes (41 columns)
  "major_category" VARCHAR(200),
  "vendor_name" VARCHAR(200),
  "design_number" VARCHAR(100),
  "ppt_number" VARCHAR(100),
  "rate" DECIMAL(10, 2),
  "size" VARCHAR(50),
  "yarn_1" VARCHAR(100),
  "yarn_2" VARCHAR(100),
  "fabric_main_mvgr" VARCHAR(100),
  "weave" VARCHAR(100),
  "composition" VARCHAR(200),
  "finish" VARCHAR(100),
  "gsm" VARCHAR(50),
  "shade" VARCHAR(100),
  "lycra" VARCHAR(50),
  "neck" VARCHAR(100),
  "neck_details" VARCHAR(200),
  "collar" VARCHAR(100),
  "placket" VARCHAR(100),
  "sleeve" VARCHAR(100),
  "bottom_fold" VARCHAR(100),
  "front_open_style" VARCHAR(100),
  "pocket_type" VARCHAR(100),
  "fit" VARCHAR(100),
  "pattern" VARCHAR(100),
  "length" VARCHAR(100),
  "colour" VARCHAR(100),
  "drawcord" VARCHAR(100),
  "button" VARCHAR(100),
  "zipper" VARCHAR(100),
  "zip_colour" VARCHAR(100),
  "print_type" VARCHAR(100),
  "print_style" VARCHAR(100),
  "print_placement" VARCHAR(100),
  "patches" VARCHAR(100),
  "patches_type" VARCHAR(100),
  "embroidery" VARCHAR(100),
  "embroidery_type" VARCHAR(100),
  "wash" VARCHAR(100),
  "father_belt" VARCHAR(100),
  "child_belt" VARCHAR(100),
  
  -- Missing Attributes (3 columns)
  "division" VARCHAR(100),
  "reference_article_number" VARCHAR(100),
  "reference_article_description" TEXT,
  
  -- Foreign Key
  CONSTRAINT "extraction_results_flat_job_id_fkey" 
    FOREIGN KEY ("job_id") 
    REFERENCES "extraction_jobs"("id") 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
);

-- Create indexes for fast querying
CREATE INDEX IF NOT EXISTS "extraction_results_flat_job_id_idx" ON "extraction_results_flat"("job_id");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_image_name_idx" ON "extraction_results_flat"("image_name");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_article_number_idx" ON "extraction_results_flat"("article_number");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_major_category_idx" ON "extraction_results_flat"("major_category");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_category_code_idx" ON "extraction_results_flat"("category_code");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_department_name_idx" ON "extraction_results_flat"("department_name");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_extraction_status_idx" ON "extraction_results_flat"("extraction_status");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_user_id_idx" ON "extraction_results_flat"("user_id");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_extraction_date_idx" ON "extraction_results_flat"("extraction_date");
CREATE INDEX IF NOT EXISTS "extraction_results_flat_created_at_idx" ON "extraction_results_flat"("created_at");

-- Verify table was created
SELECT 
  'extraction_results_flat table created successfully' AS status,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_name = 'extraction_results_flat';
