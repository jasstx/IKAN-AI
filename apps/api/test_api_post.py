import urllib.request
import urllib.error
import json

url = 'https://ikanai-api.onrender.com/api/v1/feedbacks/?qr_code=QR-ORANGE-TUNIS-01'
payload = {'note': 5, 'commentaire': 'Test debug submit'}
data = json.dumps(payload).encode('utf-8')
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=data, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("BODY:", response.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP ERROR CODE:", e.code)
    print("HTTP ERROR BODY:", e.read().decode('utf-8'))
except Exception as e:
    print("OTHER ERROR:", e)
