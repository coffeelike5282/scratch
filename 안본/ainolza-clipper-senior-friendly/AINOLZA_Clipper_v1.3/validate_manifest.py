
import json
import os

file_path = r'd:\AI\Antigravity\ainolza-clipper-senior-friendly\AINOLZA_Clipper_v1.3\manifest.json'

try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Check for BOM
    if content.startswith('\ufeff'):
        print("BOM detected")
        content = content.lstrip('\ufeff')
    else:
        print("No BOM detected")

    data = json.loads(content)
    print("JSON is valid")
    print(json.dumps(data, indent=2, ensure_ascii=False))
except json.JSONDecodeError as e:
    print(f"JSON Error: {e}")
except Exception as e:
    print(f"Error: {e}")
