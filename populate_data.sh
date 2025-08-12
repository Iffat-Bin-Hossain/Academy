#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=== Academy Data Population Script ===${NC}"
echo -e "${BLUE}This script will:${NC}"
echo -e "${BLUE}1. Register all teachers from teacher.txt${NC}"
echo -e "${BLUE}2. Register all students from student.txt${NC}"
echo -e "${BLUE}3. Login as admin and create all courses from courses.txt${NC}"
echo

API_BASE="http://localhost:8080/api"

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers=$4
    
    if [ -n "$headers" ]; then
        curl -s -X "$method" "$API_BASE$endpoint" \
             -H "Content-Type: application/json" \
             -H "$headers" \
             -d "$data"
    else
        curl -s -X "$method" "$API_BASE$endpoint" \
             -H "Content-Type: application/json" \
             -d "$data"
    fi
}

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
until curl -s http://localhost:8080 > /dev/null 2>&1; do
    echo -e "${YELLOW}Backend not ready yet, waiting...${NC}"
    sleep 2
done
echo -e "${GREEN}Backend is ready!${NC}"
echo

# Register Teachers
echo -e "${BLUE}=== Registering Teachers ===${NC}"
teacher_count=0

# Teacher signup requests
teachers=(
    '{"name":"Tanzima Hashem","email":"tanzima.teacher@gmail.com","password":"tanzima123","studentId":"05001","role":"TEACHER"}'
    '{"name":"Masroor Ali","email":"masroor.teacher@gmail.com","password":"masroor123","studentId":"05002","role":"TEACHER"}'
    '{"name":"Monirul Islam","email":"monirul.teacher@gmail.com","password":"monirul123","studentId":"05003","role":"TEACHER"}'
    '{"name":"Mostofa Akbar","email":"mostofa.teacher@gmail.com","password":"mostofa123","studentId":"05004","role":"TEACHER"}'
    '{"name":"Mahfuzul Islam","email":"mahfuzul.teacher@gmail.com","password":"mahfuzul123","studentId":"05005","role":"TEACHER"}'
    '{"name":"Ashikur Rahman","email":"ashikur.teacher@gmail.com","password":"ashikur123","studentId":"05006","role":"TEACHER"}'
    '{"name":"Mahmuda Naznin","email":"mahmuda.teacher@gmail.com","password":"mahmuda123","studentId":"05007","role":"TEACHER"}'
    '{"name":"Anindya Iqbal","email":"anindya.teacher@gmail.com","password":"anindya123","studentId":"05008","role":"TEACHER"}'
    '{"name":"Rifat Shahriyar","email":"rifat.teacher@gmail.com","password":"rifat123","studentId":"05009","role":"TEACHER"}'
    '{"name":"Abdullah Adnan","email":"abdullah.teacher@gmail.com","password":"abdullah123","studentId":"05010","role":"TEACHER"}'
    '{"name":"Saifur Rahman","email":"saifur.teacher@gmail.com","password":"saifur123","studentId":"05011","role":"TEACHER"}'
    '{"name":"Shamsuzzoha Bayzid","email":"shamsuzzoha.teacher@gmail.com","password":"shamsuzzoha123","studentId":"05012","role":"TEACHER"}'
    '{"name":"Abu Wasif","email":"abu.teacher@gmail.com","password":"abu123","studentId":"05013","role":"TEACHER"}'
    '{"name":"Sukarna Barua","email":"sukarna.teacher@gmail.com","password":"sukarna123","studentId":"05014","role":"TEACHER"}'
    '{"name":"Khaled Mahmud Shahriar","email":"khaled.teacher@gmail.com","password":"khaled123","studentId":"05015","role":"TEACHER"}'
    '{"name":"Atif Hasan Rahman","email":"atif.teacher@gmail.com","password":"atif123","studentId":"05016","role":"TEACHER"}'
    '{"name":"Rezwana Reaz","email":"rezwana.teacher@gmail.com","password":"rezwana123","studentId":"05017","role":"TEACHER"}'
    '{"name":"Ashraful Islam","email":"ashraful.teacher@gmail.com","password":"ashraful123","studentId":"05018","role":"TEACHER"}'
    '{"name":"Mehedi Hasan","email":"mehedi.teacher@gmail.com","password":"mehedi123","studentId":"05019","role":"TEACHER"}'
    '{"name":"Abdur Rashid Tushar","email":"abdur.teacher@gmail.com","password":"abdur123","studentId":"05020","role":"TEACHER"}'
    '{"name":"Sheikh Azizul Hakim","email":"sheikh.teacher@gmail.com","password":"sheikh123","studentId":"05021","role":"TEACHER"}'
    '{"name":"Kowshic Roy","email":"kowshic.teacher@gmail.com","password":"kowshic123","studentId":"05022","role":"TEACHER"}'
    '{"name":"Saem Hasan","email":"saem.teacher@gmail.com","password":"saem123","studentId":"055023","role":"TEACHER"}'
    '{"name":"Emamul Haque Pranta","email":"emamul.teacher@gmail.com","password":"emamul123","studentId":"05024","role":"TEACHER"}'
    '{"name":"Ishrat Jahan","email":"ishrat.teacher@gmail.com","password":"ishrat123","studentId":"05025","role":"TEACHER"}'
    '{"name":"Nurul Muttakin","email":"nurul.teacher@gmail.com","password":"nurul123","studentId":"05026","role":"TEACHER"}'
    '{"name":"Junaed Younus Khan","email":"junaed.teacher@gmail.com","password":"junaed123","studentId":"05027","role":"TEACHER"}'
    '{"name":"Ahmed Mahir Sultan Rumi","email":"ahmed.teacher@gmail.com","password":"ahmed123","studentId":"05028","role":"TEACHER"}'
    '{"name":"Rabib Jahin Ibn Momin","email":"rabib.teacher@gmail.com","password":"rabib123","studentId":"05029","role":"TEACHER"}'
    '{"name":"Abdur Rafi","email":"abdur.teacher@gmail.com","password":"abdur123","studentId":"05030","role":"TEACHER"}'
    '{"name":"Anwarul Bashir Shuaib","email":"anwarul.teacher@gmail.com","password":"anwarul123","studentId":"05031","role":"TEACHER"}'
)

for teacher in "${teachers[@]}"; do
    echo -e "${YELLOW}Registering teacher...${NC}"
    response=$(make_request "POST" "/auth/signup" "$teacher")
    if echo "$response" | grep -q "success\|created\|registered"; then
        echo -e "${GREEN}✓ Teacher registered successfully${NC}"
        ((teacher_count++))
    else
        echo -e "${RED}✗ Failed to register teacher: $response${NC}"
    fi
    sleep 0.5
done

echo -e "${GREEN}Registered $teacher_count teachers${NC}"
echo

# Register Students
echo -e "${BLUE}=== Registering Students ===${NC}"
student_count=0

# Student signup requests (all students from the file)
students=(
    '{"name":"Hozifa Rahman Hamim Abs","email":"hozifa@gmail.com","password":"hozifa123","studentId":"1705083","role":"STUDENT"}'
    '{"name":"Labiba Binte Tasin Abs","email":"labiba@gmail.com","password":"labiba123","studentId":"180567","role":"STUDENT"}'
    '{"name":"Anik Saha","email":"anik@gmail.com","password":"anik123","studentId":"2005001","role":"STUDENT"}'
    '{"name":"Pramananda Sarkar","email":"pramananda@gmail.com","password":"pramananda123","studentId":"2005002","role":"STUDENT"}'
    '{"name":"A.H.M Towfique Mahmud","email":"ahm@gmail.com","password":"ahm123","studentId":"2005003","role":"STUDENT"}'
    '{"name":"Anup Halder Joy","email":"anup@gmail.com","password":"anup123","studentId":"2005004","role":"STUDENT"}'
    '{"name":"Kowshik Saha Kabya","email":"kowshik@gmail.com","password":"kowshik123","studentId":"2005005","role":"STUDENT"}'
    '{"name":"Adnan Ibney Faruq","email":"adnan@gmail.com","password":"adnan123","studentId":"2005006","role":"STUDENT"}'
    '{"name":"Ahmmad Nur Swapnil Abs","email":"ahmmad@gmail.com","password":"ahmmad123","studentId":"2005007","role":"STUDENT"}'
    '{"name":"Abrar Jahin Sarker","email":"abrar@gmail.com","password":"abrar123","studentId":"2005008","role":"STUDENT"}'
    '{"name":"Al Muhit Muhtadi","email":"amm@gmail.com","password":"al123","studentId":"2005009","role":"STUDENT"}'
    '{"name":"Tanvir Hossain","email":"tanvir@gmail.com","password":"tanvir123","studentId":"2005010","role":"STUDENT"}'
    '{"name":"Adibah Mahmud","email":"adibah@gmail.com","password":"adibah123","studentId":"2005011","role":"STUDENT"}'
    '{"name":"Turjoy Dey Abs","email":"turjoy@gmail.com","password":"turjoy123","studentId":"2005012","role":"STUDENT"}'
    '{"name":"Munzer Mahmood","email":"munzer@gmail.com","password":"munzer123","studentId":"2005013","role":"STUDENT"}'
    '{"name":"Jarin Tasneem","email":"jarin@gmail.com","password":"jarin123","studentId":"2005014","role":"STUDENT"}'
    '{"name":"Mostafa Rifat Tazwar","email":"mostafa@gmail.com","password":"mostafa123","studentId":"2005015","role":"STUDENT"}'
    '{"name":"Afzal Hossan","email":"afzal@gmail.com","password":"afzal123","studentId":"2005016","role":"STUDENT"}'
    '{"name":"Ekramul Haque Amin","email":"ekramul@gmail.com","password":"ekramul123","studentId":"2005017","role":"STUDENT"}'
    '{"name":"Jaber Ahmed Deedar","email":"jaber@gmail.com","password":"jaber123","studentId":"2005018","role":"STUDENT"}'
    '{"name":"Asif Karim Abs","email":"asif@gmail.com","password":"asif123","studentId":"2005019","role":"STUDENT"}'
    '{"name":"Swastika Pandit","email":"swastika@gmail.com","password":"swastika123","studentId":"2005020","role":"STUDENT"}'
    '{"name":"Fairuz Mubashwera","email":"fairuz@gmail.com","password":"fairuz123","studentId":"2005021","role":"STUDENT"}'
    '{"name":"Soumik Bhattacharjee","email":"soumik@gmail.com","password":"soumik123","studentId":"2005022","role":"STUDENT"}'
    '{"name":"Somik Dasgupta","email":"somik@gmail.com","password":"somik123","studentId":"2005023","role":"STUDENT"}'
    '{"name":"Gourab Biswas Abs","email":"gourab@gmail.com","password":"gourab123","studentId":"2005024","role":"STUDENT"}'
    '{"name":"Tawhid Muhammad Mubashwir","email":"tawhid@gmail.com","password":"tawhid123","studentId":"2005025","role":"STUDENT"}'
    '{"name":"Zia Ul Hassan Abdullah","email":"zia@gmail.com","password":"zia123","studentId":"2005026","role":"STUDENT"}'
    '{"name":"Musa Tur Farazi","email":"musa@gmail.com","password":"musa123","studentId":"2005027","role":"STUDENT"}'
    '{"name":"Reduanul Islam Imon Abs","email":"reduanul@gmail.com","password":"reduanul123","studentId":"2005028","role":"STUDENT"}'
    '{"name":"Mahamudul Hasan Fahim Abs","email":"mahamudul@gmail.com","password":"mahamudul123","studentId":"2005029","role":"STUDENT"}'
    '{"name":"Prithu Anan","email":"prithu@gmail.com","password":"prithu123","studentId":"2005030","role":"STUDENT"}'
    '{"name":"Tusher Bhomik","email":"tusher@gmail.com","password":"tusher123","studentId":"2005031","role":"STUDENT"}'
    '{"name":"Akanta Das","email":"akanta@gmail.com","password":"akanta123","studentId":"2005032","role":"STUDENT"}'
    '{"name":"Sheikh Rahat Mahmud","email":"sheikh@gmail.com","password":"sheikh123","studentId":"2005033","role":"STUDENT"}'
    '{"name":"Oitijhya Hoque","email":"oitijhya@gmail.com","password":"oitijhya123","studentId":"2005034","role":"STUDENT"}'
    '{"name":"Nabila Tabassum Abs","email":"nabila@gmail.com","password":"nabila123","studentId":"2005035","role":"STUDENT"}'
    '{"name":"Tausif Rashid","email":"tausif@gmail.com","password":"tausif123","studentId":"2005036","role":"STUDENT"}'
    '{"name":"Awesh Islam Abs","email":"awesh@gmail.com","password":"awesh123","studentId":"2005037","role":"STUDENT"}'
    '{"name":"Azmal Karim","email":"azmal@gmail.com","password":"azmal123","studentId":"2005038","role":"STUDENT"}'
    '{"name":"Tasinul Islam Ahon","email":"tasinul@gmail.com","password":"tasinul123","studentId":"2005039","role":"STUDENT"}'
    '{"name":"Shabab Mosharraf","email":"shabab@gmail.com","password":"shabab123","studentId":"2005040","role":"STUDENT"}'
    '{"name":"Sabbir Alam Saad Abs","email":"sabbir@gmail.com","password":"sabbir123","studentId":"2005041","role":"STUDENT"}'
    '{"name":"Farriha Afnan","email":"farriha@gmail.com","password":"farriha123","studentId":"2005042","role":"STUDENT"}'
    '{"name":"Rafiqul Islam Rayan","email":"rafiqul@gmail.com","password":"rafiqul123","studentId":"2005043","role":"STUDENT"}'
    '{"name":"Abid Hasan Khondaker","email":"abid@gmail.com","password":"abid123","studentId":"2005044","role":"STUDENT"}'
    '{"name":"Tahsin Kabir Mazumder","email":"tahsin@gmail.com","password":"tahsin123","studentId":"2005045","role":"STUDENT"}'
    '{"name":"Abdullah Faiyaz Abs","email":"abdullah@gmail.com","password":"abdullah123","studentId":"2005046","role":"STUDENT"}'
    '{"name":"Souvik Mandol","email":"souvik@gmail.com","password":"souvik123","studentId":"2005047","role":"STUDENT"}'
    '{"name":"Sagor Chanda","email":"sagor@gmail.com","password":"sagor123","studentId":"2005048","role":"STUDENT"}'
    '{"name":"Dipanta Kumar Roy Nobo","email":"dipanta@gmail.com","password":"dipanta123","studentId":"2005049","role":"STUDENT"}'
    '{"name":"Moyen Uddin","email":"moyen@gmail.com","password":"moyen123","studentId":"2005050","role":"STUDENT"}'
    '{"name":"S. M. Kausar Parvej","email":"smkp@gmail.com","password":"s123","studentId":"2005051","role":"STUDENT"}'
    '{"name":"Sadatul Islam Sadi","email":"sadatul@gmail.com","password":"sadatul123","studentId":"2005052","role":"STUDENT"}'
    '{"name":"M. M. Nayem","email":"mmn@gmail.com","password":"m123","studentId":"2005053","role":"STUDENT"}'
    '{"name":"Ananya Shahrin Promi","email":"ananya@gmail.com","password":"ananya123","studentId":"2005054","role":"STUDENT"}'
    '{"name":"Mohammad Ninad Mahmud","email":"mohammad@gmail.com","password":"mohammad123","studentId":"2005055","role":"STUDENT"}'
    '{"name":"Kazi Jayed Haider","email":"kazi@gmail.com","password":"kazi123","studentId":"2005056","role":"STUDENT"}'
    '{"name":"Mst. Fahmida Sultana Naznin","email":"mst@gmail.com","password":"mst123","studentId":"2005057","role":"STUDENT"}'
    '{"name":"Suhaeb Bin Matin Abs","email":"suhaeb@gmail.com","password":"suhaeb123","studentId":"2005058","role":"STUDENT"}'
    '{"name":"Iftekhar Sanwar Talukdar","email":"iftekhar@gmail.com","password":"iftekhar123","studentId":"2005059","role":"STUDENT"}'
    '{"name":"Wahid Al Azad Navid","email":"wahid@gmail.com","password":"wahid123","studentId":"2005060","role":"STUDENT"}'
    '{"name":"Tawkir Aziz Rahman","email":"tawkir@gmail.com","password":"tawkir123","studentId":"2005061","role":"STUDENT"}'
    '{"name":"Waseem Mustak Zisan","email":"waseem@gmail.com","password":"waseem123","studentId":"2005062","role":"STUDENT"}'
    '{"name":"Shahad Shahriar Rahman","email":"shahad@gmail.com","password":"shahad123","studentId":"2005063","role":"STUDENT"}'
    '{"name":"Shahriar Ahmed Seam Abs","email":"shahriar@gmail.com","password":"shahriar123","studentId":"2005064","role":"STUDENT"}'
    '{"name":"Tamim Hasan Saad","email":"tamim@gmail.com","password":"tamim123","studentId":"2005065","role":"STUDENT"}'
    '{"name":"Habiba Rafique","email":"habiba@gmail.com","password":"habiba123","studentId":"2005066","role":"STUDENT"}'
    '{"name":"Munim Thahmid Abs","email":"munim@gmail.com","password":"munim123","studentId":"2005067","role":"STUDENT"}'
    '{"name":"Maisha Maksura Abs","email":"maisha@gmail.com","password":"maisha123","studentId":"2005068","role":"STUDENT"}'
    '{"name":"Istiak Ahmmed Rifti","email":"istiak@gmail.com","password":"istiak123","studentId":"2005069","role":"STUDENT"}'
    '{"name":"Md.Tashdiqur Rahman","email":"mdtashdiqur@gmail.com","password":"mdtashdiqur123","studentId":"2005070","role":"STUDENT"}'
    '{"name":"H. M. Shadman Tabib","email":"hmst@gmail.com","password":"h123","studentId":"2005071","role":"STUDENT"}'
    '{"name":"Mushfiqur Rahman","email":"mushfiqur@gmail.com","password":"mushfiqur123","studentId":"2005072","role":"STUDENT"}'
    '{"name":"Noushin Tabassum Aoishy","email":"noushin@gmail.com","password":"noushin123","studentId":"2005073","role":"STUDENT"}'
    '{"name":"Sadnam Faiyaz","email":"sadnam@gmail.com","password":"sadnam123","studentId":"2005074","role":"STUDENT"}'
    '{"name":"Arnab Dey","email":"arnab@gmail.com","password":"arnab123","studentId":"2005075","role":"STUDENT"}'
    '{"name":"Fuad Ahmed Udoy","email":"fuad@gmail.com","password":"fuad123","studentId":"2005076","role":"STUDENT"}'
    '{"name":"Sadia Afrin Sithi","email":"sadia@gmail.com","password":"sadia123","studentId":"2005077","role":"STUDENT"}'
)

for student in "${students[@]}"; do
    echo -e "${YELLOW}Registering student...${NC}"
    response=$(make_request "POST" "/auth/signup" "$student")
    if echo "$response" | grep -q "success\|created\|registered"; then
        echo -e "${GREEN}✓ Student registered successfully${NC}"
        ((student_count++))
    else
        echo -e "${RED}✗ Failed to register student: $response${NC}"
    fi
    sleep 0.5
done

echo -e "${GREEN}Registered $student_count students${NC}"
echo

# Login as admin
echo -e "${BLUE}=== Logging in as Admin ===${NC}"
admin_login='{"email":"admin@academy.com","password":"admin123"}'
login_response=$(make_request "POST" "/auth/login" "$admin_login")

# Extract token from response
token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✓ Admin logged in successfully${NC}"
    echo -e "${BLUE}Token: ${token:0:20}...${NC}"
else
    echo -e "${RED}✗ Failed to login as admin${NC}"
    echo "Response: $login_response"
    exit 1
fi

echo

# Create Courses
echo -e "${BLUE}=== Creating Courses ===${NC}"
course_count=0

# Course creation requests
courses=(
    '{"title":"Structured Programming Language","courseCode":"CSE101","description":"Learn structured programming basics"}'
    '{"title":"Structured Programming Sessional","courseCode":"CSE102","description":"Programming lab practice"}'
    '{"title":"Discrete Mathematics","courseCode":"CSE103","description":"Mathematical foundations for computing"}'
    '{"title":"Data Structures and Algorithms I","courseCode":"CSE105","description":"Basic DS & algorithms"}'
    '{"title":"Computer Programming","courseCode":"CSE109","description":"Introduction to coding techniques"}'
    '{"title":"Digital Logic Design","courseCode":"CSE205","description":"Logic circuits and design"}'
    '{"title":"Data Structures and Algorithms II","courseCode":"CSE207","description":"Advanced DS & algorithm analysis"}'
    '{"title":"Computer Architecture","courseCode":"CSE209","description":"CPU and memory systems"}'
    '{"title":"Theory of Computation","courseCode":"CSE211","description":"Formal languages and automata"}'
    '{"title":"Software Engineering","courseCode":"CSE213","description":"Software development lifecycle principles"}'
    '{"title":"Database","courseCode":"CSE215","description":"Relational database design fundamentals"}'
    '{"title":"Technical Writing and Presentation","courseCode":"CSE300","description":"Communication and writing skills"}'
    '{"title":"Computer Architecture","courseCode":"CSE305","description":"Advanced computer organization concepts"}'
    '{"title":"Software Engineering","courseCode":"CSE307","description":"Software process & quality"}'
    '{"title":"Compiler","courseCode":"CSE309","description":"Compiler design and construction"}'
    '{"title":"Operating System","courseCode":"CSE313","description":"OS design and implementation"}'
    '{"title":"Embedded Systems & Interfacing","courseCode":"CSE315","description":"Embedded hardware and software integration"}'
    '{"title":"Artificial Intelligence","courseCode":"CSE317","description":"Basics of AI algorithms"}'
    '{"title":"Computer Networks","courseCode":"CSE321","description":"Network protocols and architecture"}'
    '{"title":"Machine Learning","courseCode":"CSE329","description":"Foundations of machine learning models"}'
    '{"title":"Simulation and Modeling","courseCode":"CSE411","description":"Modeling systems and simulation techniques"}'
    '{"title":"High Performance Computing","courseCode":"CSE413","description":"Parallel computing and optimization"}'
    '{"title":"Real‑time Embedded Systems","courseCode":"CSE415","description":"Real-time system design concepts"}'
    '{"title":"Computer Networks","courseCode":"CSE451","description":"Practical networking topics"}'
    '{"title":"Algorithm Engineering","courseCode":"CSE461","description":"Design efficient algorithm engineering"}'
    '{"title":"Pattern Recognition","courseCode":"CSE473","description":"Recognize patterns using data models"}'
    '{"title":"Robotics","courseCode":"CSE475","description":"Principles of robotics systems design"}'
)

for course in "${courses[@]}"; do
    echo -e "${YELLOW}Creating course...${NC}"
    response=$(make_request "POST" "/courses" "$course" "Authorization: Bearer $token")
    if echo "$response" | grep -q "success\|created\|id"; then
        echo -e "${GREEN}✓ Course created successfully${NC}"
        ((course_count++))
    else
        echo -e "${RED}✗ Failed to create course: $response${NC}"
    fi
    sleep 0.5
done

echo -e "${GREEN}Created $course_count courses${NC}"
echo

echo -e "${BLUE}=== Summary ===${NC}"
echo -e "${GREEN}✓ Teachers registered: $teacher_count${NC}"
echo -e "${GREEN}✓ Students registered: $student_count${NC}"
echo -e "${GREEN}✓ Courses created: $course_count${NC}"
echo -e "${BLUE}Data population completed!${NC}"
