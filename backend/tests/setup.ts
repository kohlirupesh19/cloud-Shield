// Test env bootstrap - must run before any src import that does top-level env validation
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/cloudshield_test';
process.env.REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test_access_secret_which_is_at_least_32_chars_long';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret_which_is_at_least_32_chars_long';
process.env.AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://localhost:8000';
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
process.env.MAX_UPLOAD_MB = process.env.MAX_UPLOAD_MB || '1024';
process.env.DEFAULT_TENANT_SLUG = process.env.DEFAULT_TENANT_SLUG || 'default-org';
process.env.SWAGGER_ENABLED = 'false';
