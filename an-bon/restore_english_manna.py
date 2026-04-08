import urllib.request
import json
import re
import os

url = 'https://gist.githubusercontent.com/coffeelike5282/c7cf8073dbd29b6d6fa66450d438803a/raw/content_data.js'
output_path = r'd:\AI\Antigravity\Today-s-Manna native\data\mannaData.ts'

def map_raw_to_manna(raw):
    verse = raw.get('verse', '')
    meaning = raw.get('meaning', '')
    verse_en = raw.get('verse_en', '')
    meaning_en = raw.get('meaning_en', '')

    return {
        "date": raw.get('date', ''),
        "verseRef": raw.get('reference', ''),
        "verseText": verse.replace('<br>', '\n'),
        "fullVerse": verse.replace('<br>', ' '),
        "interpretation": meaning.replace('<br>', '\n'),
        "mission": raw.get('mission', ''),
        "verseRefEn": raw.get('reference_en', ''),
        "verseTextEn": verse_en.replace('<br>', '\n') if verse_en else '',
        "fullVerseEn": verse_en.replace('<br>', ' ') if verse_en else '',
        "interpretationEn": meaning_en.replace('<br>', '\n') if meaning_en else '',
        "missionEn": raw.get('mission_en', '')
    }

try:
    print(f"Fetching data from {url}...")
    with urllib.request.urlopen(url) as response:
        text = response.read().decode('utf-8')

    json_match = re.search(r'const\s+(content_data|MANNA_DATA)\s*=\s*(\[[\s\S]*\]);', text)
    if json_match:
        json_str = json_match.group(2)
        json_str = re.sub(r',\s*]', ']', json_str)
        json_str = re.sub(r',\s*}', '}', json_str)
        
        raw_data = json.loads(json_str)
        print(f"Successfully parsed {len(raw_data)} records.")
        
        mapped_data = [map_raw_to_manna(item) for item in raw_data]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("import { MannaData } from '../types/types';\n\n")
            f.write("export const MANNA_DATA: MannaData[] = ")
            json.dump(mapped_data, f, ensure_ascii=False, indent=4)
            f.write(";\n")
            
        print(f"Successfully restored {len(mapped_data)} records to {output_path}")
    else:
        print("Could not find data array in the JS file.")

except Exception as e:
    print(f"Error: {e}")
