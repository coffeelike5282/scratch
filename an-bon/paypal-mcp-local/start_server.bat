@echo off
set PAYPAL_ACCESS_TOKEN=A21AAKm0WIRgVDKeJgi2hlpAr5O0M_fizAGAW0PuNNJ-5Mv-rsBIizxbvsr7Ua43GUQvnCBgpFXdb6-RlS2KsEp1F_1ZgTVGg
set PAYPAL_ENVIRONMENT=SANDBOX
node node_modules\@paypal\mcp\dist\index.js --tools=all
