-- Export Database Structure Script
-- Run this in pgAdmin Query Tool or psql to generate CREATE TABLE statements
-- Copy the output and save it as create_tables.sql

-- Generate CREATE TABLE statements for all tables
SELECT 
    'CREATE TABLE ' || schemaname || '.' || tablename || ' (' || CHR(10) ||
    string_agg(
        '    ' || column_name || ' ' || data_type || 
        CASE 
            WHEN character_maximum_length IS NOT NULL 
            THEN '(' || character_maximum_length || ')'
            WHEN numeric_precision IS NOT NULL AND numeric_scale IS NOT NULL
            THEN '(' || numeric_precision || ',' || numeric_scale || ')'
            ELSE ''
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        ',' || CHR(10)
    ) || CHR(10) || ');' || CHR(10) || CHR(10) as create_statement
FROM (
    SELECT 
        t.schemaname,
        t.tablename,
        c.column_name,
        c.data_type,
        c.character_maximum_length,
        c.numeric_precision,
        c.numeric_scale,
        c.is_nullable,
        c.column_default,
        c.ordinal_position
    FROM pg_tables t
    JOIN information_schema.columns c ON t.tablename = c.table_name
    WHERE t.schemaname = 'public'
    ORDER BY t.tablename, c.ordinal_position
) AS table_columns
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Generate PRIMARY KEY constraints
SELECT 
    'ALTER TABLE ' || schemaname || '.' || tablename || 
    ' ADD CONSTRAINT ' || constraint_name || 
    ' PRIMARY KEY (' || string_agg(column_name, ', ') || ');' as pk_statement
FROM (
    SELECT 
        tc.table_schema AS schemaname,
        tc.table_name AS tablename,
        tc.constraint_name,
        kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' 
        AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position
) AS pk_info
GROUP BY schemaname, tablename, constraint_name
ORDER BY tablename;

-- Generate FOREIGN KEY constraints
SELECT 
    'ALTER TABLE ' || tc.table_schema || '.' || tc.table_name ||
    ' ADD CONSTRAINT ' || tc.constraint_name ||
    ' FOREIGN KEY (' || kcu.column_name || ')' ||
    ' REFERENCES ' || ccu.table_schema || '.' || ccu.table_name ||
    ' (' || ccu.column_name || ');' as fk_statement
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- Generate CREATE INDEX statements
SELECT 
    'CREATE INDEX ' || indexname || ' ON ' || schemaname || '.' || tablename || ' (' || 
    string_agg(column_name, ', ') || ');' as index_statement
FROM (
    SELECT 
        schemaname,
        tablename,
        indexname,
        unnest(string_to_array(replace(replace(indexdef, indexname || ' ON ' || schemaname || '.' || tablename || ' (', ''), ')', ''), ', ')) as column_name
    FROM pg_indexes 
    WHERE schemaname = 'public'
        AND indexname NOT LIKE '%_pkey'  -- Exclude primary key indexes
) AS index_info
GROUP BY schemaname, tablename, indexname
ORDER BY tablename, indexname; 