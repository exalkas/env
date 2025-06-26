-- Dynamic INSERT Statement Generator
-- This script automatically detects column names and generates INSERT statements
-- Run this for each table you want to export

-- First, let's create a function to generate INSERT statements for any table
CREATE OR REPLACE FUNCTION generate_insert_statements(table_name TEXT) 
RETURNS TABLE(insert_sql TEXT) 
LANGUAGE plpgsql AS $$
DECLARE
    col_names TEXT;
    sql_query TEXT;
BEGIN
    -- Get column names for the table
    SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
    INTO col_names
    FROM information_schema.columns 
    WHERE table_name = generate_insert_statements.table_name 
      AND table_schema = 'public';
    
    -- Build dynamic SQL to generate INSERT statements
    sql_query := format('
        SELECT ''INSERT INTO %I (%s) VALUES ('' ||
        string_agg(
            CASE 
                WHEN value IS NULL THEN ''NULL''
                WHEN value ~ ''^-?\d+(\.\d+)?$'' THEN value
                ELSE '''''''''' || replace(value, '''''''', '''''''''''') || ''''''''
            END, 
            '', ''
        ) || '');'' as insert_sql
        FROM (
            SELECT %s
            FROM %I
        ) t
        CROSS JOIN LATERAL (
            VALUES %s
        ) v(value)
        GROUP BY %s
        ORDER BY %s',
        table_name,
        col_names,
        string_agg('t.' || column_name || '::text', ', ' ORDER BY ordinal_position),
        table_name,
        string_agg('(t.' || column_name || '::text)', ', ' ORDER BY ordinal_position),
        string_agg('t.' || column_name, ', ' ORDER BY ordinal_position),
        (SELECT column_name FROM information_schema.columns 
         WHERE table_name = generate_insert_statements.table_name 
           AND table_schema = 'public' 
         ORDER BY ordinal_position LIMIT 1)
    )
    FROM information_schema.columns 
    WHERE table_name = generate_insert_statements.table_name 
      AND table_schema = 'public';
    
    -- Execute the dynamic SQL
    RETURN QUERY EXECUTE sql_query;
END $$;

-- Simple approach: Generate INSERT statements for each table individually
-- Copy and run these one at a time:

-- Generate INSERT statements for USERS table
SELECT 'INSERT INTO users VALUES (' ||
    string_agg(
        CASE 
            WHEN value IS NULL THEN 'NULL'
            WHEN value ~ '^-?\d+(\.\d+)?$' THEN value  -- Numbers
            WHEN value ~ '^(true|false)$' THEN value   -- Booleans
            ELSE '''' || replace(value, '''', '''''') || ''''  -- Strings
        END,
        ', '
    ) || ');' as insert_statement
FROM (
    SELECT 
        row_number() OVER (ORDER BY id) as row_num,
        id::text, email::text, hashed_password::text, full_name::text, 
        is_active::text, is_admin::text, kyc_verified::text, 
        subscription_type::text, subscription_end_date::text,
        created_at::text, updated_at::text, role_id::text, is_super_admin::text
    FROM users
) t
CROSS JOIN LATERAL (
    VALUES (id), (email), (hashed_password), (full_name), (is_active), 
           (is_admin), (kyc_verified), (subscription_type), (subscription_end_date),
           (created_at), (updated_at), (role_id), (is_super_admin)
) v(value)
GROUP BY row_num
ORDER BY row_num;

-- Generate INSERT statements for ROLES table
SELECT 'INSERT INTO roles VALUES (' ||
    string_agg(
        CASE 
            WHEN value IS NULL THEN 'NULL'
            WHEN value ~ '^-?\d+(\.\d+)?$' THEN value
            WHEN value ~ '^(true|false)$' THEN value
            ELSE '''' || replace(value, '''', '''''') || ''''
        END,
        ', '
    ) || ');' as insert_statement
FROM (
    SELECT 
        row_number() OVER (ORDER BY id) as row_num,
        id::text, name::text, display_name::text, description::text,
        level::text, is_active::text, created_at::text, updated_at::text
    FROM roles
) t
CROSS JOIN LATERAL (
    VALUES (id), (name), (display_name), (description), (level), (is_active), (created_at), (updated_at)
) v(value)
GROUP BY row_num
ORDER BY row_num;

-- Generate INSERT statements for NEWS_CATEGORIES table
SELECT 'INSERT INTO news_categories VALUES (' ||
    string_agg(
        CASE 
            WHEN value IS NULL THEN 'NULL'
            WHEN value ~ '^-?\d+(\.\d+)?$' THEN value
            WHEN value ~ '^(true|false)$' THEN value
            ELSE '''' || replace(value, '''', '''''') || ''''
        END,
        ', '
    ) || ');' as insert_statement
FROM (
    SELECT 
        row_number() OVER (ORDER BY id) as row_num,
        id::text, name::text, display_name::text, description::text,
        is_active::text, created_at::text, updated_at::text, created_by::text
    FROM news_categories
) t
CROSS JOIN LATERAL (
    VALUES (id), (name), (display_name), (description), (is_active), (created_at), (updated_at), (created_by)
) v(value)
GROUP BY row_num
ORDER BY row_num;

-- Generate INSERT statements for NEWS table
SELECT 'INSERT INTO news VALUES (' ||
    string_agg(
        CASE 
            WHEN value IS NULL THEN 'NULL'
            WHEN value ~ '^-?\d+(\.\d+)?$' THEN value
            WHEN value ~ '^(true|false)$' THEN value
            ELSE '''' || replace(value, '''', '''''') || ''''
        END,
        ', '
    ) || ');' as insert_statement
FROM (
    SELECT 
        row_number() OVER (ORDER BY id) as row_num,
        id::text, title::text, summary::text, content::text, category::text,
        tags::text, author::text, source_url::text, image_url::text,
        is_featured::text, is_published::text, published_at::text,
        created_at::text, updated_at::text, created_by::text, scheduled_publish_at::text
    FROM news
) t
CROSS JOIN LATERAL (
    VALUES (id), (title), (summary), (content), (category), (tags), (author), 
           (source_url), (image_url), (is_featured), (is_published), (published_at),
           (created_at), (updated_at), (created_by), (scheduled_publish_at)
) v(value)
GROUP BY row_num
ORDER BY row_num;

-- Add more tables as needed following the same pattern...
-- For any other table, just copy the pattern and adjust the column names

-- Clean up the function when done
-- DROP FUNCTION IF EXISTS generate_insert_statements(TEXT); 