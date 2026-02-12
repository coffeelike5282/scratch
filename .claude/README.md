# Claude MCP 설정 가이드

## PayPal MCP 서버 설정 방법

### 1. 설정 파일 생성

`mcp.json.example` 파일을 복사해서 `mcp.json` 파일을 만드세요:

```bash
cp .claude/mcp.json.example .claude/mcp.json
```

### 2. 토큰 설정

1. PayPal 토큰 갱신:
   ```bash
   cd paypal-mcp-local
   python refresh_paypal_token.py
   ```

2. `.claude/mcp.json` 파일을 열고 `YOUR_PAYPAL_ACCESS_TOKEN_HERE` 부분을 실제 토큰으로 교체하세요.

3. 토큰은 `paypal-mcp-local/PAYPAL_TOKEN.TXT` 파일에서 확인할 수 있습니다.

### 3. Claude Code 재시작

설정을 반영하려면 Claude Code를 재시작하세요.

---

## 보안 주의사항

⚠️ **중요**: `mcp.json` 파일에는 실제 액세스 토큰이 포함되어 있으므로 Git에 커밋하지 마세요!

- ✅ `mcp.json.example` - 템플릿 (커밋 가능)
- ❌ `mcp.json` - 실제 토큰 포함 (커밋 금지, .gitignore 처리됨)
- ❌ `PAYPAL_TOKEN.TXT` - 토큰 파일 (커밋 금지, .gitignore 처리됨)
