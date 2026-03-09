-- Custom migration to delete all walls with non-null wall names because they were created incorrectly
DELETE FROM "Wall" WHERE name IS NOT NULL;