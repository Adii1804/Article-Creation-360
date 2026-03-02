-- Add detailed token and cost tracking to extraction_jobs table
ALTER TABLE extraction_jobs 
ADD COLUMN IF NOT EXISTS input_tokens INT DEFAULT 0 COMMENT 'Input tokens used in API call',
ADD COLUMN IF NOT EXISTS output_tokens INT DEFAULT 0 COMMENT 'Output tokens used in API call',
ADD COLUMN IF NOT EXISTS api_cost DECIMAL(10, 6) DEFAULT 0 COMMENT 'Cost for this specific extraction in USD',
ADD COLUMN IF NOT EXISTS model_name VARCHAR(100) DEFAULT 'gemini-2.0-flash' COMMENT 'AI model used';

-- Create index for cost tracking queries
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_cost ON extraction_jobs(api_cost, created_at);
CREATE INDEX IF NOT EXISTS idx_extraction_jobs_user_cost ON extraction_jobs(user_id, api_cost);

-- Add comments to existing columns
ALTER TABLE extraction_jobs MODIFY COLUMN processing_time_ms INT COMMENT 'Processing time in milliseconds';

-- Clear existing data to start fresh (as per requirements)
DELETE FROM extraction_results;
DELETE FROM extraction_jobs;

-- Optional: Add a cost summary table for quick analytics
CREATE TABLE IF NOT EXISTS cost_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  total_images INT DEFAULT 0,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost DECIMAL(12, 6) DEFAULT 0,
  date_range_start DATETIME,
  date_range_end DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_cost (user_id),
  INDEX idx_date_range (date_range_start, date_range_end)
) COMMENT 'Cost summary for quick analytics';
