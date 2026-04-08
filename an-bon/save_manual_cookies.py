
import json
import os
from pathlib import Path
from http.cookies import SimpleCookie

RAW_COOKIE = """__Secure-BUCKET=CIMG; SEARCH_SAMESITE=CgQIwJ8B; _gcl_au=1.1.1861502665.1766310221; _ga=GA1.1.1830618906.1766310221; OSID=g.a0006AhLcS7c3J9BolhwEwcSgfNXMcsTQGli-hGMZ7XwPQDdaKqxwS-1uxrnGWePU30sMUIm0wACgYKARkSARcSFQHGX2MiuFAe6Jv7pf3ajD3NQvOgARoVAUF8yKpbevTSgcHpv7GJ8tSrokpl0076; __Secure-OSID=g.a0006AhLcS7c3J9BolhwEwcSgfNXMcsTQGli-hGMZ7XwPQDdaKqxDPpt44zUCkr9XmoT_yZHyQACgYKAYsSARcSFQHGX2MiZZQgBFkiQB7RYgZRKFzPKRoVAUF8yKqfDusuutRUGSO7F1MWJKgV0076; ADS_VISITOR_ID=00000000-0000-0000-0000-000000000000; _ga_W0LDH41ZCB=deleted; AEC=AaJma5tBjxWnkrK_C5cNqunNt1PxBfVIa8zMgNzliWU72UW8b-2_Xaa3v2g; SID=g.a0006QhLcVzWAJA7JEuMOqiSwMMFm-UaIYsTflBY3LDR4VvUlZPNYzuXLwhtuuZfDgNuLKiHggACgYKAVsSARcSFQHGX2Mi2-GY6A-1jL0iCVaT4yPuPhoVAUF8yKrDBi53i9DcOd6n0hpr178Q0076; __Secure-1PSID=g.a0006QhLcVzWAJA7JEuMOqiSwMMFm-UaIYsTflBY3LDR4VvUlZPNNonEo1ng1UW7cupsHSa9cwACgYKAYISARcSFQHGX2MiprNXLTd3uJkryf-ZrnxG0xoVAUF8yKr2cqOqTCYKHhPdp7VyqHYR0076; __Secure-3PSID=g.a0006QhLcVzWAJA7JEuMOqiSwMMFm-UaIYsTflBY3LDR4VvUlZPNQWvDNBuDxPnmEwMBQiU4ZgACgYKAVcSARcSFQHGX2Mi8VtI3GC_trHBAeF7xVz0rhoVAUF8yKo1bEIJGU8QbmBuI_0d33Lj0076; HSID=AUEVW5dpa7xlIO_rE; SSID=A6w1w9Ba6An-NOLHz; APISID=fLm0_c8QZFWgEGyY/Ax7HGqO4frfSK5yto; SAPISID=9cjPHcw5eGgiqZ9J/A-OFMvh_g3fDHwbg1; __Secure-1PAPISID=9cjPHcw5eGgiqZ9J/A-OFMvh_g3fDHwbg1; __Secure-3PAPISID=9cjPHcw5eGgiqZ9J/A-OFMvh_g3fDHwbg1; NID=528=crImey1SoOiaCrVplJwfVNiYIx-WjQsmg6fnpvzIWvpuNy8XGdzO_8FBEPQooO1Yl_A322KniHE5uLrUp1T3MCODyuoCn6izQISYVx1PVYg0gBMX0f0msE9zER4j1NVDzT8TqR0A6QNztttvHKYSjSRJHYiG-aLAGOSZExj3ioh-FhARh-9iCKRQEMASSkqg8Mp4U6X-AL6EorSQOIhscn_rr6S4PoFddfXxda7u6zLyPK6z2fzla0t3oJZHae47Kz_XCIcne9o8pHNhQhFWl0Pp9GJoDbv5RtPlqGJxpu5nNs3X_L_ZyUAcioCKP9NovB-GtQ4-yFc8YIphh4XdH2g2kT1ppqx0KFde42leNB9-jAfemQiX3whDY_mPVjyai_dw8rdFhcL5QOCfYCsrL5B046rdAJV45292s4sy1SmIuZrRlmZf6ZnmFVRG5QYoWdSylNozNkmn-EfLdYNkri3QiB6hddjo6WZ5GcQ-esFoLt4nQ4aTnwrMUubC4Z9EDNKLtA2c4zk-NmevLBqnO2XLBKY3onM_6KtAw-79g74UxVnpApMolhMbcnG_ocO3zfqls_QIZQ3ZVbPwnMgMp3CWgC5y0YFer8A9hi7xCiwafEp4CjoKaeLWKmpKXvcI1nmApTt1T2NBShD0S3uOUC5WOWxjFWh6l_gNbalq6XLDVG8fTEgU_4YzFXv1MmYTYHq1SQbtyYZ-NKyp7DzvfavMLxvDT8Fj0XKIqsNpW_8i6CTgQ580DCm0VhAv-GN7htVfXWke9gwtI1I8k-OUerQVsx-jaGCVtRdR5Tp51181qxxWNNqyTaFhXQjfpw7t-HL6zMMx_1LEEDUJRUIvT_rgy3nLoVCp2fbXcC7iow0l3JDuyG2s68-Zj-EYMPpCWrRxVLoeb5ay36T4L_kLoYGpv_qqgErejTkHZuBZfLnITm9u1Re3Nw; __Secure-1PSIDTS=sidts-CjEB7I_69IU_zybPrFXU3o6PfVg30YP_ltLUVMs0tpo5Bmwr7FoVh9k4X54UqtPoKbPaEAA; __Secure-3PSIDTS=sidts-CjEB7I_69IU_zybPrFXU3o6PfVg30YP_ltLUVMs0tpo5Bmwr7FoVh9k4X54UqtPoKbPaEAA; S=billing-ui-v3=7n4tbxn8-fZo7s5XHXWaIZWAV691wpFA:billing-ui-v3-efe=7n4tbxn8-fZo7s5XHXWaIZWAV691wpFA; SIDCC=AKEyXzXoHe4WMsXW-dWFaCH5sC99ZlOzNfWpwGjRzD6x8iVVL_CBYS0d5Wa6CI-eKsUXAN17d1Y; __Secure-1PSIDCC=AKEyXzWeHnBHnq88l83w5PQFpWhgTEI-mb8G0l5pejA60QL3OSyQSaxDC_XxkvMZY015KLJJBA; __Secure-3PSIDCC=AKEyXzXzzC9J6bM2lSsQfSsZxrhAnEy8joBXfFg4MTWoCou0oWpvLdDjhUQuOrp_2H5IguWHQ74; _ga_W0LDH41ZCB=GS2.1.s1769959500$o49$g0$t1769959520$j40$l0$h0"""

def main():
    print("Parsing cookies...")
    cookie = SimpleCookie()
    cookie.load(RAW_COOKIE)
    
    cookies_dict = {}
    for key, morsel in cookie.items():
        cookies_dict[key] = morsel.value
        
    print(f"Extracted {len(cookies_dict)} cookies.")
    
    # Check for essential cookies
    essential = ["SID", "HSID", "SSID"]
    found = [k for k in essential if k in cookies_dict]
    print(f"Essential cookies found: {found}")
    
    auth_data = {
        "cookies": cookies_dict,
        "csrf_token": "", # Will be auto-refreshed
        "session_id": "", # Will be auto-refreshed
        "timestamp": 0
    }
    
    auth_dir = Path(os.environ["USERPROFILE"]) / ".notebooklm-mcp-cli"
    auth_dir.mkdir(exist_ok=True)
    auth_path = auth_dir / "auth.json"
    
    with open(auth_path, "w") as f:
        json.dump(auth_data, f, indent=2)
        
    print(f"Saved to {auth_path}")

if __name__ == "__main__":
    main()
