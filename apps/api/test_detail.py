import urllib.request
import urllib.error

url = 'https://ikanai-api.onrender.com/api/v1/qr-codes/QR-ORANGE-TUNIS-01/validate'

try:
    with urllib.request.urlopen(url) as res:
        print("SUCCESS:", res.read().decode())
except urllib.error.HTTPError as e:
    print("HTTP CODE:", e.code)
    print("HTTP BODY:", e.read().decode())
except Exception as e:
    print("OTHER:", e)
