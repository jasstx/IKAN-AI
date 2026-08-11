import urllib.request
import urllib.error

url = 'https://ikanai-api.onrender.com/api/v1/qr-codes/QR-ORANGE-TUNIS-01/validate'

try:
    with urllib.request.urlopen(url) as res:
        print("STATUS:", res.status)
        print("BODY:", res.read().decode('utf-8'))
except urllib.error.HTTPError as e:
    print("HTTP CODE:", e.code)
    print("HTTP BODY:", e.read().decode('utf-8'))
except Exception as e:
    print("OTHER:", e)
