-- Fix products that have category/subcategory stored as UUIDs instead of names
-- This happens when the product form was saving category IDs instead of names

-- Update category field: replace UUIDs with category names
UPDATE products
SET category = categories.name
FROM categories
WHERE products.category::text = categories.id::text
  AND products.category IS NOT NULL
  AND products.deleted_at IS NULL;

-- Update subcategory field: replace UUIDs with category names  
UPDATE products
SET subcategory = categories.name
FROM categories
WHERE products.subcategory::text = categories.id::text
  AND products.subcategory IS NOT NULL
  AND products.deleted_at IS NULL;

-- Add comment to document this fix
COMMENT ON COLUMN products.category IS 'Category name (string), not a foreign key to categories table';
COMMENT ON COLUMN products.subcategory IS 'Subcategory name (string), not a foreign key to categories table';
