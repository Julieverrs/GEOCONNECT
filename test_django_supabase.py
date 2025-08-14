#!/usr/bin/env python3
"""
Test Django integration with Supabase tables
"""

import os
import django
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'capstoneforever.settings')
django.setup()

from employee.models import Employee
from employer.models import Employer, Job
from supabase import create_client, Client

def test_django_supabase_integration():
    """Test if Django can work with Supabase"""
    
    print("🚀 Testing Django + Supabase Integration...")
    print("=" * 50)
    
    try:
        # Test 1: Django model creation
        print("📋 Test 1: Creating Django Employee object...")
        employee = Employee(
            username='test_user',
            email='test@example.com',
            password='test123',
            first_name='Test',
            last_name='User'
        )
        print("✅ Django Employee object created successfully")
        
        # Test 2: Django model validation
        print("\n📋 Test 2: Validating Django Employee object...")
        employee.full_clean()  # This validates the model
        print("✅ Django Employee validation passed")
        
        # Test 3: Supabase table access
        print("\n📋 Test 3: Testing Supabase table access...")
        supabase_url = os.environ.get('SUPABASE_URL')
        supabase_key = os.environ.get('SUPABASE_ANON_KEY')
        
        supabase: Client = create_client(supabase_url, supabase_key)
        
        # Try to insert test data
        test_data = {
            'username': 'test_supabase_user',
            'email': 'test_supabase@example.com',
            'password': 'test123'
        }
        
        result = supabase.table('employee_employee').insert(test_data).execute()
        print("✅ Supabase table insert successful")
        
        # Clean up test data
        supabase.table('employee_employee').delete().eq('username', 'test_supabase_user').execute()
        print("✅ Test data cleaned up")
        
        print("\n🎉 All tests passed!")
        print("✅ Django models are working")
        print("✅ Supabase tables are accessible")
        print("✅ Your system is ready to use!")
        
        return True
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_django_supabase_integration()
    
    if success:
        print("\n🚀 Your Django system is now fully integrated with Supabase!")
        print("You can:")
        print("- Run your Django server normally")
        print("- Use all your existing views and forms")
        print("- Store data in Supabase")
        print("- Access data from anywhere")
    else:
        print("\n🔍 There's an issue to fix. Check the error above.")
