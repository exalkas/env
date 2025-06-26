-- Export Database Data Script
-- Run this in pgAdmin Query Tool or psql to generate INSERT statements
-- Copy the output and save it as insert_data.sql

-- Generate INSERT statements for all tables with data
DO $$
DECLARE
    rec RECORD;
    sql_text TEXT;
    insert_statement TEXT;
BEGIN
    -- Loop through all tables in public schema
    FOR rec IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        ORDER BY tablename
    LOOP
        -- Check if table has data
        EXECUTE 'SELECT COUNT(*) FROM ' || rec.tablename INTO sql_text;
        
        IF sql_text::INTEGER > 0 THEN
            RAISE NOTICE 'Generating INSERT statements for table: %', rec.tablename;
            
            -- Generate INSERT statement for this table
            SELECT 
                'INSERT INTO ' || rec.tablename || ' (' ||
                string_agg(column_name, ', ' ORDER BY ordinal_position) ||
                ') VALUES'
            INTO insert_statement
            FROM information_schema.columns 
            WHERE table_name = rec.tablename 
              AND table_schema = 'public';
            
            RAISE NOTICE '%', insert_statement;
            
            -- Generate the actual INSERT statements with data
            -- Note: This is a template - you'll need to run specific queries for each table
        END IF;
    END LOOP;
END $$;

-- Manual INSERT generation for specific tables
-- Copy and run these one by one:

-- Users table
SELECT 'INSERT INTO users (id, email, hashed_password, full_name, is_active, is_admin, kyc_verified, subscription_type, subscription_end_date, created_at, updated_at, role_id, is_super_admin) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || replace(email, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(hashed_password, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(full_name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE(is_admin::text, 'NULL') || ', ' ||
    COALESCE(kyc_verified::text, 'NULL') || ', ' ||
    COALESCE('''' || replace(subscription_type, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || subscription_end_date::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NULL') || ', ' ||
    COALESCE(role_id::text, 'NULL') || ', ' ||
    COALESCE(is_super_admin::text, 'NULL') ||
    ');' as insert_statement
FROM users
ORDER BY id;

-- Roles table
SELECT 'INSERT INTO roles (id, name, display_name, description, level, is_active, created_at, updated_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || replace(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(display_name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(level::text, 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NULL') ||
    ');' as insert_statement
FROM roles
ORDER BY id;

-- News Categories table
SELECT 'INSERT INTO news_categories (id, name, display_name, description, is_active, created_at, updated_at, created_by) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || replace(name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(display_name, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(description, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(is_active::text, 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NULL') || ', ' ||
    COALESCE(created_by::text, 'NULL') ||
    ');' as insert_statement
FROM news_categories
ORDER BY id;

-- News table
SELECT 'INSERT INTO news (id, title, summary, content, category, tags, author, source_url, image_url, is_featured, is_published, published_at, created_at, updated_at, created_by, scheduled_publish_at) VALUES (' ||
    COALESCE(id::text, 'NULL') || ', ' ||
    COALESCE('''' || replace(title, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(summary, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(content, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(category, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(tags, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(author, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(source_url, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE('''' || replace(image_url, '''', '''''') || '''', 'NULL') || ', ' ||
    COALESCE(is_featured::text, 'NULL') || ', ' ||
    COALESCE(is_published::text, 'NULL') || ', ' ||
    COALESCE('''' || published_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || created_at::text || '''', 'NULL') || ', ' ||
    COALESCE('''' || updated_at::text || '''', 'NULL') || ', ' ||
    COALESCE(created_by::text, 'NULL') || ', ' ||
    COALESCE('''' || scheduled_publish_at::text || '''', 'NULL') ||
    ');' as insert_statement
FROM news
ORDER BY id;

-- Add similar queries for other tables as needed:
-- subscriptions, assets, orders, transactions, learning_paths, modules, lessons, etc.

-- Fix sequences after import
SELECT 'SELECT setval(''' || sequence_name || ''', COALESCE(MAX(id), 1)) FROM ' || table_name || ';' as fix_sequence
FROM (
    SELECT 
        'users' as table_name, 'users_id_seq' as sequence_name
    UNION ALL SELECT 'roles', 'roles_id_seq'
    UNION ALL SELECT 'news', 'news_id_seq'  
    UNION ALL SELECT 'news_categories', 'news_categories_id_seq'
    UNION ALL SELECT 'subscriptions', 'subscriptions_id_seq'
    UNION ALL SELECT 'assets', 'assets_id_seq'
    UNION ALL SELECT 'orders', 'orders_id_seq'
    UNION ALL SELECT 'transactions', 'transactions_id_seq'
) seq_info; 