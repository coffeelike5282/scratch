
import json
import os

file_path = r'd:\AI\Antigravity\ainolza-clipper-senior-friendly\AINOLZA_Clipper_v1.3\manifest.json'

def check_encoding(encoding_name):
    try:
        with open(file_path, 'r', encoding=encoding_name) as f:
            content = f.read()
        print(f"Successfully read with {encoding_name}")
        # Print a snippet to see if characters look right
        print(f"Snippet: {content[100:200]}") 
        return True
    except UnicodeDecodeError:
        print(f"Failed to read with {encoding_name}")
        return False
    except Exception as e:
        print(f"Error with {encoding_name}: {e}")
        return False

print("Testing UTF-8...")
is_utf8 = check_encoding('utf-8')

print("\nTesting CP949 (EUC-KR)...")
is_cp949 = check_encoding('cp949')

if is_cp949 and not is_utf8:
    print("\nCONCLUSION: File is likely CP949/EUC-KR encoded, not UTF-8.")
elif is_utf8:
    print("\nCONCLUSION: File is valid UTF-8.")
else:
    print("\nCONCLUSION: Unknown encoding issue.")
