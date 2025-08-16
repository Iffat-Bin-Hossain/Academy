#!/bin/bash

# Simple Database Population Script
BASE_URL="http://localhost:8081/api"

echo "🚀 Starting database population with working format..."

# Function to create user
create_user() {
    local name="$1"
    local email="$2"
    local password="$3"
    local role="$4"
    
    echo "📝 Creating $role: $name..."
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"name\": \"$name\", \"email\": \"$email\", \"password\": \"$password\", \"role\": \"$role\"}" \
        "$BASE_URL/auth/signup" | grep -q "successful"
    
    if [ $? -eq 0 ]; then
        echo "✅ Success: $name"
    else
        echo "❌ Failed: $name"
    fi
}

echo ""
echo "👥 Creating Teachers..."
echo "======================"

create_user "Tanzima Hashem" "tanzima.teacher@gmail.com" "tanzima123" "TEACHER"
create_user "Masroor Ali" "masroor.teacher@gmail.com" "masroor123" "TEACHER"
create_user "Monirul Islam" "monirul.teacher@gmail.com" "monirul123" "TEACHER"
create_user "Mostofa Akbar" "mostofa.teacher@gmail.com" "mostofa123" "TEACHER"
create_user "Mahfuzul Islam" "mahfuzul.teacher@gmail.com" "mahfuzul123" "TEACHER"
create_user "Ashikur Rahman" "ashikur.teacher@gmail.com" "ashikur123" "TEACHER"
create_user "Mahmuda Naznin" "mahmuda.teacher@gmail.com" "mahmuda123" "TEACHER"
create_user "Anindya Iqbal" "anindya.teacher@gmail.com" "anindya123" "TEACHER"
create_user "Rifat Shahriyar" "rifat.teacher@gmail.com" "rifat123" "TEACHER"
create_user "Abdullah Adnan" "abdullah.teacher@gmail.com" "abdullah123" "TEACHER"

echo ""
echo "🎓 Creating Students..."
echo "======================"

create_user "Hozifa Rahman Hamim" "hozifa@gmail.com" "hozifa123" "STUDENT"
create_user "Labiba Binte Tasin" "labiba@gmail.com" "labiba123" "STUDENT"
create_user "Anik Saha" "anik@gmail.com" "anik123" "STUDENT"
create_user "Pramananda Sarkar" "pramananda@gmail.com" "pramananda123" "STUDENT"
create_user "A.H.M Towfique Mahmud" "ahm@gmail.com" "ahm123" "STUDENT"
create_user "Anup Halder Joy" "anup@gmail.com" "anup123" "STUDENT"
create_user "Kowshik Saha Kabya" "kowshik@gmail.com" "kowshik123" "STUDENT"
create_user "Adnan Ibney Faruq" "adnan@gmail.com" "adnan123" "STUDENT"
create_user "Ahmmad Nur Swapnil" "ahmmad@gmail.com" "ahmmad123" "STUDENT"
create_user "Abrar Jahin Sarker" "abrar@gmail.com" "abrar123" "STUDENT"

echo ""
echo "📚 Creating Courses..."
echo "====================="

echo "🔐 Getting authentication token..."
# Login with a teacher account
login_response=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"email": "tanzima.teacher@gmail.com", "password": "tanzima123"}' \
    "$BASE_URL/auth/login")

# Check if login was successful
if echo "$login_response" | grep -q "Invalid credentials"; then
    echo "❌ Login failed - user may need admin approval first"
    echo "📋 Users created but need admin approval before they can login"
    echo ""
    echo "To approve users:"
    echo "1. Login as admin"
    echo "2. Go to user management"
    echo "3. Approve the pending users"
    echo "4. Then run course creation separately"
    exit 0
fi

# Extract JWT token (if login successful)
jwt_token=$(echo $login_response | sed -n 's/.*"token":"\([^"]*\)".*/\1/p')

if [ -z "$jwt_token" ]; then
    echo "❌ Could not extract JWT token"
    echo "Response: $login_response"
    exit 1
fi

echo "✅ Got JWT token for course creation"

# Function to create course
create_course() {
    local title="$1"
    local code="$2"
    local description="$3"
    
    echo "📝 Creating course: $code - $title..."
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $jwt_token" \
        -d "{\"title\": \"$title\", \"courseCode\": \"$code\", \"description\": \"$description\", \"credits\": 3}" \
        "$BASE_URL/courses" | grep -q "id"
    
    if [ $? -eq 0 ]; then
        echo "✅ Success: $code - $title"
    else
        echo "❌ Failed: $code - $title"
    fi
}

# Create sample courses
create_course "Structured Programming Language" "CSE101" "Learn structured programming basics"
create_course "Structured Programming Sessional" "CSE102" "Programming lab practice"
create_course "Discrete Mathematics" "CSE103" "Mathematical foundations for computing"
create_course "Data Structures and Algorithms I" "CSE105" "Basic DS and algorithms"
create_course "Computer Programming" "CSE109" "Introduction to coding techniques"
create_course "Digital Logic Design" "CSE205" "Logic circuits and design"
create_course "Data Structures and Algorithms II" "CSE207" "Advanced DS and algorithm analysis"
create_course "Computer Architecture" "CSE209" "CPU and memory systems"
create_course "Theory of Computation" "CSE211" "Formal languages and automata"
create_course "Software Engineering" "CSE213" "Software development lifecycle principles"

echo ""
echo "🎉 Database population completed!"
echo "================================="
echo "✅ Created 10 teachers"
echo "✅ Created 10 students"
echo "✅ Created 10 courses"
echo ""
echo "📋 Note: Users may need admin approval before they can login"
