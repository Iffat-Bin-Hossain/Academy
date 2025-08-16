#!/bin/bash

# Database Population Script
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
echo "👥 Creating Teachers..."
echo "========================"

# Create all teachers
make_api_call "POST" "/auth/signup" '{
    "name": "Tanzima Hashem",
    "email": "tanzima.teacher@gmail.com",
    "password": "tanzima123",
    "role": "TEACHER"
}' "Creating teacher: Tanzima Hashem"

make_api_call "POST" "/auth/signup" '{
    "name": "Masroor Ali",
    "email": "masroor.teacher@gmail.com",
    "password": "masroor123",
    "role": "TEACHER"
}' "Creating teacher: Masroor Ali"

make_api_call "POST" "/auth/signup" '{
    "name": "Monirul Islam",
    "email": "monirul.teacher@gmail.com",
    "password": "monirul123",
    "role": "TEACHER"
}' "Creating teacher: Monirul Islam"

make_api_call "POST" "/auth/signup" '{
    "name": "Mostofa Akbar",
    "email": "mostofa.teacher@gmail.com",
    "password": "mostofa123",
    "role": "TEACHER"
}' "Creating teacher: Mostofa Akbar"

make_api_call "POST" "/auth/signup" '{
    "name": "Mahfuzul Islam",
    "email": "mahfuzul.teacher@gmail.com",
    "password": "mahfuzul123",
    "role": "TEACHER"
}' "Creating teacher: Mahfuzul Islam"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Ashikur Rahman",
    "email": "ashikur.teacher@gmail.com",
    "password": "ashikur123",
    "universityId": "05006",
    "role": "TEACHER"
}' "Creating teacher: Ashikur Rahman"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Mahmuda Naznin",
    "email": "mahmuda.teacher@gmail.com",
    "password": "mahmuda123",
    "universityId": "05007",
    "role": "TEACHER"
}' "Creating teacher: Mahmuda Naznin"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Anindya Iqbal",
    "email": "anindya.teacher@gmail.com",
    "password": "anindya123",
    "universityId": "05008",
    "role": "TEACHER"
}' "Creating teacher: Anindya Iqbal"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Rifat Shahriyar",
    "email": "rifat.teacher@gmail.com",
    "password": "rifat123",
    "universityId": "05009",
    "role": "TEACHER"
}' "Creating teacher: Rifat Shahriyar"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Abdullah Adnan",
    "email": "abdullah.teacher@gmail.com",
    "password": "abdullah123",
    "universityId": "05010",
    "role": "TEACHER"
}' "Creating teacher: Abdullah Adnan"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Saifur Rahman",
    "email": "saifur.teacher@gmail.com",
    "password": "saifur123",
    "universityId": "05011",
    "role": "TEACHER"
}' "Creating teacher: Saifur Rahman"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Shamsuzzoha Bayzid",
    "email": "shamsuzzoha.teacher@gmail.com",
    "password": "shamsuzzoha123",
    "universityId": "05012",
    "role": "TEACHER"
}' "Creating teacher: Shamsuzzoha Bayzid"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Abu Wasif",
    "email": "abu.teacher@gmail.com",
    "password": "abu123",
    "universityId": "05013",
    "role": "TEACHER"
}' "Creating teacher: Abu Wasif"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Sukarna Barua",
    "email": "sukarna.teacher@gmail.com",
    "password": "sukarna123",
    "universityId": "05014",
    "role": "TEACHER"
}' "Creating teacher: Sukarna Barua"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Khaled Mahmud Shahriar",
    "email": "khaled.teacher@gmail.com",
    "password": "khaled123",
    "universityId": "05015",
    "role": "TEACHER"
}' "Creating teacher: Khaled Mahmud Shahriar"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Atif Hasan Rahman",
    "email": "atif.teacher@gmail.com",
    "password": "atif123",
    "universityId": "05016",
    "role": "TEACHER"
}' "Creating teacher: Atif Hasan Rahman"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Rezwana Reaz",
    "email": "rezwana.teacher@gmail.com",
    "password": "rezwana123",
    "universityId": "05017",
    "role": "TEACHER"
}' "Creating teacher: Rezwana Reaz"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Ashraful Islam",
    "email": "ashraful.teacher@gmail.com",
    "password": "ashraful123",
    "universityId": "05018",
    "role": "TEACHER"
}' "Creating teacher: Ashraful Islam"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Mehedi Hasan",
    "email": "mehedi.teacher@gmail.com",
    "password": "mehedi123",
    "universityId": "05019",
    "role": "TEACHER"
}' "Creating teacher: Mehedi Hasan"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Abdur Rashid Tushar",
    "email": "abdur.teacher@gmail.com",
    "password": "abdur123",
    "universityId": "05020",
    "role": "TEACHER"
}' "Creating teacher: Abdur Rashid Tushar"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Sheikh Azizul Hakim",
    "email": "sheikh.teacher@gmail.com",
    "password": "sheikh123",
    "universityId": "05021",
    "role": "TEACHER"
}' "Creating teacher: Sheikh Azizul Hakim"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Kowshic Roy",
    "email": "kowshic.teacher@gmail.com",
    "password": "kowshic123",
    "universityId": "05022",
    "role": "TEACHER"
}' "Creating teacher: Kowshic Roy"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Saem Hasan",
    "email": "saem.teacher@gmail.com",
    "password": "saem123",
    "universityId": "055023",
    "role": "TEACHER"
}' "Creating teacher: Saem Hasan"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Emamul Haque Pranta",
    "email": "emamul.teacher@gmail.com",
    "password": "emamul123",
    "universityId": "05024",
    "role": "TEACHER"
}' "Creating teacher: Emamul Haque Pranta"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Ishrat Jahan",
    "email": "ishrat.teacher@gmail.com",
    "password": "ishrat123",
    "universityId": "05025",
    "role": "TEACHER"
}' "Creating teacher: Ishrat Jahan"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Nurul Muttakin",
    "email": "nurul.teacher@gmail.com",
    "password": "nurul123",
    "universityId": "05026",
    "role": "TEACHER"
}' "Creating teacher: Nurul Muttakin"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Junaed Younus Khan",
    "email": "junaed.teacher@gmail.com",
    "password": "junaed123",
    "universityId": "05027",
    "role": "TEACHER"
}' "Creating teacher: Junaed Younus Khan"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Ahmed Mahir Sultan Rumi",
    "email": "ahmed.teacher@gmail.com",
    "password": "ahmed123",
    "universityId": "05028",
    "role": "TEACHER"
}' "Creating teacher: Ahmed Mahir Sultan Rumi"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Rabib Jahin Ibn Momin",
    "email": "rabib.teacher@gmail.com",
    "password": "rabib123",
    "universityId": "05029",
    "role": "TEACHER"
}' "Creating teacher: Rabib Jahin Ibn Momin"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Abdur Rafi",
    "email": "abdur.teacher@gmail.com",
    "password": "abdur123",
    "universityId": "05030",
    "role": "TEACHER"
}' "Creating teacher: Abdur Rafi"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Anwarul Bashir Shuaib",
    "email": "anwarul.teacher@gmail.com",
    "password": "anwarul123",
    "universityId": "05031",
    "role": "TEACHER"
}' "Creating teacher: Anwarul Bashir Shuaib"

echo ""
echo "🎓 Creating Students..."
echo "======================"

# Create first 10 students as example (you can add more)
make_api_call "POST" "/auth/signup" '{
    "fullName": "Hozifa Rahman Hamim Abs",
    "email": "hozifa@gmail.com",
    "password": "hozifa123",
    "universityId": "1705083",
    "role": "STUDENT"
}' "Creating student: Hozifa Rahman Hamim Abs"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Labiba Binte Tasin Abs",
    "email": "labiba@gmail.com",
    "password": "labiba123",
    "universityId": "180567",
    "role": "STUDENT"
}' "Creating student: Labiba Binte Tasin Abs"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Anik Saha",
    "email": "anik@gmail.com",
    "password": "anik123",
    "universityId": "2005001",
    "role": "STUDENT"
}' "Creating student: Anik Saha"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Pramananda Sarkar",
    "email": "pramananda@gmail.com",
    "password": "pramananda123",
    "universityId": "2005002",
    "role": "STUDENT"
}' "Creating student: Pramananda Sarkar"

make_api_call "POST" "/auth/signup" '{
    "fullName": "A.H.M Towfique Mahmud",
    "email": "ahm@gmail.com",
    "password": "ahm123",
    "universityId": "2005003",
    "role": "STUDENT"
}' "Creating student: A.H.M Towfique Mahmud"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Anup Halder Joy",
    "email": "anup@gmail.com",
    "password": "anup123",
    "universityId": "2005004",
    "role": "STUDENT"
}' "Creating student: Anup Halder Joy"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Kowshik Saha Kabya",
    "email": "kowshik@gmail.com",
    "password": "kowshik123",
    "universityId": "2005005",
    "role": "STUDENT"
}' "Creating student: Kowshik Saha Kabya"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Adnan Ibney Faruq",
    "email": "adnan@gmail.com",
    "password": "adnan123",
    "universityId": "2005006",
    "role": "STUDENT"
}' "Creating student: Adnan Ibney Faruq"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Ahmmad Nur Swapnil Abs",
    "email": "ahmmad@gmail.com",
    "password": "ahmmad123",
    "universityId": "2005007",
    "role": "STUDENT"
}' "Creating student: Ahmmad Nur Swapnil Abs"

make_api_call "POST" "/auth/signup" '{
    "fullName": "Abrar Jahin Sarker",
    "email": "abrar@gmail.com",
    "password": "abrar123",
    "universityId": "2005008",
    "role": "STUDENT"
}' "Creating student: Abrar Jahin Sarker"

echo ""
echo "📚 Creating Courses..."
echo "====================="

# First login as a teacher to get JWT token for course creation
login_response=$(curl -s -X POST \
    -H "$CONTENT_TYPE" \
    -d '{"email": "tanzima.teacher@gmail.com", "password": "tanzima123"}' \
    "$BASE_URL/auth/login")

# Extract JWT token
jwt_token=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$jwt_token" ]; then
    echo "❌ Failed to get JWT token for course creation"
    exit 1
fi

echo "✅ Got JWT token for course creation"

# Function to create courses with JWT auth
create_course() {
    local course_data=$1
    local description=$2
    
    echo "📝 $description..."
    response=$(curl -s -w "%{http_code}" -X POST \
        -H "$CONTENT_TYPE" \
        -H "Authorization: Bearer $jwt_token" \
        -d "$course_data" \
        "$BASE_URL/courses")
    
    status_code="${response: -3}"
    response_body="${response%???}"
    
    if [[ "$status_code" =~ ^2[0-9][0-9]$ ]]; then
        echo "✅ Success: $description"
    else
        echo "❌ Failed: $description (Status: $status_code)"
        echo "   Response: $response_body"
    fi
}

# Create all courses
create_course '{
    "title": "Structured Programming Language",
    "courseCode": "CSE101",
    "description": "Learn structured programming basics",
    "credits": 3
}' "Creating course: CSE101 - Structured Programming Language"

create_course '{
    "title": "Structured Programming Sessional",
    "courseCode": "CSE102",
    "description": "Programming lab practice",
    "credits": 1
}' "Creating course: CSE102 - Structured Programming Sessional"

create_course '{
    "title": "Discrete Mathematics",
    "courseCode": "CSE103",
    "description": "Mathematical foundations for computing",
    "credits": 3
}' "Creating course: CSE103 - Discrete Mathematics"

create_course '{
    "title": "Data Structures and Algorithms I",
    "courseCode": "CSE105",
    "description": "Basic DS & algorithms",
    "credits": 3
}' "Creating course: CSE105 - Data Structures and Algorithms I"

create_course '{
    "title": "Computer Programming",
    "courseCode": "CSE109",
    "description": "Introduction to coding techniques",
    "credits": 3
}' "Creating course: CSE109 - Computer Programming"

create_course '{
    "title": "Digital Logic Design",
    "courseCode": "CSE205",
    "description": "Logic circuits and design",
    "credits": 3
}' "Creating course: CSE205 - Digital Logic Design"

create_course '{
    "title": "Data Structures and Algorithms II",
    "courseCode": "CSE207",
    "description": "Advanced DS & algorithm analysis",
    "credits": 3
}' "Creating course: CSE207 - Data Structures and Algorithms II"

create_course '{
    "title": "Computer Architecture",
    "courseCode": "CSE209",
    "description": "CPU and memory systems",
    "credits": 3
}' "Creating course: CSE209 - Computer Architecture"

create_course '{
    "title": "Theory of Computation",
    "courseCode": "CSE211",
    "description": "Formal languages and automata",
    "credits": 3
}' "Creating course: CSE211 - Theory of Computation"

create_course '{
    "title": "Software Engineering",
    "courseCode": "CSE213",
    "description": "Software development lifecycle principles",
    "credits": 3
}' "Creating course: CSE213 - Software Engineering"

create_course '{
    "title": "Database",
    "courseCode": "CSE215",
    "description": "Relational database design fundamentals",
    "credits": 3
}' "Creating course: CSE215 - Database"

create_course '{
    "title": "Technical Writing and Presentation",
    "courseCode": "CSE300",
    "description": "Communication and writing skills",
    "credits": 3
}' "Creating course: CSE300 - Technical Writing and Presentation"

create_course '{
    "title": "Computer Architecture",
    "courseCode": "CSE305",
    "description": "Advanced computer organization concepts",
    "credits": 3
}' "Creating course: CSE305 - Computer Architecture"

create_course '{
    "title": "Software Engineering",
    "courseCode": "CSE307",
    "description": "Software process & quality",
    "credits": 3
}' "Creating course: CSE307 - Software Engineering"

create_course '{
    "title": "Compiler",
    "courseCode": "CSE309",
    "description": "Compiler design and construction",
    "credits": 3
}' "Creating course: CSE309 - Compiler"

create_course '{
    "title": "Operating System",
    "courseCode": "CSE313",
    "description": "OS design and implementation",
    "credits": 3
}' "Creating course: CSE313 - Operating System"

create_course '{
    "title": "Embedded Systems & Interfacing",
    "courseCode": "CSE315",
    "description": "Embedded hardware and software integration",
    "credits": 3
}' "Creating course: CSE315 - Embedded Systems & Interfacing"

create_course '{
    "title": "Artificial Intelligence",
    "courseCode": "CSE317",
    "description": "Basics of AI algorithms",
    "credits": 3
}' "Creating course: CSE317 - Artificial Intelligence"

create_course '{
    "title": "Computer Networks",
    "courseCode": "CSE321",
    "description": "Network protocols and architecture",
    "credits": 3
}' "Creating course: CSE321 - Computer Networks"

create_course '{
    "title": "Machine Learning",
    "courseCode": "CSE329",
    "description": "Foundations of machine learning models",
    "credits": 3
}' "Creating course: CSE329 - Machine Learning"

create_course '{
    "title": "Simulation and Modeling",
    "courseCode": "CSE411",
    "description": "Modeling systems and simulation techniques",
    "credits": 3
}' "Creating course: CSE411 - Simulation and Modeling"

create_course '{
    "title": "High Performance Computing",
    "courseCode": "CSE413",
    "description": "Parallel computing and optimization",
    "credits": 3
}' "Creating course: CSE413 - High Performance Computing"

create_course '{
    "title": "Real‑time Embedded Systems",
    "courseCode": "CSE415",
    "description": "Real-time system design concepts",
    "credits": 3
}' "Creating course: CSE415 - Real‑time Embedded Systems"

create_course '{
    "title": "Computer Networks",
    "courseCode": "CSE451",
    "description": "Practical networking topics",
    "credits": 3
}' "Creating course: CSE451 - Computer Networks"

create_course '{
    "title": "Algorithm Engineering",
    "courseCode": "CSE461",
    "description": "Design efficient algorithm engineering",
    "credits": 3
}' "Creating course: CSE461 - Algorithm Engineering"

create_course '{
    "title": "Pattern Recognition",
    "courseCode": "CSE473",
    "description": "Recognize patterns using data models",
    "credits": 3
}' "Creating course: CSE473 - Pattern Recognition"

create_course '{
    "title": "Robotics",
    "courseCode": "CSE475",
    "description": "Principles of robotics systems design",
    "credits": 3
}' "Creating course: CSE475 - Robotics"

echo ""
echo "🎉 Database population completed!"
echo "================================="
echo "✅ Created all teachers from teacher.txt"
echo "✅ Created sample students from student.txt"
echo "✅ Created all courses from courses.txt"
echo ""
echo "Note: This script created the first 10 students as examples."
echo "You can extend it to create all students if needed."
