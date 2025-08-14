# Supabase Setup Guide for Django

## 1. Get Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Go to Settings > Database to get your connection details

## 2. Update Environment Variables

Create a `.env` file in your project root with:

```bash
# Supabase Database Configuration
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your_supabase_db_password
DB_HOST=your_project_ref.supabase.co
DB_PORT=5432

# Django Settings
SECRET_KEY=your_django_secret_key
DEBUG=True

# Supabase URL and API Key (for future use)
SUPABASE_URL=https://your_project_ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 3. Install Required Packages

```bash
pip install psycopg2-binary
pip install python-dotenv
```

## 4. Update Django Settings

Your current settings.py already supports environment variables, so no changes needed!

## 5. Test Connection

Run your Django server to test the connection:

```bash
python manage.py runserver
```

## 6. Run Migrations

```bash
python manage.py migrate
```

## Benefits of Using Supabase:

- **Managed PostgreSQL**: No need to manage your own database
- **Real-time subscriptions**: Built-in real-time capabilities
- **Authentication**: Built-in user management
- **Storage**: File storage for your media files
- **Edge Functions**: Serverless functions
- **Dashboard**: Easy database management interface

## Important Notes:

- Supabase uses PostgreSQL 15+
- Your existing Django models will work without changes
- You can use Supabase's built-in auth alongside Django's auth
- Consider using Supabase's storage for media files instead of local storage
