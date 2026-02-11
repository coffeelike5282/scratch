@echo off
set PAYPAL_ACCESS_TOKEN=A21AAKy5bt7iwDKVBR0whCIC6tpQEledKuOAGa_K9GaToe1AMaRpwpMhX1NYf9cLpUszH9UAq-Mn_-_QYrxquM5Kcp4zIWeZw
set PAYPAL_ENVIRONMENT=SANDBOX
node node_modules\@paypal\mcp\dist\index.js --tools=all
