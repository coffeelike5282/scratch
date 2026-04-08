import { chromium } from 'playwright';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SESSION_FILE = 'storageState.json';
const POST_DATA_PATH = path.join('posts', 'post_data.json');

async function main() {
    console.log('🚀 네이버 카페 자동화 봇 [안본 Ver 3.0 - 이미지+텍스트 하이브리드] 시동!');

    try {
        const browser = await chromium.launch({ headless: false });
        const context = fs.existsSync(SESSION_FILE)
            ? await browser.newContext({ storageState: SESSION_FILE })
            : await browser.newContext();

        const page = await context.newPage();

        console.log('🌐 로그인 확인 중...');
        await page.goto('https://nid.naver.com/nidlogin.login');

        try {
            await page.waitForSelector('#id', { timeout: 5000 });
            console.log('🛑 로그인 진행 중...');
            await page.type('#id', process.env.NAVER_ID, { delay: 100 });
            await page.type('#pw', process.env.NAVER_PW, { delay: 100 });
            await page.click('[type="submit"]');
            await page.waitForTimeout(20000);
            await context.storageState({ path: SESSION_FILE });
        } catch (e) {
            console.log('✅ 로그인 세션 유효!');
        }

        const cafeUrl = process.env.CAFE_URL;
        const menuId = process.env.MENU_ID;

        if (cafeUrl && menuId) {
            console.log(`🏰 카페 대문 접속...`);
            await page.goto(cafeUrl, { waitUntil: 'domcontentloaded' });
            await page.waitForTimeout(5000);

            let clubId = await page.evaluate(() => {
                return window.g_sClubId || window.parent.g_sClubId;
            });

            if (!clubId) {
                const content = await page.content();
                const match = content.match(/clubid=(\d+)/) || content.match(/g_sClubId\s*=\s*"(\d+)"/);
                if (match) clubId = match[1];
            }

            if (clubId) {
                const writeUrl = `https://cafe.naver.com/ca-fe/cafes/${clubId}/menus/${menuId}/articles/write`;
                console.log(`🚀 글쓰기 고지로 진격: ${writeUrl}`);
                await page.goto(writeUrl, { waitUntil: 'domcontentloaded' });
                await page.waitForTimeout(15000);

                const frames = page.frames();
                console.log(`👁️ ${frames.length}개의 프레임 정밀 분석...`);

                let result = { title: false, content: false, submit: false };

                // 포스팅 데이터 로드
                let postData = {
                    title: '큰형님(박 사장님)! 안본이 보강한 Ver 3.0 게시글입니다! 🫡',
                    paragraphs: ['기존 텍스트 방식을 유지하면서 이미지 업로드 로직을 탑재했습니다. 🫡'],
                    images: []
                };

                if (fs.existsSync(POST_DATA_PATH)) {
                    try {
                        postData = JSON.parse(fs.readFileSync(POST_DATA_PATH, 'utf8'));
                        console.log('📄 posts/post_data.json 데이터를 로드했습니다.');
                    } catch (e) {
                        console.log('⚠️ post_data.json 로드 실패, 기본 텍스트를 사용합니다.');
                    }
                }

                for (const frame of frames) {
                    try {
                        // 1. 제목 입력
                        const titleSelectors = ['#subject', 'textarea.BaseEditorView--title', '[placeholder*="제목"]'];
                        for (const sel of titleSelectors) {
                            const tLoc = frame.locator(sel).first();
                            if (await tLoc.count() > 0) {
                                await tLoc.click();
                                await tLoc.fill(postData.title);
                                console.log('✅ 제목 입력 완료!');
                                result.title = true;
                                break;
                            }
                        }

                        if (result.title) {
                            // 2. 본문 및 이미지 하이브리드 입력
                            console.log('📝 본문 영역 활성화...');
                            const contentSelector = '.se-placeholder, .se-component-placeholder, [contenteditable="true"]';
                            const trigger = frame.locator(contentSelector).first();

                            if (await trigger.count() > 0) {
                                await trigger.click();
                                await page.waitForTimeout(2000);

                                // 단락과 이미지를 교환하며 사격
                                for (let i = 0; i < Math.max(postData.paragraphs.length, postData.images.length); i++) {
                                    // 텍스트 입력
                                    if (postData.paragraphs[i]) {
                                        console.log(`✍️ ${i + 1}번째 단락 타이핑 중...`);
                                        await page.keyboard.type(postData.paragraphs[i]);
                                        await page.keyboard.press('Enter');
                                        await page.waitForTimeout(500);
                                    }

                                    // 이미지 업로드
                                    if (postData.images[i]) {
                                        const imgPath = path.resolve('posts', postData.images[i]);
                                        if (fs.existsSync(imgPath)) {
                                            console.log(`📸 이미지 업로드 중: ${postData.images[i]}...`);
                                            // 숨겨진 input[type=file] 찾기
                                            const fileInput = frame.locator('input[type="file"].se-image-file-input').first();
                                            if (await fileInput.count() > 0) {
                                                await fileInput.setInputFiles(imgPath);
                                                console.log(`✅ 이미지(${postData.images[i]}) 업로드 성공!`);
                                                await page.waitForTimeout(3000); // 업로드 대기
                                                await page.keyboard.press('ArrowDown'); // 이미지 아래로 이동
                                                await page.keyboard.press('Enter');
                                            }
                                        } else {
                                            console.log(`⚠️ 파일을 찾을 수 없습니다: ${imgPath}`);
                                        }
                                    }
                                }
                                result.content = true;
                            } else {
                                console.log('⚠️ 본문 영역을 활성화할 수 없어 기본 타이핑을 시도합니다.');
                                await page.keyboard.press('Tab');
                                await page.keyboard.type(postData.paragraphs.join('\n'));
                                result.content = true;
                            }

                            // 3. 진짜 "등록" 버튼 저격
                            console.log('📮 최종 등록 버튼 조준...');
                            const allSubmitBtns = frame.locator('button.BaseButton:has-text("등록"), #cafeblog_submit, .se-btn-action, button:has-text("등록")');
                            const count = await allSubmitBtns.count();

                            for (let i = 0; i < count; i++) {
                                const btn = allSubmitBtns.nth(i);
                                const text = await btn.innerText();
                                if (text.includes('등록') && !text.includes('임시')) {
                                    console.log(`🚀 진짜 등록 버튼 클릭! (${text})`);
                                    await btn.click();
                                    result.submit = true;
                                    break;
                                }
                            }
                        }
                        if (result.submit) break;
                    } catch (err) { /* 무시 */ }
                }

                if (result.submit) {
                    console.log('⏳ 게시글 무사 통과 대기 중 (15초)...');
                    await page.waitForTimeout(15000);
                    console.log('✅ 대성공! 큰형님의 작품이 카페에 전시되었습니다! 🫡');
                    await page.screenshot({ path: 'victory_v3.0.png' });
                } else {
                    console.error('❌ 등록 버튼을 결국 못 찾아 실패했습니다.');
                    await page.screenshot({ path: 'fail_v3.0.png' });
                }
            }
        }

        await browser.close();
    } catch (error) {
        console.error('❌ 최종 시스템 오류:', error);
    }
}

main();
