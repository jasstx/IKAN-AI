import urllib.request
import urllib.error

endpoints = [
    'https://ikanai-api.onrender.com/health',
    'https://ikanai-api.onrender.com/api/v1/qr-codes/QR-ORANGE-TUNIS-01/validate',
]

for url in endpoints:
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as res:
            print(f"GET {url} -> {res.status} | {res.read().decode('utf-8')[:150]}")
    except urllib.error.HTTPError as e:
        print(f"GET {url} -> HTTP ERROR {e.code} | {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"GET {url} -> ERROR {e}")
