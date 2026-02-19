import time
import random
import json
import os
import logging
from playwright.sync_api import sync_playwright, Page, Locator

# Import Healer relatively
try:
    from .healer import Healer
except ImportError:
    # Fallback/Direct execution support
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from healer import Healer

class StealthDriver:
    def __init__(self, headless=True):
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
        # Calculate config path relative to this file
        # this file is in python_workers/core/stealth_driver.py
        # config is in python_workers/config/selectors.json
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.config_path = os.path.join(base_dir, "config", "selectors.json")
        
        self.healer = Healer(config_path=self.config_path)
        self.selectors = self._load_selectors()

    def _load_selectors(self):
        try:
            with open(self.config_path, "r", encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"⚠️ Config not found at {self.config_path}")
            return {}

    def start(self):
        self.playwright = sync_playwright().start()
        # Launch options for stealth
        print(f"🚀 [Stealth] Launching Browser (Headless: {self.headless})...")
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-infobars"
            ]
        )
        
        # Consistent Context with spoofed user agent and locale
        self.context = self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-US",
            timezone_id="America/New_York"
        )
        
        self.page = self.context.new_page()
        
        # Evasion Scripts
        # Mask webdriver property
        self.page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return self.page

    def stop(self):
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("🛑 [Stealth] Browser Stopped.")

    def random_delay(self, min_sec=1, max_sec=3):
        sleep_time = random.uniform(min_sec, max_sec)
        time.sleep(sleep_time)

    def safe_locate(self, platform: str, target_key: str, timeout: int = 5000) -> Locator:
        """
        Locates an element using the config selector.
        If not found, calls Healer to find a new selector and retries.
        """
        # Reload selectors in case Healer updated them recently
        self.selectors = self._load_selectors()
        
        if platform not in self.selectors or target_key not in self.selectors[platform]:
            print(f"❌ [Stealth] Key {platform}.{target_key} not found in config.")
            return None
            
        selector = self.selectors[platform][target_key]

        try:
            # 1st attempt
            element = self.page.locator(selector).first
            element.wait_for(timeout=timeout, state="attached") 
            return element
            
        except Exception:
            print(f"🚨 [Stealth] '{target_key}' on {platform} not found via '{selector}'. Initiating Healer...")
            
            # Healer call
            try:
                html = self.page.content()
                new_selector = self.healer.fix_selector(html, target_key, platform)
                
                if new_selector:
                    print(f"🔄 [Stealth] Retrying with new selector: {new_selector}")
                    # Retry with new selector
                    element = self.page.locator(new_selector).first
                    try:
                        element.wait_for(timeout=timeout, state="attached")
                        return element
                    except:
                        print(f"❌ [Stealth] New selector also failed.")
                        return None
                else:
                    print(f"❌ [Stealth] Healing failed (No selector returned).")
                    return None
            except Exception as e:
                print(f"❌ [Stealth] Critical Error during healing process: {e}")
                return None
