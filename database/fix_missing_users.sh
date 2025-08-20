#!/bin/bash

# Fix missing users from the previous population script
BASE_URL="http://localhost:8081/api"
CONTENT_TYPE="Content-Type: application/json"

echo "🔧 Fixing missing users with corrected data..."

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

echo "👥 Creating missing teacher with corrected email..."
make_api_call "POST" "/auth/signup" '{
    "name": "Abdur Rafi",
    "email": "abdurrafi.teacher@gmail.com",
    "password": "abdurrafi123",
    "universityId": "05030",
    "role": "TEACHER"
}' "Creating teacher: Abdur Rafi (corrected email)"

echo ""
echo "🎓 Creating missing students with corrected passwords..."

make_api_call "POST" "/auth/signup" '{
    "name": "Al Muhit Muhtadi",
    "email": "amm@gmail.com",
    "password": "almuhit123",
    "universityId": "2005009",
    "role": "STUDENT"
}' "Creating student: Al Muhit Muhtadi (corrected password)"

make_api_call "POST" "/auth/signup" '{
    "name": "S. M. Kausar Parvej",
    "email": "smkp@gmail.com",
    "password": "smkausar123",
    "universityId": "2005051",
    "role": "STUDENT"
}' "Creating student: S. M. Kausar Parvej (corrected password)"

make_api_call "POST" "/auth/signup" '{
    "name": "M. M. Nayem",
    "email": "mmn@gmail.com",
    "password": "mmnayem123",
    "universityId": "2005053",
    "role": "STUDENT"
}' "Creating student: M. M. Nayem (corrected password)"

make_api_call "POST" "/auth/signup" '{
    "name": "H. M. Shadman Tabib",
    "email": "hmst@gmail.com",
    "password": "hmshadman123",
    "universityId": "2005071",
    "role": "STUDENT"
}' "Creating student: H. M. Shadman Tabib (corrected password)"

echo ""
echo "🎉 Missing users creation completed!"
echo "✅ All users should now be in the system!"
