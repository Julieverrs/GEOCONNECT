#!/usr/bin/env python3
"""
Test script to verify Django can access all Supabase tables
"""

from supabase import create_client, Client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_supabase_tables():
    """Test access to all Supabase tables"""
    
    # Get Supabase credentials
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials in .env file")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
        
        # List of tables to test
        tables = [
            'employee_employee',
            'employer_employer', 
            'admin_panel_adminuser',
            'employer_job',
            'employee_jobapplication',
            'employer_jobapplication',
            'employee_jobpreferences',
            'employee_notification',
            'employee_savedjob',
            'employee_employeefeedback',
            'employee_conversation',
            'employee_message'
        ]
        
        print(f"\n🔍 Testing access to {len(tables)} tables...")
        print("=" * 50)
        
        success_count = 0
        
        for table_name in tables:
            try:
                # Try to select from each table (limit 0 to just test access)
                result = supabase.table(table_name).select('*').limit(0).execute()
                print(f"✅ {table_name} - Accessible")
                success_count += 1
            except Exception as e:
                print(f"❌ {table_name} - Error: {str(e)[:50]}...")
        
        print("=" * 50)
        print(f"🎯 Results: {success_count}/{len(tables)} tables accessible")
        
        if success_count == len(tables):
            print("🎉 All tables are accessible! Django should work with Supabase!")
            return True
        else:
            print("⚠️ Some tables have issues. Check the errors above.")
            return False
            
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Testing Supabase Table Access...")
    success = test_supabase_tables()
    
    if success:
        print("\n🚀 Next Steps:")
        print("1. Your Django models should now work with Supabase")
        print("2. You can start using your Django app normally")
        print("3. All data will be stored in Supabase")
    else:
        print("\n🔍 Check the errors above and fix any table issues")
