import os
import json
import google.generativeai as genai
from typing import Optional

class Healer:
    def __init__(self, config_path: str = None):
        if config_path is None:
            # Default to ../config/selectors.json relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            config_path = os.path.join(base_dir, "config", "selectors.json")
            
        self.config_path = config_path
        self._setup_gemini()

    def _setup_gemini(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("⚠️ GEMINI_API_KEY not found in environment variables.")
        else:
            genai.configure(api_key=api_key)

    def fix_selector(self, html_content: str, target_key: str, platform: str) -> Optional[str]:
        """
        AI Doctor that heals broken CSS selectors by analyzing HTML.
        """
        print(f"🚑 [Healer] Analyzing HTML to fix '{target_key}' for {platform}...")

        try:
            model = genai.GenerativeModel('gemini-pro')
            
            # Truncate HTML if too large
            truncated_html = html_content[:50000] 

            prompt = f"""
            You are a CSS Selector Expert.
            The current CSS selector for '{target_key}' on {platform} is broken.
            Analyze the following HTML snippet and provide the CORRECT, MOST ROBUST CSS selector for '{target_key}'.
            
            Target description:
            - If target_key is 'comment_body', look for comment text.
            - If target_key is 'video_title', look for the main video title.
            - If target_key is 'post_title', look for the reddit post title.
            - If target_key is 'post_body', look for the reddit post content.
            - If target_key is 'new_notebook_btn', look for the button to create a new notebook.
            - If target_key is 'add_source_btn', look for the button to add a source.
            - If target_key is 'chat_input', look for the main chat input text area.
            
            Return ONLY the CSS selector string. No markdown, no explanations.

            HTML Snippet:
            {truncated_html}
            """

            response = model.generate_content(prompt)
            new_selector = response.text.strip()
            
            if new_selector:
                print(f"✅ [Healer] Diagnose complete. New selector: {new_selector}")
                self._update_config(platform, target_key, new_selector)
                return new_selector
            else:
                print("❌ [Healer] Failed to generate a new selector.")
                return None

        except Exception as e:
            print(f"❌ [Healer] Error during diagnosis: {e}")
            return None

    def _update_config(self, platform: str, target_key: str, new_selector: str):
        """
        Updates the JSON config file with the new selector.
        """
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            if platform in data:
                data[platform][target_key] = new_selector
                
                with open(self.config_path, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                
                print(f"💾 [Healer] Config updated: {platform}.{target_key} = {new_selector}")
        except Exception as e:
            print(f"❌ [Healer] Failed to update config file: {e}")
