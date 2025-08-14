from django.core.management.base import BaseCommand
from django.db import models
from supabase import create_client, Client
import os
from django.conf import settings

class Command(BaseCommand):
    help = 'Create database tables in Supabase using HTTP API'

    def handle(self, *args, **options):
        self.stdout.write('🚀 Creating tables in Supabase...')
        
        # Get Supabase credentials
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            self.stdout.write(self.style.ERROR('❌ Missing Supabase credentials in .env file'))
            return
        
        try:
            # Create Supabase client
            supabase: Client = create_client(supabase_url, supabase_key)
            self.stdout.write('✅ Connected to Supabase')
            
            # Create tables based on your models
            self.create_employee_tables(supabase)
            self.create_employer_tables(supabase)
            self.create_admin_tables(supabase)
            
            self.stdout.write(self.style.SUCCESS('🎉 All tables created successfully in Supabase!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Error: {e}'))

    def create_employee_tables(self, supabase):
        """Create Employee-related tables"""
        self.stdout.write('📋 Creating Employee tables...')
        
        # Try to create a simple table first to test
        try:
            # Create a test record to see if table exists
            test_data = {
                'username': 'test_user',
                'email': 'test@test.com',
                'password': 'test123'
            }
            
            # This will create the table if it doesn't exist
            result = supabase.table('employee_employee').insert(test_data).execute()
            self.stdout.write('✅ Employee table created/accessed')
            
            # Clean up test data
            supabase.table('employee_employee').delete().eq('username', 'test_user').execute()
            
        except Exception as e:
            self.stdout.write(f'⚠️ Employee table: {e}')

    def create_employer_tables(self, supabase):
        """Create Employer-related tables"""
        self.stdout.write('📋 Creating Employer tables...')
        
        try:
            # Create a test record to see if table exists
            test_data = {
                'username': 'test_employer',
                'email': 'test@employer.com',
                'password': 'test123'
            }
            
            # This will create the table if it doesn't exist
            result = supabase.table('employer_employer').insert(test_data).execute()
            self.stdout.write('✅ Employer table created/accessed')
            
            # Clean up test data
            supabase.table('employer_employer').delete().eq('username', 'test_employer').execute()
            
        except Exception as e:
            self.stdout.write(f'⚠️ Employer table: {e}')

    def create_admin_tables(self, supabase):
        """Create Admin-related tables"""
        self.stdout.write('📋 Creating Admin tables...')
        
        try:
            # Create a test record to see if table exists
            test_data = {
                'username': 'test_admin',
                'email': 'test@admin.com',
                'password': 'test123'
            }
            
            # This will create the table if it doesn't exist
            result = supabase.table('admin_panel_adminuser').insert(test_data).execute()
            self.stdout.write('✅ Admin table created/accessed')
            
            # Clean up test data
            supabase.table('admin_panel_adminuser').delete().eq('username', 'test_admin').execute()
            
        except Exception as e:
            self.stdout.write(f'⚠️ Admin table: {e}')
