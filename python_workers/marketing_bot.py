import os
import sys
import time
import argparse

# Ensure core modules can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.stealth_driver import StealthDriver

class MarketingBot:
    def __init__(self, headless=True):
        self.driver = StealthDriver(headless=headless)
        self.page = None

    def start(self):
        """Starts the stealth browser"""
        self.page = self.driver.start()
        print("🤖 Marketing Bot Started.")

    def stop(self):
        """Stops the bot"""
        self.driver.stop()
        print("👋 Marketing Bot Stopped.")

    def run_demo_mission(self):
        """
        Demonstration mission:
        1. Go to Reddit SaaS
        2. Search for "pain points"
        3. Print titles of found posts
        """
        try:
            self.start()
            
            print("🔍 Navigating to Reddit...")
            self.page.goto("https://www.reddit.com/r/SaaS/")
            self.driver.random_delay(2, 4)
            
            # Example interaction using safe_locate (Healer integration)
            # Note: We need to define keys in selectors.json first if not present
            # Default selectors.json has 'post_title' for reddit
            
            # Let's try to grab post titles from the front page
            # We use the selector from config
            print("👀 Looking for post titles (Stealth & Healing enabled)...")
            
            # Using basic playwright locator via config selector
            # Note: safe_locate returns a single element (first), but here we might want all.
            # safe_locate is good for interactive elements. For scraping list, we might access config directly.
            
            title_selector = self.driver.selectors.get("reddit", {}).get("post_title", "h3")
            
            # Wait for content
            self.page.wait_for_selector(title_selector, timeout=10000)
            
            titles = self.page.locator(title_selector).all_inner_texts()
            
            print(f"\n📢 Found {len(titles)} posts:")
            for i, title in enumerate(titles[:5]):
                print(f"  {i+1}. {title}")
                
            print("\n✅ Demo Mission Complete.")
            
        except Exception as e:
            print(f"❌ Mission Failed: {e}")
        finally:
            self.stop()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Stealth Phoenix Marketing Bot")
    parser.add_argument("--headless", action="store_true", help="Run in headless mode")
    parser.add_argument("--no-headless", action="store_false", dest="headless", help="Run in visual mode")
    parser.set_defaults(headless=True)
    
    args = parser.parse_args()
    
    bot = MarketingBot(headless=args.headless)
    bot.run_demo_mission()