import json
import re

def map_raw_to_manna(raw):
    verse = raw.get('verse', '')
    meaning = raw.get('meaning', '')
    
    return {
        "date": raw.get('date', ''),
        "verseRef": raw.get('reference', ''),
        "verseText": verse.replace('<br>', '\n'),
        "fullVerse": verse.replace('<br>', ' '),
        "interpretation": meaning.replace('<br>', '\n'),
        "mission": raw.get('mission', ''),
        "verseRefEn": raw.get('reference_en', ''),
        "verseTextEn": raw.get('verse_en', '').replace('<br>', '\n') if raw.get('verse_en') else '',
        "fullVerseEn": raw.get('verse_en', '').replace('<br>', ' ') if raw.get('verse_en') else '',
        "interpretationEn": raw.get('meaning_en', '').replace('<br>', '\n') if raw.get('meaning_en') else '',
        "missionEn": raw.get('mission_en', '')
    }

input_path = r'd:\AI\Antigravity\Today-s-Manna\data\mannaData.ts'
output_path = r'd:\AI\Antigravity\Today-s-Manna native\data\mannaData.ts'

with open(input_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Extract the array content
# Match the part after "export const MANNA_DATA: any[] = [" and before the final "];"
match = re.search(r'export const MANNA_DATA: any\[\] = (\[[\s\S]*\]);', content)
if not match:
    # Try another pattern if the first one fails (sometimes the type varies)
    match = re.search(r'export const MANNA_DATA = (\[[\s\S]*\]);', content)

if match:
    array_str = match.group(1)
    # The string might not be strict JSON (e.g., trailing commas, backticks, etc.)
    # But since it's a TS file, we can try to evaluate it as JSON if it's clean enough, 
    # or just use a regex to find all objects.
    
    # Simple workaround: use json.loads but fix common TS/JS quirks
    # Actually, the file looks like it has standard JSON-like objects.
    
    # 1. Remove trailing commas
    clean_array_str = re.sub(r',\s*]', ']', array_str)
    clean_array_str = re.sub(r',\s*}', '}', clean_array_str)
    
    try:
        raw_data = json.loads(clean_array_str)
        mapped_data = [map_raw_to_manna(item) for item in raw_data]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("import { MannaData } from '../types/types';\n\n")
            f.write("export const MANNA_DATA: MannaData[] = ")
            json.dump(mapped_data, f, ensure_ascii=False, indent=4)
            f.write(";\n")
        print(f"Successfully mapped and wrote {len(mapped_data)} records.")
    except Exception as e:
        print(f"Failed to parse or map: {e}")
else:
    print("Could not find MANNA_DATA array.")
