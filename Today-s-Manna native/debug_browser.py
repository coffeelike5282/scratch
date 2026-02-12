from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Listen for console logs
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))
        
        try:
            print("Navigating to http://localhost:8081/index...")
            page.goto("http://localhost:8081/index", timeout=30000)
            print("Page loaded. Waiting for 5 seconds to capture logs...")
            page.wait_for_timeout(5000)
        except Exception as e:
            print(f"Navigation failed: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    run()
