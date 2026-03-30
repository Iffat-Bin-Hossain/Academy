import requests

try:
    response = requests.post("http://localhost:8081/api/auth/login", json={
        "email": "admin@academy.com",
        "password": "admin123"
    })
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
