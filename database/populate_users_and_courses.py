#!/usr/bin/env python3
"""
Script to populate the Academy database with users and courses
"""

import requests
import json
import time
import sys
from typing import List, Dict

# Configuration
BASE_URL = "http://localhost:8081"
ADMIN_CREDENTIALS = {
    "email": "admin@academy.com",
    "password": "admin123"
}

def get_admin_token():
    """Get admin authentication token"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDENTIALS)
        response.raise_for_status()
        data = response.json()
        return data.get('token')
    except Exception as e:
        print(f"Failed to get admin token: {e}")
        return None

def signup_user(user_data: Dict) -> bool:
    """Sign up a single user"""
    try:
        signup_payload = {
            "name": user_data["name"],
            "email": user_data["email"],
            "password": user_data["password"],
            "role": user_data["role"]
        }
        
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"✅ Successfully signed up: {user_data['name']} ({user_data['email']})")
            return True
        elif response.status_code == 400 and "already exists" in response.text.lower():
            print(f"ℹ️  User already exists: {user_data['name']} ({user_data['email']})")
            return True
        else:
            print(f"❌ Failed to sign up {user_data['name']}: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error signing up {user_data['name']}: {e}")
        return False

def approve_user(user_email: str, admin_token: str) -> bool:
    """Approve a user after signup"""
    try:
        # First get all users to find the user ID
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        
        if response.status_code == 200:
            users = response.json()
            user_to_approve = None
            
            for user in users:
                if user.get('email') == user_email and user.get('status') == 'PENDING':
                    user_to_approve = user
                    break
            
            if user_to_approve:
                # Approve the user
                approve_response = requests.post(
                    f"{BASE_URL}/api/admin/approve/{user_to_approve['id']}", 
                    headers=headers
                )
                
                if approve_response.status_code == 200:
                    print(f"✅ Approved user: {user_email}")
                    return True
                else:
                    print(f"❌ Failed to approve {user_email}: {approve_response.status_code}")
                    return False
            else:
                print(f"ℹ️  User {user_email} not found or not pending")
                return True
                
    except Exception as e:
        print(f"❌ Error approving {user_email}: {e}")
        return False

def create_course(course_data: Dict, admin_token: str) -> bool:
    """Create a single course"""
    try:
        headers = {"Authorization": f"Bearer {admin_token}"}
        course_payload = {
            "title": course_data["title"],
            "courseCode": course_data["code"],
            "description": course_data["description"]
        }
        
        response = requests.post(f"{BASE_URL}/api/courses", json=course_payload, headers=headers)
        
        if response.status_code == 200 or response.status_code == 201:
            print(f"✅ Successfully created course: {course_data['title']} ({course_data['code']})")
            return True
        elif response.status_code == 400 and ("already exists" in response.text.lower() or "duplicate" in response.text.lower()):
            print(f"ℹ️  Course already exists: {course_data['title']} ({course_data['code']})")
            return True
        else:
            print(f"❌ Failed to create course {course_data['title']}: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error creating course {course_data['title']}: {e}")
        return False

def parse_students():
    """Parse student data from the text format"""
    students = []
    with open('../miscellaneous/data/student.txt', 'r') as f:
        content = f.read().strip()
        
    entries = content.split('\n\n')
    for entry in entries:
        lines = [line.strip() for line in entry.split('\n') if line.strip()]
        if len(lines) >= 4:
            student = {}
            for line in lines:
                if line.startswith('FullName:'):
                    student['name'] = line.replace('FullName:', '').strip()
                elif line.startswith('Email:'):
                    student['email'] = line.replace('Email:', '').strip()
                elif line.startswith('Password:'):
                    student['password'] = line.replace('Password:', '').strip()
                elif line.startswith('Role:'):
                    student['role'] = line.replace('Role:', '').strip()
            
            if all(key in student for key in ['name', 'email', 'password', 'role']):
                students.append(student)
    
    return students

def parse_teachers():
    """Parse teacher data from the text format"""
    teachers = []
    with open('../miscellaneous/data/teacher.txt', 'r') as f:
        content = f.read().strip()
        
    entries = content.split('\n\n')
    for entry in entries:
        lines = [line.strip() for line in entry.split('\n') if line.strip()]
        if len(lines) >= 4:
            teacher = {}
            for line in lines:
                if line.startswith('FullName:'):
                    teacher['name'] = line.replace('FullName:', '').strip()
                elif line.startswith('Email:'):
                    teacher['email'] = line.replace('Email:', '').strip()
                elif line.startswith('Password:'):
                    teacher['password'] = line.replace('Password:', '').strip()
                elif line.startswith('Role:'):
                    teacher['role'] = line.replace('Role:', '').strip()
            
            if all(key in teacher for key in ['name', 'email', 'password', 'role']):
                teachers.append(teacher)
    
    return teachers

def parse_courses():
    """Parse course data from the text format"""
    courses = []
    with open('../miscellaneous/data/courses.txt', 'r') as f:
        content = f.read().strip()
    
    lines = content.split('\n')
    current_course = {}
    
    for line in lines:
        line = line.strip()
        if line.startswith('course Title:'):
            if current_course:  # Save previous course
                courses.append(current_course)
            current_course = {'title': line.replace('course Title:', '').strip()}
        elif line.startswith('course code:') or line.startswith('.course code:'):
            current_course['code'] = line.replace('course code:', '').replace('.course code:', '').strip()
        elif line.startswith('description:'):
            current_course['description'] = line.replace('description:', '').strip()
    
    # Don't forget the last course
    if current_course:
        courses.append(current_course)
    
    return courses

def main():
    print("🚀 Starting Academy database population...")
    print("=" * 60)
    
    # Parse data
    students = parse_students()
    teachers = parse_teachers()
    courses = parse_courses()
    
    print(f"📊 Found {len(students)} students, {len(teachers)} teachers, and {len(courses)} courses")
    print("=" * 60)
    
    # Get admin token
    print("🔑 Getting admin authentication token...")
    admin_token = get_admin_token()
    if not admin_token:
        print("❌ Failed to get admin token. Exiting.")
        sys.exit(1)
    print("✅ Admin token obtained")
    print("=" * 60)
    
    # Sign up all students
    print("👨‍🎓 Signing up students...")
    student_success = 0
    for i, student in enumerate(students, 1):
        print(f"Progress: {i}/{len(students)}", end=" - ")
        if signup_user(student):
            student_success += 1
        time.sleep(0.5)  # Rate limiting
    
    print(f"📊 Student signup summary: {student_success}/{len(students)} successful")
    print("=" * 60)
    
    # Sign up all teachers
    print("👨‍🏫 Signing up teachers...")
    teacher_success = 0
    for i, teacher in enumerate(teachers, 1):
        print(f"Progress: {i}/{len(teachers)}", end=" - ")
        if signup_user(teacher):
            teacher_success += 1
        time.sleep(0.5)  # Rate limiting
    
    print(f"📊 Teacher signup summary: {teacher_success}/{len(teachers)} successful")
    print("=" * 60)
    
    # Wait a moment for database to update
    print("⏳ Waiting for database updates...")
    time.sleep(2)
    
    # Approve all users
    print("✅ Approving all users...")
    all_users = students + teachers
    approval_success = 0
    
    for i, user in enumerate(all_users, 1):
        print(f"Progress: {i}/{len(all_users)}", end=" - ")
        if approve_user(user['email'], admin_token):
            approval_success += 1
        time.sleep(0.3)  # Rate limiting
    
    print(f"📊 User approval summary: {approval_success}/{len(all_users)} successful")
    print("=" * 60)
    
    # Create all courses
    print("📚 Creating courses...")
    course_success = 0
    for i, course in enumerate(courses, 1):
        print(f"Progress: {i}/{len(courses)}", end=" - ")
        if create_course(course, admin_token):
            course_success += 1
        time.sleep(0.5)  # Rate limiting
    
    print(f"📊 Course creation summary: {course_success}/{len(courses)} successful")
    print("=" * 60)
    
    print("🎉 Database population completed!")
    print(f"📊 Final Summary:")
    print(f"   - Students signed up: {student_success}/{len(students)}")
    print(f"   - Teachers signed up: {teacher_success}/{len(teachers)}")
    print(f"   - Users approved: {approval_success}/{len(all_users)}")
    print(f"   - Courses created: {course_success}/{len(courses)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
