#!/bin/bash

# Database Population Script - Simplified Version
# This script will create all users and courses from the data files

BASE_URL="http://localhost:8081/api"
CONTENT_TYPE="Content-Type: application/json"

echo "🚀 Starting database population..."

# Function to make API calls with error handling
make_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo "📝 $description..."
    response=$(curl -s -w "%{http_code}" -X $method \
        -H "$CONTENT_TYPE" \
        -d "$data" \
        "$BASE_URL$endpoint")
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo "✅ Success: $description"
    else
        echo "❌ Failed: $description (Status: $status_code)"
        echo "   Response: $response_body"
    fi
}

echo ""
echo "👥 Creating Teachers (Sample)..."
echo "================================"

# Create sample teachers with correct format
teachers=(
    "Tanzima Hashem:tanzima.teacher@gmail.com:tanzima123"
    "Masroor Ali:masroor.teacher@gmail.com:masroor123"
    "Monirul Islam:monirul.teacher@gmail.com:monirul123"
    "Mostofa Akbar:mostofa.teacher@gmail.com:mostofa123"
    "Mahfuzul Islam:mahfuzul.teacher@gmail.com:mahfuzul123"
    "Ashikur Rahman:ashikur.teacher@gmail.com:ashikur123"
    "Mahmuda Naznin:mahmuda.teacher@gmail.com:mahmuda123"
    "Anindya Iqbal:anindya.teacher@gmail.com:anindya123"
    "Rifat Shahriyar:rifat.teacher@gmail.com:rifat123"
    "Abdullah Adnan:abdullah.teacher@gmail.com:abdullah123"
)

for teacher in "${teachers[@]}"; do
    IFS=':' read -r name email password <<< "$teacher"
    make_api_call "POST" "/auth/signup" '{
        "name": "'$name'",
        "email": "'$email'",
        "password": "'$password'",
        "role": "TEACHER"
    }' "Creating teacher: $name"
done

echo ""
echo "🎓 Creating Students (Sample)..."
echo "================================"

# Create sample students
students=(
    "Hozifa Rahman Hamim:hozifa@gmail.com:hozifa123"
    "Labiba Binte Tasin:labiba@gmail.com:labiba123"
    "Anik Saha:anik@gmail.com:anik123"
    "Pramananda Sarkar:pramananda@gmail.com:pramananda123"
    "A.H.M Towfique Mahmud:ahm@gmail.com:ahm123"
    "Anup Halder Joy:anup@gmail.com:anup123"
    "Kowshik Saha Kabya:kowshik@gmail.com:kowshik123"
    "Adnan Ibney Faruq:adnan@gmail.com:adnan123"
    "Ahmmad Nur Swapnil:ahmmad@gmail.com:ahmmad123"
    "Abrar Jahin Sarker:abrar@gmail.com:abrar123"
)

for student in "${students[@]}"; do
    IFS=':' read -r name email password <<< "$student"
    make_api_call "POST" "/auth/signup" '{
        "name": "'$name'",
        "email": "'$email'",
        "password": "'$password'",
        "role": "STUDENT"
    }' "Creating student: $name"
done

echo ""
echo "📚 Creating Courses..."
echo "====================="

# First login as a teacher to get JWT token for course creation
echo "🔐 Getting authentication token..."
login_response=$(curl -s -X POST \
    -H "$CONTENT_TYPE" \
    -d '{"email": "tanzima.teacher@gmail.com", "password": "tanzima123"}' \
    "$BASE_URL/auth/login")

# Extract JWT token
jwt_token=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$jwt_token" ]; then
    echo "❌ Failed to get JWT token for course creation"
    echo "Response: $login_response"
    exit 1
fi

echo "✅ Got JWT token for course creation"

# Function to create courses with JWT auth
create_course() {
    local title=$1
    local code=$2
    local description=$3
    
    echo "📝 Creating course: $code - $title..."
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "$CONTENT_TYPE" \
        -H "Authorization: Bearer $jwt_token" \
        -d '{
            "title": "'$title'",
            "courseCode": "'$code'",
            "description": "'$description'",
            "credits": 3
        }' \
        "$BASE_URL/courses")
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo "✅ Success: $code - $title"
    else
        echo "❌ Failed: $code - $title (Status: $status_code)"
        echo "   Response: $response_body"
    fi
}

# Create all courses from courses.txt
create_course "Structured Programming Language" "CSE101" "Learn structured programming basics"
create_course "Structured Programming Sessional" "CSE102" "Programming lab practice"
create_course "Discrete Mathematics" "CSE103" "Mathematical foundations for computing"
create_course "Data Structures and Algorithms I" "CSE105" "Basic DS & algorithms"
create_course "Computer Programming" "CSE109" "Introduction to coding techniques"
create_course "Digital Logic Design" "CSE205" "Logic circuits and design"
create_course "Data Structures and Algorithms II" "CSE207" "Advanced DS & algorithm analysis"
create_course "Computer Architecture" "CSE209" "CPU and memory systems"
create_course "Theory of Computation" "CSE211" "Formal languages and automata"
create_course "Software Engineering" "CSE213" "Software development lifecycle principles"
create_course "Database" "CSE215" "Relational database design fundamentals"
create_course "Technical Writing and Presentation" "CSE300" "Communication and writing skills"
create_course "Computer Architecture Advanced" "CSE305" "Advanced computer organization concepts"
create_course "Software Engineering Advanced" "CSE307" "Software process & quality"
create_course "Compiler" "CSE309" "Compiler design and construction"
create_course "Operating System" "CSE313" "OS design and implementation"
create_course "Embedded Systems & Interfacing" "CSE315" "Embedded hardware and software integration"
create_course "Artificial Intelligence" "CSE317" "Basics of AI algorithms"
create_course "Computer Networks" "CSE321" "Network protocols and architecture"
create_course "Machine Learning" "CSE329" "Foundations of machine learning models"
create_course "Simulation and Modeling" "CSE411" "Modeling systems and simulation techniques"
create_course "High Performance Computing" "CSE413" "Parallel computing and optimization"
create_course "Real-time Embedded Systems" "CSE415" "Real-time system design concepts"
create_course "Computer Networks Advanced" "CSE451" "Practical networking topics"
create_course "Algorithm Engineering" "CSE461" "Design efficient algorithm engineering"
create_course "Pattern Recognition" "CSE473" "Recognize patterns using data models"
create_course "Robotics" "CSE475" "Principles of robotics systems design"

echo ""
echo "🎉 Database population completed!"
echo "================================="
echo "✅ Created 10 teachers"
echo "✅ Created 10 students"
echo "✅ Created 27 courses"
echo ""
echo "You can now:"
echo "1. Login with any teacher/student credentials"
echo "2. Browse available courses"
echo "3. Enroll students in courses"
echo "4. Add more users as needed"
