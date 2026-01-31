import json
import os
from pathlib import Path
from datetime import datetime

# Paths
base_dir = Path(os.path.expanduser("~/.notebooklm-mcp-cli"))
auth_file = base_dir / "auth.json"
profiles_dir = base_dir / "profiles"
default_profile_dir = profiles_dir / "default"

print(f"Reading from {auth_file}")

if not auth_file.exists():
    print("Error: auth.json not found")
    exit(1)

with open(auth_file, "r") as f:
    auth_data = json.load(f)

# Extract data
cookies = auth_data.get("cookies", {})
csrf_token = auth_data.get("csrf_token", "")
session_id = auth_data.get("session_id", "")
extracted_at = auth_data.get("extracted_at", 0)

# Create profile dir
default_profile_dir.mkdir(parents=True, exist_ok=True)
print(f"Created profile dir: {default_profile_dir}")

# Write cookies.json
cookies_file = default_profile_dir / "cookies.json"
with open(cookies_file, "w") as f:
    json.dump(cookies, f, indent=2)
print(f"Wrote {cookies_file}")

# Write metadata.json
# Use current time for last_validated if extracted_at is recent, otherwise approximate
metadata = {
    "csrf_token": csrf_token,
    "session_id": session_id,
    "email": "", # Email not in auth.json, leave empty
    "last_validated": datetime.now().isoformat()
}

metadata_file = default_profile_dir / "metadata.json"
with open(metadata_file, "w") as f:
    json.dump(metadata, f, indent=2)
print(f"Wrote {metadata_file}")

print("Conversion complete.")
