#!/usr/bin/env python3
"""
Test script to verify Supabase HTTP API connection
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_connection():
    """Test connection to Supabase via HTTP API"""
    
    # Get credentials from .env
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials in .env file")
        return False
    
    try:
        print(f"🔗 Connecting to Supabase at: {supabase_url}")
        print(f"🔑 Using anon key: {supabase_key[:20]}...")
        
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Test basic connection by getting user info (this will fail for anonymous users, but connection works)
        print("✅ Supabase client created successfully!")
        
        # Test a simple query to see if we can access the database
        try:
            # Try to get some basic info (this should work even for anonymous users)
            response = supabase.table('_dummy_table_').select('*').limit(1).execute()
            print("❌ Unexpected: Got response from dummy table")
        except Exception as e:
            error_str = str(e)
            if "relation" in error_str.lower() or "does not exist" in error_str.lower() or "could not find the table" in error_str.lower():
                print("✅ Database connection successful! (Got expected error for non-existent table)")
                return True
            else:
                print(f"❌ Unexpected error: {e}")
                return False
                
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Supabase HTTP API Connection...")
    print("=" * 50)
    
    success = test_supabase_connection()
    
    print("=" * 50)
    if success:
        print("🎉 Supabase HTTP API connection successful!")
        print("✅ You can now use Supabase with your Django app!")
        print("🚀 Next step: Create database tables using Django migrations!")
    else:
        print("❌ Supabase HTTP API connection failed!")
        print("🔍 Check your .env file and credentials")
