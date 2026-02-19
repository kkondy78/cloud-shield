"""
NotebookLM Pipeline - APB 워크플로우 핵심 모듈
아이디어 → NotebookLM 노트북 생성 → 기획서(PRD) 자동 생성

방법 1: Reddit 스크래핑 → 불편사항 선택 → 기획서 생성
방법 2: 직접 아이디어 입력 → 기획서 생성
"""

import os
import sys
import json
import time
import argparse
from pathlib import Path

# Playwright 기반 NotebookLM 자동화
try:
    from playwright.sync_api import sync_playwright, Page
except ImportError:
    print("❌ playwright가 설치되지 않았습니다. 'pip install playwright' 후 'playwright install chromium'을 실행하세요.")
    sys.exit(1)


# ─────────────────────────────────────────────
# 설정
# ─────────────────────────────────────────────
AUTH_JSON_PATH = Path.home() / ".notebooklm-mcp" / "auth.json"
NOTEBOOKLM_URL = "https://notebooklm.google.com"
OUTPUT_DIR = Path(__file__).parent.parent / "output" / "plans"


def load_cookies() -> list:
    """~/.notebooklm-mcp/auth.json 에서 쿠키를 로드합니다.
    
    auth.json 형식:
    - {"cookies": "NID=529=...;SID=...", "updatedAt": ...}  (문자열 형식)
    - [{"name": ..., "value": ..., ...}, ...]  (배열 형식)
    """
    if not AUTH_JSON_PATH.exists():
        raise FileNotFoundError(
            f"❌ 인증 파일이 없습니다: {AUTH_JSON_PATH}\n"
            "먼저 'npx notebooklm-mcp-server auth'를 실행하세요."
        )
    
    with open(AUTH_JSON_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # 배열 형식
    if isinstance(data, list):
        print(f"✅ 쿠키 {len(data)}개 로드 완료 (배열 형식)")
        return data
    
    # 딕셔너리 형식
    raw_cookies = data.get("cookies", "")
    
    # 쿠키 값이 리스트인 경우
    if isinstance(raw_cookies, list):
        print(f"✅ 쿠키 {len(raw_cookies)}개 로드 완료 (리스트 형식)")
        return raw_cookies
    
    # 쿠키 값이 문자열인 경우 - "name=value; name2=value2" 형식 파싱
    if isinstance(raw_cookies, str):
        playwright_cookies = []
        for part in raw_cookies.split(";"):
            part = part.strip()
            if "=" in part:
                name, _, value = part.partition("=")
                playwright_cookies.append({
                    "name": name.strip(),
                    "value": value.strip(),
                    "domain": ".google.com",
                    "path": "/",
                    "secure": True,
                    "httpOnly": False,
                })
        print(f"✅ 쿠키 {len(playwright_cookies)}개 로드 완료 (문자열 파싱)")
        return playwright_cookies
    
    raise ValueError(f"❌ 알 수 없는 auth.json 형식: {type(raw_cookies)}")


def format_idea_as_source(idea: str, pain_points: list = None) -> str:
    """아이디어와 페인포인트를 NotebookLM 소스 텍스트로 포맷합니다."""
    content = f"""# 사업 아이디어 기획 요청

## 핵심 아이디어
{idea}

"""
    if pain_points:
        content += "## 수집된 사용자 불편사항 (Reddit 스크래핑)\n"
        for i, point in enumerate(pain_points, 1):
            content += f"{i}. {point}\n"
        content += "\n"

    content += """## 기획서 작성 요청사항

아래 항목들을 포함한 상세 PRD(Product Requirements Document)를 작성해주세요:

1. **제품 개요** - 한 줄 설명, 핵심 가치 제안
2. **타겟 사용자** - 페르소나, 주요 고통 포인트
3. **핵심 기능** - MVP 기능 목록 (우선순위 포함)
4. **기술 스택** - 추천 기술 스택 및 이유
5. **수익 모델** - 비즈니스 모델 및 가격 전략
6. **경쟁사 분석** - 주요 경쟁자 및 차별화 포인트
7. **개발 로드맵** - Phase 1 (MVP), Phase 2, Phase 3
8. **성공 지표** - KPI 및 목표 수치
9. **리스크 분석** - 주요 리스크 및 대응 방안
10. **마케팅 전략** - 초기 사용자 확보 전략
"""
    return content


class NotebookLMPipeline:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    def start(self):
        """브라우저 시작 및 쿠키 주입"""
        cookies = load_cookies()
        
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=self.headless,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"]
        )
        
        self.context = self.browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="ko-KR"
        )
        
        # 쿠키 주입
        playwright_cookies = []
        for c in cookies:
            cookie = {
                "name": c.get("name", ""),
                "value": c.get("value", ""),
                "domain": c.get("domain", ".google.com"),
                "path": c.get("path", "/"),
                "secure": c.get("secure", True),
                "httpOnly": c.get("httpOnly", False),
            }
            if "expirationDate" in c:
                cookie["expires"] = int(c["expirationDate"])
            playwright_cookies.append(cookie)
        
        self.context.add_cookies(playwright_cookies)
        self.page = self.context.new_page()
        print("🚀 브라우저 시작 완료")

    def stop(self):
        """브라우저 종료"""
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("🛑 브라우저 종료")

    def create_notebook(self, title: str) -> str:
        """새 노트북을 생성하고 노트북 ID를 반환합니다."""
        print(f"📓 노트북 생성 중: {title}")
        
        self.page.goto(NOTEBOOKLM_URL, wait_until="networkidle", timeout=30000)
        time.sleep(3)
        
        # 현재 URL 확인 (로그인 여부)
        current_url = self.page.url
        if "accounts.google.com" in current_url:
            raise Exception("❌ 로그인이 필요합니다. 쿠키가 만료되었을 수 있습니다.")
        
        print(f"✅ NotebookLM 접속 완료: {current_url}")
        
        # "새 노트북" 버튼 클릭
        new_notebook_selectors = [
            "button:has-text('새 노트북')",
            "button:has-text('New notebook')",
            "[data-testid='new-notebook-button']",
            "button[aria-label*='새']",
            "button[aria-label*='New']",
        ]
        
        clicked = False
        for selector in new_notebook_selectors:
            try:
                btn = self.page.locator(selector).first
                btn.wait_for(timeout=5000, state="visible")
                btn.click()
                clicked = True
                print(f"✅ '새 노트북' 버튼 클릭: {selector}")
                break
            except Exception:
                continue
        
        if not clicked:
            # 스크린샷 저장 후 오류
            screenshot_path = OUTPUT_DIR / "debug_screenshot.png"
            OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            self.page.screenshot(path=str(screenshot_path))
            print(f"⚠️ 스크린샷 저장: {screenshot_path}")
            raise Exception("❌ '새 노트북' 버튼을 찾을 수 없습니다.")
        
        time.sleep(2)
        
        # 노트북 URL에서 ID 추출
        notebook_url = self.page.url
        print(f"📍 노트북 URL: {notebook_url}")
        
        return notebook_url

    def add_text_source(self, content: str, source_title: str = "아이디어 기획서"):
        """텍스트를 소스로 추가합니다."""
        print(f"📝 소스 추가 중: {source_title}")
        
        # "소스 추가" 버튼 클릭
        add_source_selectors = [
            "button:has-text('소스 추가')",
            "button:has-text('Add source')",
            "[data-testid='add-source-button']",
            "button[aria-label*='소스']",
            "button[aria-label*='source']",
        ]
        
        for selector in add_source_selectors:
            try:
                btn = self.page.locator(selector).first
                btn.wait_for(timeout=5000, state="visible")
                btn.click()
                print(f"✅ '소스 추가' 클릭: {selector}")
                break
            except Exception:
                continue
        
        time.sleep(1)
        
        # "텍스트 붙여넣기" 옵션 선택
        paste_text_selectors = [
            "button:has-text('텍스트 붙여넣기')",
            "button:has-text('Paste text')",
            "[data-testid='paste-text-option']",
        ]
        
        for selector in paste_text_selectors:
            try:
                btn = self.page.locator(selector).first
                btn.wait_for(timeout=5000, state="visible")
                btn.click()
                print(f"✅ '텍스트 붙여넣기' 클릭")
                break
            except Exception:
                continue
        
        time.sleep(1)
        
        # 텍스트 입력
        text_area_selectors = [
            "textarea[placeholder*='텍스트']",
            "textarea[placeholder*='text']",
            ".source-text-input textarea",
            "textarea",
        ]
        
        for selector in text_area_selectors:
            try:
                area = self.page.locator(selector).first
                area.wait_for(timeout=5000, state="visible")
                area.fill(content)
                print(f"✅ 텍스트 입력 완료 ({len(content)} 글자)")
                break
            except Exception:
                continue
        
        # 확인 버튼
        confirm_selectors = [
            "button:has-text('삽입')",
            "button:has-text('Insert')",
            "button:has-text('추가')",
            "button:has-text('Add')",
            "button[type='submit']",
        ]
        
        for selector in confirm_selectors:
            try:
                btn = self.page.locator(selector).first
                btn.wait_for(timeout=5000, state="visible")
                btn.click()
                print(f"✅ 소스 삽입 완료")
                break
            except Exception:
                continue
        
        time.sleep(3)

    def generate_report(self) -> str:
        """보고서(기획서)를 생성하고 텍스트를 반환합니다."""
        print("📊 기획서 생성 중...")
        
        # 채팅 입력창에 기획서 생성 요청
        chat_selectors = [
            "textarea[placeholder*='질문']",
            "textarea[placeholder*='Ask']",
            ".chat-input textarea",
            "[data-testid='chat-input']",
            "textarea",
        ]
        
        prompt = "위 아이디어를 바탕으로 상세한 PRD(Product Requirements Document) 기획서를 한국어로 작성해주세요. 제품 개요, 타겟 사용자, 핵심 기능, 기술 스택, 수익 모델, 개발 로드맵을 포함해주세요."
        
        for selector in chat_selectors:
            try:
                area = self.page.locator(selector).first
                area.wait_for(timeout=10000, state="visible")
                area.fill(prompt)
                area.press("Enter")
                print(f"✅ 기획서 생성 요청 전송")
                break
            except Exception:
                continue
        
        # 응답 대기 (최대 60초)
        print("⏳ 기획서 생성 대기 중... (최대 60초)")
        time.sleep(60)
        
        # 응답 텍스트 추출
        response_selectors = [
            ".response-text",
            ".chat-response",
            "[data-testid='response']",
            ".message-content",
        ]
        
        for selector in response_selectors:
            try:
                response = self.page.locator(selector).last
                text = response.inner_text()
                if text and len(text) > 100:
                    print(f"✅ 기획서 추출 완료 ({len(text)} 글자)")
                    return text
            except Exception:
                continue
        
        return "기획서 텍스트 추출 실패 - NotebookLM 화면을 직접 확인하세요."

    def save_plan(self, title: str, content: str) -> Path:
        """기획서를 파일로 저장합니다."""
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        
        safe_title = "".join(c for c in title if c.isalnum() or c in " _-").strip()
        filename = f"{safe_title}_{int(time.time())}.md"
        output_path = OUTPUT_DIR / filename
        
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(f"# {title}\n\n")
            f.write(f"*생성일: {time.strftime('%Y-%m-%d %H:%M:%S')}*\n\n")
            f.write("---\n\n")
            f.write(content)
        
        print(f"💾 기획서 저장: {output_path}")
        return output_path


def run_pipeline(
    idea: str,
    pain_points: list = None,
    headless: bool = True,
    title: str = None
) -> dict:
    """
    메인 파이프라인 실행
    
    Args:
        idea: 사업 아이디어 텍스트
        pain_points: Reddit에서 수집한 불편사항 목록 (선택)
        headless: 헤드리스 모드 여부
        title: 노트북/기획서 제목 (없으면 자동 생성)
    
    Returns:
        dict: {notebook_url, plan_text, plan_file}
    """
    if not title:
        title = idea[:50] + "..." if len(idea) > 50 else idea
    
    print(f"\n{'='*60}")
    print(f"🚀 APB NotebookLM 파이프라인 시작")
    print(f"📌 아이디어: {title}")
    print(f"{'='*60}\n")
    
    pipeline = NotebookLMPipeline(headless=headless)
    
    try:
        pipeline.start()
        
        # 1. 소스 텍스트 준비
        source_content = format_idea_as_source(idea, pain_points)
        
        # 2. 노트북 생성
        notebook_url = pipeline.create_notebook(title)
        
        # 3. 소스 추가
        pipeline.add_text_source(source_content, title)
        
        # 4. 기획서 생성
        plan_text = pipeline.generate_report()
        
        # 5. 저장
        plan_file = pipeline.save_plan(title, plan_text)
        
        print(f"\n✅ 파이프라인 완료!")
        print(f"📓 노트북: {notebook_url}")
        print(f"📄 기획서: {plan_file}")
        
        return {
            "success": True,
            "notebook_url": notebook_url,
            "plan_text": plan_text,
            "plan_file": str(plan_file)
        }
        
    except Exception as e:
        print(f"\n❌ 파이프라인 오류: {e}")
        return {
            "success": False,
            "error": str(e)
        }
    finally:
        pipeline.stop()


# ─────────────────────────────────────────────
# CLI 인터페이스
# ─────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="APB NotebookLM 파이프라인 - 아이디어 → 기획서 자동 생성"
    )
    parser.add_argument(
        "--idea", 
        type=str, 
        help="사업 아이디어 (직접 입력 모드)"
    )
    parser.add_argument(
        "--pain-points-file",
        type=str,
        help="Reddit 불편사항 JSON 파일 경로 (스크래핑 모드)"
    )
    parser.add_argument(
        "--title",
        type=str,
        help="기획서 제목"
    )
    parser.add_argument(
        "--no-headless",
        action="store_true",
        help="브라우저 창 표시 (디버깅용)"
    )
    
    args = parser.parse_args()
    
    # 아이디어 결정
    idea = args.idea
    pain_points = None
    
    if not idea:
        # 대화형 입력
        print("\n🤖 APB NotebookLM 파이프라인")
        print("=" * 40)
        print("1. 직접 아이디어 입력")
        print("2. Reddit 불편사항 파일 사용")
        choice = input("\n선택 (1/2): ").strip()
        
        if choice == "1":
            idea = input("💡 아이디어를 입력하세요: ").strip()
        elif choice == "2":
            file_path = input("📁 불편사항 JSON 파일 경로: ").strip()
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            pain_points = data if isinstance(data, list) else data.get("pain_points", [])
            idea = input("💡 선택한 아이디어를 입력하세요: ").strip()
        else:
            print("❌ 잘못된 선택")
            sys.exit(1)
    
    if args.pain_points_file:
        with open(args.pain_points_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        pain_points = data if isinstance(data, list) else data.get("pain_points", [])
    
    # 파이프라인 실행
    result = run_pipeline(
        idea=idea,
        pain_points=pain_points,
        headless=not args.no_headless,
        title=args.title
    )
    
    if result["success"]:
        print(f"\n🎉 성공! 기획서가 생성되었습니다.")
        print(f"📄 파일: {result['plan_file']}")
    else:
        print(f"\n❌ 실패: {result['error']}")
        sys.exit(1)
