import urllib.request
import urllib.parse
import json
import base64
from datetime import datetime

client_id = "ARg84mPd9LvJV-BJj1MSVIlbb4EKH8CXejuR0GCdIPE4vvDCVde72VNwBXbRks7j9gReGDfkWEN4LSnk"
secret = "EEdH2uTTP7BREl88fdwi-467IG1OFs9W6mIZSPPRDy2pys3j9k_2_5uX9uf9fJHTblXNMxxnW4ShoV-a"

url = "https://api-m.sandbox.paypal.com/v1/oauth2/token"
auth_str = f"{client_id}:{secret}"
auth_base64 = base64.b64encode(auth_str.encode()).decode()

headers = {
    "Accept": "application/json",
    "Accept-Language": "en_US",
    "Authorization": f"Basic {auth_base64}"
}
data = urllib.parse.urlencode({"grant_type": "client_credentials"}).encode()

try:
    req = urllib.request.Request(url, data=data, headers=headers)
    with urllib.request.urlopen(req) as response:
        token_data = json.loads(response.read().decode())
    
    # Save to PAYPAL_TOKEN.TXT
    with open("PAYPAL_TOKEN.TXT", "w", encoding="utf-8") as f:
        f.write("SANDBOX\n")
        f.write(f"\"access_token\":\"{token_data['access_token']}\"\n")
        f.write(f"\"token_type\":\"Bearer\",\"app_id\":\"{token_data.get('app_id', '')}\",\"expires_in\":{token_data['expires_in']},\n")
        f.write(f"\"nonce\":\"{datetime.now().isoformat()}Z\"\n")
        f.write("\n")
        f.write("LIVE\n")
        
    # Update start_server.bat
    bat_content = f"""@echo off
set PAYPAL_ACCESS_TOKEN={token_data['access_token']}
set PAYPAL_ENVIRONMENT=SANDBOX
node node_modules\\@paypal\\mcp\\dist\\index.js --tools=all
"""
    with open("start_server.bat", "w", encoding="utf-8") as f:
        f.write(bat_content)
        
    print(f"SUCCESS: Token updated. Expires in {token_data['expires_in']} seconds.")
    print(f"Token: {token_data['access_token'][:10]}...")

except Exception as e:
    print(f"ERROR: {str(e)}")
