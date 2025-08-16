#!/bin/bash

# Complete Database Population Script
# This script will create ALL users from teacher.txt and student.txt files
# Then login as admin to create ALL courses from courses.txt

BASE_URL="http://localhost:8081/api"
CONTENT_TYPE="Content-Type: application/json"

echo "🚀 Starting complete database population..."
echo "📊 Will create: 31 teachers + 77 students + 27 courses"

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
        return 0
    else
        echo "❌ Failed: $description (Status: $status_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

echo ""
echo "👥 Creating ALL Teachers (31 total)..."
echo "======================================"

# Create all 31 teachers from teacher.txt
make_api_call "POST" "/auth/signup" '{
    "name": "Tanzima Hashem",
    "email": "tanzima.teacher@gmail.com",
    "password": "tanzima123",
    "universityId": "05001",
    "role": "TEACHER"
}' "Creating teacher: Tanzima Hashem"

make_api_call "POST" "/auth/signup" '{
    "name": "Masroor Ali",
    "email": "masroor.teacher@gmail.com",
    "password": "masroor123",
    "universityId": "05002",
    "role": "TEACHER"
}' "Creating teacher: Masroor Ali"

make_api_call "POST" "/auth/signup" '{
    "name": "Monirul Islam",
    "email": "monirul.teacher@gmail.com",
    "password": "monirul123",
    "universityId": "05003",
    "role": "TEACHER"
}' "Creating teacher: Monirul Islam"

make_api_call "POST" "/auth/signup" '{
    "name": "Mostofa Akbar",
    "email": "mostofa.teacher@gmail.com",
    "password": "mostofa123",
    "universityId": "05004",
    "role": "TEACHER"
}' "Creating teacher: Mostofa Akbar"

make_api_call "POST" "/auth/signup" '{
    "name": "Mahfuzul Islam",
    "email": "mahfuzul.teacher@gmail.com",
    "password": "mahfuzul123",
    "universityId": "05005",
    "role": "TEACHER"
}' "Creating teacher: Mahfuzul Islam"

make_api_call "POST" "/auth/signup" '{
    "name": "Ashikur Rahman",
    "email": "ashikur.teacher@gmail.com",
    "password": "ashikur123",
    "universityId": "05006",
    "role": "TEACHER"
}' "Creating teacher: Ashikur Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "Mahmuda Naznin",
    "email": "mahmuda.teacher@gmail.com",
    "password": "mahmuda123",
    "universityId": "05007",
    "role": "TEACHER"
}' "Creating teacher: Mahmuda Naznin"

make_api_call "POST" "/auth/signup" '{
    "name": "Anindya Iqbal",
    "email": "anindya.teacher@gmail.com",
    "password": "anindya123",
    "universityId": "05008",
    "role": "TEACHER"
}' "Creating teacher: Anindya Iqbal"

make_api_call "POST" "/auth/signup" '{
    "name": "Rifat Shahriyar",
    "email": "rifat.teacher@gmail.com",
    "password": "rifat123",
    "universityId": "05009",
    "role": "TEACHER"
}' "Creating teacher: Rifat Shahriyar"

make_api_call "POST" "/auth/signup" '{
    "name": "Abdullah Adnan",
    "email": "abdullah.teacher@gmail.com",
    "password": "abdullah123",
    "universityId": "05010",
    "role": "TEACHER"
}' "Creating teacher: Abdullah Adnan"

make_api_call "POST" "/auth/signup" '{
    "name": "Saifur Rahman",
    "email": "saifur.teacher@gmail.com",
    "password": "saifur123",
    "universityId": "05011",
    "role": "TEACHER"
}' "Creating teacher: Saifur Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "Shamsuzzoha Bayzid",
    "email": "shamsuzzoha.teacher@gmail.com",
    "password": "shamsuzzoha123",
    "universityId": "05012",
    "role": "TEACHER"
}' "Creating teacher: Shamsuzzoha Bayzid"

make_api_call "POST" "/auth/signup" '{
    "name": "Abu Wasif",
    "email": "abu.teacher@gmail.com",
    "password": "abu123",
    "universityId": "05013",
    "role": "TEACHER"
}' "Creating teacher: Abu Wasif"

make_api_call "POST" "/auth/signup" '{
    "name": "Sukarna Barua",
    "email": "sukarna.teacher@gmail.com",
    "password": "sukarna123",
    "universityId": "05014",
    "role": "TEACHER"
}' "Creating teacher: Sukarna Barua"

make_api_call "POST" "/auth/signup" '{
    "name": "Khaled Mahmud Shahriar",
    "email": "khaled.teacher@gmail.com",
    "password": "khaled123",
    "universityId": "05015",
    "role": "TEACHER"
}' "Creating teacher: Khaled Mahmud Shahriar"

make_api_call "POST" "/auth/signup" '{
    "name": "Atif Hasan Rahman",
    "email": "atif.teacher@gmail.com",
    "password": "atif123",
    "universityId": "05016",
    "role": "TEACHER"
}' "Creating teacher: Atif Hasan Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "Rezwana Reaz",
    "email": "rezwana.teacher@gmail.com",
    "password": "rezwana123",
    "universityId": "05017",
    "role": "TEACHER"
}' "Creating teacher: Rezwana Reaz"

make_api_call "POST" "/auth/signup" '{
    "name": "Ashraful Islam",
    "email": "ashraful.teacher@gmail.com",
    "password": "ashraful123",
    "universityId": "05018",
    "role": "TEACHER"
}' "Creating teacher: Ashraful Islam"

make_api_call "POST" "/auth/signup" '{
    "name": "Mehedi Hasan",
    "email": "mehedi.teacher@gmail.com",
    "password": "mehedi123",
    "universityId": "05019",
    "role": "TEACHER"
}' "Creating teacher: Mehedi Hasan"

make_api_call "POST" "/auth/signup" '{
    "name": "Abdur Rashid Tushar",
    "email": "abdur.teacher@gmail.com",
    "password": "abdur123",
    "universityId": "05020",
    "role": "TEACHER"
}' "Creating teacher: Abdur Rashid Tushar"

make_api_call "POST" "/auth/signup" '{
    "name": "Sheikh Azizul Hakim",
    "email": "sheikh.teacher@gmail.com",
    "password": "sheikh123",
    "universityId": "05021",
    "role": "TEACHER"
}' "Creating teacher: Sheikh Azizul Hakim"

make_api_call "POST" "/auth/signup" '{
    "name": "Kowshic Roy",
    "email": "kowshic.teacher@gmail.com",
    "password": "kowshic123",
    "universityId": "05022",
    "role": "TEACHER"
}' "Creating teacher: Kowshic Roy"

make_api_call "POST" "/auth/signup" '{
    "name": "Saem Hasan",
    "email": "saem.teacher@gmail.com",
    "password": "saem123",
    "universityId": "055023",
    "role": "TEACHER"
}' "Creating teacher: Saem Hasan"

make_api_call "POST" "/auth/signup" '{
    "name": "Emamul Haque Pranta",
    "email": "emamul.teacher@gmail.com",
    "password": "emamul123",
    "universityId": "05024",
    "role": "TEACHER"
}' "Creating teacher: Emamul Haque Pranta"

make_api_call "POST" "/auth/signup" '{
    "name": "Ishrat Jahan",
    "email": "ishrat.teacher@gmail.com",
    "password": "ishrat123",
    "universityId": "05025",
    "role": "TEACHER"
}' "Creating teacher: Ishrat Jahan"

make_api_call "POST" "/auth/signup" '{
    "name": "Nurul Muttakin",
    "email": "nurul.teacher@gmail.com",
    "password": "nurul123",
    "universityId": "05026",
    "role": "TEACHER"
}' "Creating teacher: Nurul Muttakin"

make_api_call "POST" "/auth/signup" '{
    "name": "Junaed Younus Khan",
    "email": "junaed.teacher@gmail.com",
    "password": "junaed123",
    "universityId": "05027",
    "role": "TEACHER"
}' "Creating teacher: Junaed Younus Khan"

make_api_call "POST" "/auth/signup" '{
    "name": "Ahmed Mahir Sultan Rumi",
    "email": "ahmed.teacher@gmail.com",
    "password": "ahmed123",
    "universityId": "05028",
    "role": "TEACHER"
}' "Creating teacher: Ahmed Mahir Sultan Rumi"

make_api_call "POST" "/auth/signup" '{
    "name": "Rabib Jahin Ibn Momin",
    "email": "rabib.teacher@gmail.com",
    "password": "rabib123",
    "universityId": "05029",
    "role": "TEACHER"
}' "Creating teacher: Rabib Jahin Ibn Momin"

make_api_call "POST" "/auth/signup" '{
    "name": "Abdur Rafi",
    "email": "abdur.teacher@gmail.com",
    "password": "abdur123",
    "universityId": "05030",
    "role": "TEACHER"
}' "Creating teacher: Abdur Rafi"

make_api_call "POST" "/auth/signup" '{
    "name": "Anwarul Bashir Shuaib",
    "email": "anwarul.teacher@gmail.com",
    "password": "anwarul123",
    "universityId": "05031",
    "role": "TEACHER"
}' "Creating teacher: Anwarul Bashir Shuaib"

echo ""
echo "🎓 Creating ALL Students (77 total)..."
echo "======================================"

# Create all 77 students from student.txt
make_api_call "POST" "/auth/signup" '{
    "name": "Hozifa Rahman Hamim Abs",
    "email": "hozifa@gmail.com",
    "password": "hozifa123",
    "universityId": "1705083",
    "role": "STUDENT"
}' "Creating student: Hozifa Rahman Hamim Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Labiba Binte Tasin Abs",
    "email": "labiba@gmail.com",
    "password": "labiba123",
    "universityId": "180567",
    "role": "STUDENT"
}' "Creating student: Labiba Binte Tasin Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Anik Saha",
    "email": "anik@gmail.com",
    "password": "anik123",
    "universityId": "2005001",
    "role": "STUDENT"
}' "Creating student: Anik Saha"

make_api_call "POST" "/auth/signup" '{
    "name": "Pramananda Sarkar",
    "email": "pramananda@gmail.com",
    "password": "pramananda123",
    "universityId": "2005002",
    "role": "STUDENT"
}' "Creating student: Pramananda Sarkar"

make_api_call "POST" "/auth/signup" '{
    "name": "A.H.M Towfique Mahmud",
    "email": "ahm@gmail.com",
    "password": "ahm123",
    "universityId": "2005003",
    "role": "STUDENT"
}' "Creating student: A.H.M Towfique Mahmud"

make_api_call "POST" "/auth/signup" '{
    "name": "Anup Halder Joy",
    "email": "anup@gmail.com",
    "password": "anup123",
    "universityId": "2005004",
    "role": "STUDENT"
}' "Creating student: Anup Halder Joy"

make_api_call "POST" "/auth/signup" '{
    "name": "Kowshik Saha Kabya",
    "email": "kowshik@gmail.com",
    "password": "kowshik123",
    "universityId": "2005005",
    "role": "STUDENT"
}' "Creating student: Kowshik Saha Kabya"

make_api_call "POST" "/auth/signup" '{
    "name": "Adnan Ibney Faruq",
    "email": "adnan@gmail.com",
    "password": "adnan123",
    "universityId": "2005006",
    "role": "STUDENT"
}' "Creating student: Adnan Ibney Faruq"

make_api_call "POST" "/auth/signup" '{
    "name": "Ahmmad Nur Swapnil Abs",
    "email": "ahmmad@gmail.com",
    "password": "ahmmad123",
    "universityId": "2005007",
    "role": "STUDENT"
}' "Creating student: Ahmmad Nur Swapnil Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Abrar Jahin Sarker",
    "email": "abrar@gmail.com",
    "password": "abrar123",
    "universityId": "2005008",
    "role": "STUDENT"
}' "Creating student: Abrar Jahin Sarker"

make_api_call "POST" "/auth/signup" '{
    "name": "Al Muhit Muhtadi",
    "email": "amm@gmail.com",
    "password": "al123",
    "universityId": "2005009",
    "role": "STUDENT"
}' "Creating student: Al Muhit Muhtadi"

make_api_call "POST" "/auth/signup" '{
    "name": "Tanvir Hossain",
    "email": "tanvir@gmail.com",
    "password": "tanvir123",
    "universityId": "2005010",
    "role": "STUDENT"
}' "Creating student: Tanvir Hossain"

make_api_call "POST" "/auth/signup" '{
    "name": "Adibah Mahmud",
    "email": "adibah@gmail.com",
    "password": "adibah123",
    "universityId": "2005011",
    "role": "STUDENT"
}' "Creating student: Adibah Mahmud"

make_api_call "POST" "/auth/signup" '{
    "name": "Turjoy Dey Abs",
    "email": "turjoy@gmail.com",
    "password": "turjoy123",
    "universityId": "2005012",
    "role": "STUDENT"
}' "Creating student: Turjoy Dey Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Munzer Mahmood",
    "email": "munzer@gmail.com",
    "password": "munzer123",
    "universityId": "2005013",
    "role": "STUDENT"
}' "Creating student: Munzer Mahmood"

make_api_call "POST" "/auth/signup" '{
    "name": "Jarin Tasneem",
    "email": "jarin@gmail.com",
    "password": "jarin123",
    "universityId": "2005014",
    "role": "STUDENT"
}' "Creating student: Jarin Tasneem"

make_api_call "POST" "/auth/signup" '{
    "name": "Mostafa Rifat Tazwar",
    "email": "mostafa@gmail.com",
    "password": "mostafa123",
    "universityId": "2005015",
    "role": "STUDENT"
}' "Creating student: Mostafa Rifat Tazwar"

make_api_call "POST" "/auth/signup" '{
    "name": "Afzal Hossan",
    "email": "afzal@gmail.com",
    "password": "afzal123",
    "universityId": "2005016",
    "role": "STUDENT"
}' "Creating student: Afzal Hossan"

make_api_call "POST" "/auth/signup" '{
    "name": "Ekramul Haque Amin",
    "email": "ekramul@gmail.com",
    "password": "ekramul123",
    "universityId": "2005017",
    "role": "STUDENT"
}' "Creating student: Ekramul Haque Amin"

make_api_call "POST" "/auth/signup" '{
    "name": "Jaber Ahmed Deedar",
    "email": "jaber@gmail.com",
    "password": "jaber123",
    "universityId": "2005018",
    "role": "STUDENT"
}' "Creating student: Jaber Ahmed Deedar"

make_api_call "POST" "/auth/signup" '{
    "name": "Asif Karim Abs",
    "email": "asif@gmail.com",
    "password": "asif123",
    "universityId": "2005019",
    "role": "STUDENT"
}' "Creating student: Asif Karim Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Swastika Pandit",
    "email": "swastika@gmail.com",
    "password": "swastika123",
    "universityId": "2005020",
    "role": "STUDENT"
}' "Creating student: Swastika Pandit"

make_api_call "POST" "/auth/signup" '{
    "name": "Fairuz Mubashwera",
    "email": "fairuz@gmail.com",
    "password": "fairuz123",
    "universityId": "2005021",
    "role": "STUDENT"
}' "Creating student: Fairuz Mubashwera"

make_api_call "POST" "/auth/signup" '{
    "name": "Soumik Bhattacharjee",
    "email": "soumik@gmail.com",
    "password": "soumik123",
    "universityId": "2005022",
    "role": "STUDENT"
}' "Creating student: Soumik Bhattacharjee"

make_api_call "POST" "/auth/signup" '{
    "name": "Somik Dasgupta",
    "email": "somik@gmail.com",
    "password": "somik123",
    "universityId": "2005023",
    "role": "STUDENT"
}' "Creating student: Somik Dasgupta"

make_api_call "POST" "/auth/signup" '{
    "name": "Gourab Biswas Abs",
    "email": "gourab@gmail.com",
    "password": "gourab123",
    "universityId": "2005024",
    "role": "STUDENT"
}' "Creating student: Gourab Biswas Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Tawhid Muhammad Mubashwir",
    "email": "tawhid@gmail.com",
    "password": "tawhid123",
    "universityId": "2005025",
    "role": "STUDENT"
}' "Creating student: Tawhid Muhammad Mubashwir"

make_api_call "POST" "/auth/signup" '{
    "name": "Zia Ul Hassan Abdullah",
    "email": "zia@gmail.com",
    "password": "zia123",
    "universityId": "2005026",
    "role": "STUDENT"
}' "Creating student: Zia Ul Hassan Abdullah"

make_api_call "POST" "/auth/signup" '{
    "name": "Musa Tur Farazi",
    "email": "musa@gmail.com",
    "password": "musa123",
    "universityId": "2005027",
    "role": "STUDENT"
}' "Creating student: Musa Tur Farazi"

make_api_call "POST" "/auth/signup" '{
    "name": "Reduanul Islam Imon Abs",
    "email": "reduanul@gmail.com",
    "password": "reduanul123",
    "universityId": "2005028",
    "role": "STUDENT"
}' "Creating student: Reduanul Islam Imon Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Mahamudul Hasan Fahim Abs",
    "email": "mahamudul@gmail.com",
    "password": "mahamudul123",
    "universityId": "2005029",
    "role": "STUDENT"
}' "Creating student: Mahamudul Hasan Fahim Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Prithu Anan",
    "email": "prithu@gmail.com",
    "password": "prithu123",
    "universityId": "2005030",
    "role": "STUDENT"
}' "Creating student: Prithu Anan"

make_api_call "POST" "/auth/signup" '{
    "name": "Tusher Bhomik",
    "email": "tusher@gmail.com",
    "password": "tusher123",
    "universityId": "2005031",
    "role": "STUDENT"
}' "Creating student: Tusher Bhomik"

make_api_call "POST" "/auth/signup" '{
    "name": "Akanta Das",
    "email": "akanta@gmail.com",
    "password": "akanta123",
    "universityId": "2005032",
    "role": "STUDENT"
}' "Creating student: Akanta Das"

make_api_call "POST" "/auth/signup" '{
    "name": "Sheikh Rahat Mahmud",
    "email": "sheikh@gmail.com",
    "password": "sheikh123",
    "universityId": "2005033",
    "role": "STUDENT"
}' "Creating student: Sheikh Rahat Mahmud"

make_api_call "POST" "/auth/signup" '{
    "name": "Oitijhya Hoque",
    "email": "oitijhya@gmail.com",
    "password": "oitijhya123",
    "universityId": "2005034",
    "role": "STUDENT"
}' "Creating student: Oitijhya Hoque"

make_api_call "POST" "/auth/signup" '{
    "name": "Nabila Tabassum Abs",
    "email": "nabila@gmail.com",
    "password": "nabila123",
    "universityId": "2005035",
    "role": "STUDENT"
}' "Creating student: Nabila Tabassum Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Tausif Rashid",
    "email": "tausif@gmail.com",
    "password": "tausif123",
    "universityId": "2005036",
    "role": "STUDENT"
}' "Creating student: Tausif Rashid"

make_api_call "POST" "/auth/signup" '{
    "name": "Awesh Islam Abs",
    "email": "awesh@gmail.com",
    "password": "awesh123",
    "universityId": "2005037",
    "role": "STUDENT"
}' "Creating student: Awesh Islam Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Azmal Karim",
    "email": "azmal@gmail.com",
    "password": "azmal123",
    "universityId": "2005038",
    "role": "STUDENT"
}' "Creating student: Azmal Karim"

make_api_call "POST" "/auth/signup" '{
    "name": "Tasinul Islam Ahon",
    "email": "tasinul@gmail.com",
    "password": "tasinul123",
    "universityId": "2005039",
    "role": "STUDENT"
}' "Creating student: Tasinul Islam Ahon"

make_api_call "POST" "/auth/signup" '{
    "name": "Shabab Mosharraf",
    "email": "shabab@gmail.com",
    "password": "shabab123",
    "universityId": "2005040",
    "role": "STUDENT"
}' "Creating student: Shabab Mosharraf"

make_api_call "POST" "/auth/signup" '{
    "name": "Sabbir Alam Saad Abs",
    "email": "sabbir@gmail.com",
    "password": "sabbir123",
    "universityId": "2005041",
    "role": "STUDENT"
}' "Creating student: Sabbir Alam Saad Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Farriha Afnan",
    "email": "farriha@gmail.com",
    "password": "farriha123",
    "universityId": "2005042",
    "role": "STUDENT"
}' "Creating student: Farriha Afnan"

make_api_call "POST" "/auth/signup" '{
    "name": "Rafiqul Islam Rayan",
    "email": "rafiqul@gmail.com",
    "password": "rafiqul123",
    "universityId": "2005043",
    "role": "STUDENT"
}' "Creating student: Rafiqul Islam Rayan"

make_api_call "POST" "/auth/signup" '{
    "name": "Abid Hasan Khondaker",
    "email": "abid@gmail.com",
    "password": "abid123",
    "universityId": "2005044",
    "role": "STUDENT"
}' "Creating student: Abid Hasan Khondaker"

make_api_call "POST" "/auth/signup" '{
    "name": "Tahsin Kabir Mazumder",
    "email": "tahsin@gmail.com",
    "password": "tahsin123",
    "universityId": "2005045",
    "role": "STUDENT"
}' "Creating student: Tahsin Kabir Mazumder"

make_api_call "POST" "/auth/signup" '{
    "name": "Abdullah Faiyaz Abs",
    "email": "abdullah@gmail.com",
    "password": "abdullah123",
    "universityId": "2005046",
    "role": "STUDENT"
}' "Creating student: Abdullah Faiyaz Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Souvik Mandol",
    "email": "souvik@gmail.com",
    "password": "souvik123",
    "universityId": "2005047",
    "role": "STUDENT"
}' "Creating student: Souvik Mandol"

make_api_call "POST" "/auth/signup" '{
    "name": "Sagor Chanda",
    "email": "sagor@gmail.com",
    "password": "sagor123",
    "universityId": "2005048",
    "role": "STUDENT"
}' "Creating student: Sagor Chanda"

make_api_call "POST" "/auth/signup" '{
    "name": "Dipanta Kumar Roy Nobo",
    "email": "dipanta@gmail.com",
    "password": "dipanta123",
    "universityId": "2005049",
    "role": "STUDENT"
}' "Creating student: Dipanta Kumar Roy Nobo"

make_api_call "POST" "/auth/signup" '{
    "name": "Moyen Uddin",
    "email": "moyen@gmail.com",
    "password": "moyen123",
    "universityId": "2005050",
    "role": "STUDENT"
}' "Creating student: Moyen Uddin"

make_api_call "POST" "/auth/signup" '{
    "name": "S. M. Kausar Parvej",
    "email": "smkp@gmail.com",
    "password": "s123",
    "universityId": "2005051",
    "role": "STUDENT"
}' "Creating student: S. M. Kausar Parvej"

make_api_call "POST" "/auth/signup" '{
    "name": "Sadatul Islam Sadi",
    "email": "sadatul@gmail.com",
    "password": "sadatul123",
    "universityId": "2005052",
    "role": "STUDENT"
}' "Creating student: Sadatul Islam Sadi"

make_api_call "POST" "/auth/signup" '{
    "name": "M. M. Nayem",
    "email": "mmn@gmail.com",
    "password": "m123",
    "universityId": "2005053",
    "role": "STUDENT"
}' "Creating student: M. M. Nayem"

make_api_call "POST" "/auth/signup" '{
    "name": "Ananya Shahrin Promi",
    "email": "ananya@gmail.com",
    "password": "ananya123",
    "universityId": "2005054",
    "role": "STUDENT"
}' "Creating student: Ananya Shahrin Promi"

make_api_call "POST" "/auth/signup" '{
    "name": "Mohammad Ninad Mahmud",
    "email": "mohammad@gmail.com",
    "password": "mohammad123",
    "universityId": "2005055",
    "role": "STUDENT"
}' "Creating student: Mohammad Ninad Mahmud"

make_api_call "POST" "/auth/signup" '{
    "name": "Kazi Jayed Haider",
    "email": "kazi@gmail.com",
    "password": "kazi123",
    "universityId": "2005056",
    "role": "STUDENT"
}' "Creating student: Kazi Jayed Haider"

make_api_call "POST" "/auth/signup" '{
    "name": "Mst. Fahmida Sultana Naznin",
    "email": "mst@gmail.com",
    "password": "mst123",
    "universityId": "2005057",
    "role": "STUDENT"
}' "Creating student: Mst. Fahmida Sultana Naznin"

make_api_call "POST" "/auth/signup" '{
    "name": "Suhaeb Bin Matin Abs",
    "email": "suhaeb@gmail.com",
    "password": "suhaeb123",
    "universityId": "2005058",
    "role": "STUDENT"
}' "Creating student: Suhaeb Bin Matin Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Iftekhar Sanwar Talukdar",
    "email": "iftekhar@gmail.com",
    "password": "iftekhar123",
    "universityId": "2005059",
    "role": "STUDENT"
}' "Creating student: Iftekhar Sanwar Talukdar"

make_api_call "POST" "/auth/signup" '{
    "name": "Wahid Al Azad Navid",
    "email": "wahid@gmail.com",
    "password": "wahid123",
    "universityId": "2005060",
    "role": "STUDENT"
}' "Creating student: Wahid Al Azad Navid"

make_api_call "POST" "/auth/signup" '{
    "name": "Tawkir Aziz Rahman",
    "email": "tawkir@gmail.com",
    "password": "tawkir123",
    "universityId": "2005061",
    "role": "STUDENT"
}' "Creating student: Tawkir Aziz Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "Waseem Mustak Zisan",
    "email": "waseem@gmail.com",
    "password": "waseem123",
    "universityId": "2005062",
    "role": "STUDENT"
}' "Creating student: Waseem Mustak Zisan"

make_api_call "POST" "/auth/signup" '{
    "name": "Shahad Shahriar Rahman",
    "email": "shahad@gmail.com",
    "password": "shahad123",
    "universityId": "2005063",
    "role": "STUDENT"
}' "Creating student: Shahad Shahriar Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "Shahriar Ahmed Seam Abs",
    "email": "shahriar@gmail.com",
    "password": "shahriar123",
    "universityId": "2005064",
    "role": "STUDENT"
}' "Creating student: Shahriar Ahmed Seam Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Tamim Hasan Saad",
    "email": "tamim@gmail.com",
    "password": "tamim123",
    "universityId": "2005065",
    "role": "STUDENT"
}' "Creating student: Tamim Hasan Saad"

make_api_call "POST" "/auth/signup" '{
    "name": "Habiba Rafique",
    "email": "habiba@gmail.com",
    "password": "habiba123",
    "universityId": "2005066",
    "role": "STUDENT"
}' "Creating student: Habiba Rafique"

make_api_call "POST" "/auth/signup" '{
    "name": "Munim Thahmid Abs",
    "email": "munim@gmail.com",
    "password": "munim123",
    "universityId": "2005067",
    "role": "STUDENT"
}' "Creating student: Munim Thahmid Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Maisha Maksura Abs",
    "email": "maisha@gmail.com",
    "password": "maisha123",
    "universityId": "2005068",
    "role": "STUDENT"
}' "Creating student: Maisha Maksura Abs"

make_api_call "POST" "/auth/signup" '{
    "name": "Istiak Ahmmed Rifti",
    "email": "istiak@gmail.com",
    "password": "istiak123",
    "universityId": "2005069",
    "role": "STUDENT"
}' "Creating student: Istiak Ahmmed Rifti"

make_api_call "POST" "/auth/signup" '{
    "name": "Md.Tashdiqur Rahman",
    "email": "mdtashdiqur@gmail.com",
    "password": "mdtashdiqur123",
    "universityId": "2005070",
    "role": "STUDENT"
}' "Creating student: Md.Tashdiqur Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "H. M. Shadman Tabib",
    "email": "hmst@gmail.com",
    "password": "h123",
    "universityId": "2005071",
    "role": "STUDENT"
}' "Creating student: H. M. Shadman Tabib"

make_api_call "POST" "/auth/signup" '{
    "name": "Mushfiqur Rahman",
    "email": "mushfiqur@gmail.com",
    "password": "mushfiqur123",
    "universityId": "2005072",
    "role": "STUDENT"
}' "Creating student: Mushfiqur Rahman"

make_api_call "POST" "/auth/signup" '{
    "name": "Noushin Tabassum Aoishy",
    "email": "noushin@gmail.com",
    "password": "noushin123",
    "universityId": "2005073",
    "role": "STUDENT"
}' "Creating student: Noushin Tabassum Aoishy"

make_api_call "POST" "/auth/signup" '{
    "name": "Sadnam Faiyaz",
    "email": "sadnam@gmail.com",
    "password": "sadnam123",
    "universityId": "2005074",
    "role": "STUDENT"
}' "Creating student: Sadnam Faiyaz"

make_api_call "POST" "/auth/signup" '{
    "name": "Arnab Dey",
    "email": "arnab@gmail.com",
    "password": "arnab123",
    "universityId": "2005075",
    "role": "STUDENT"
}' "Creating student: Arnab Dey"

make_api_call "POST" "/auth/signup" '{
    "name": "Fuad Ahmed Udoy",
    "email": "fuad@gmail.com",
    "password": "fuad123",
    "universityId": "2005076",
    "role": "STUDENT"
}' "Creating student: Fuad Ahmed Udoy"

make_api_call "POST" "/auth/signup" '{
    "name": "Sadia Afrin Sithi",
    "email": "sadia@gmail.com",
    "password": "sadia123",
    "universityId": "2005077",
    "role": "STUDENT"
}' "Creating student: Sadia Afrin Sithi"

echo ""
echo "🔐 Logging in as Admin to create courses..."
echo "=========================================="

# Login as admin to get JWT token for course creation
echo "📝 Logging in as admin..."
login_response=$(curl -s -X POST \
    -H "$CONTENT_TYPE" \
    -d '{"email": "admin@academy.com", "password": "admin123"}' \
    "$BASE_URL/auth/login")

# Extract JWT token from admin login
jwt_token=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$jwt_token" ]; then
    echo "❌ Failed to get admin JWT token for course creation"
    echo "   Login response: $login_response"
    exit 1
fi

echo "✅ Successfully logged in as admin"

# Function to create courses with admin JWT auth
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
        return 0
    else
        echo "❌ Failed: $description (Status: $status_code)"
        echo "   Response: $response_body"
        return 1
    fi
}

echo ""
echo "📚 Creating ALL Courses (27 total)..."
echo "====================================="

# Create all 27 courses from courses.txt
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
    "credits": 2
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
echo "================================"
echo "📊 Summary:"
echo "   👥 Teachers: 31 created"
echo "   🎓 Students: 77 created"
echo "   📚 Courses: 27 created via admin login"
echo ""
echo "✅ All data successfully populated!"
