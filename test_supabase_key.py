
import os
from supabase import create_client, Client

url = "https://jxrhltarzoqwnkxsjlyc.supabase.co"
key = "sb_publishable_xm38IVotQn9yBcWUDfl8dw_1t55Lgg3"

print(f"Testing Supabase Connection...")
print(f"URL: {url}")
print(f"Key: {key[:20]}...")

try:
    supabase: Client = create_client(url, key)
    # 간단한 쿼리 시도 (auth.users는 admin만 되지만, health check용으로)
    # Anon key로는 보통 public table 읽기만 됨.
    # 여기서는 에러 메시지 형태를 보고 유효성을 판단.
    
    # 가짜 ID로 로그인 시도 -> 400 or 401 expected, but client init should work
    print("Client initialized. Attempting basic request...")
    
    # Health check (simulated)
    # 유효하지 않은 키라면 create_client 자체는 되더라도 요청 시 401 Unauthorized 뜰 것임
    # 하지만 supabase-py는 요청을 보내봐야 앎.
    
    # 없는 테이블 조회 시도 -> 404가 뜨면 인증은 통과한 것 (테이블이 없을 뿐)
    # 401/403이 뜨면 키 문제.
    res = supabase.table("non_existent_table").select("*").limit(1).execute()
    print(f"Result: {res}")
    
except Exception as e:
    print(f"Error: {e}")
