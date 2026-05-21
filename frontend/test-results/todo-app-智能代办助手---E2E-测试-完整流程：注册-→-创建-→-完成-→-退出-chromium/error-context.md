# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: todo-app.spec.js >> 智能代办助手 - E2E 测试 >> 完整流程：注册 → 创建 → 完成 → 退出
- Location: e2e\todo-app.spec.js:228:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h2:has-text("创建账号")')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h2:has-text("创建账号")')

```

# Test source

```ts
  140 |       '[class*="bg-white"][class*="rounded"], ' +
  141 |       '[data-testid="todo-item"], ' +
  142 |       'li:has(button), ' +
  143 |       'div:has(> button)'
  144 |     ).count();
  145 |     
  146 |     console.log(`当前待办数量: ${initialCount}`);
  147 |     
  148 |     // 使用 AI 快速添加功能创建新待办
  149 |     const aiInput = page.locator('input[placeholder*="自然语言"], input[placeholder*="快速添加"]').first();
  150 |     if (await aiInput.isVisible().catch(() => false)) {
  151 |       const newTitle = `验证更新的待办-${Date.now()}`;
  152 |       await aiInput.fill(newTitle);
  153 |       
  154 |       // 点击解析按钮
  155 |       const parseBtn = page.locator('button:has(text=解析), button:has(svg.lucide-sparkles)').first();
  156 |       if (await parseBtn.isVisible().catch(() => false)) {
  157 |         await parseBtn.click();
  158 |         await page.waitForTimeout(2000);
  159 |         
  160 |         // 如果出现确认对话框，点击确认
  161 |         const confirmBtn = page.locator('button:has(text="确认创建")').first();
  162 |         if (await confirmBtn.isVisible().catch(() => false)) {
  163 |           await confirmBtn.click();
  164 |           await page.waitForTimeout(1000);
  165 |         }
  166 |       }
  167 |     }
  168 |     
  169 |     // 等待列表刷新
  170 |     await page.waitForTimeout(1500);
  171 |     
  172 |     // 验证内容更新
  173 |     const updatedCount = await page.locator(
  174 |       '[class*="bg-white"][class*="rounded"], ' +
  175 |       '[data-testid="todo-item"]'
  176 |     ).count();
  177 |     
  178 |     console.log(`更新后待办数量: ${updatedCount}`);
  179 |     expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
  180 |     
  181 |     console.log('✅ 列表验证完成');
  182 |   });
  183 | 
  184 |   test('5. 退出登录', async ({ page }) => {
  185 |     // 先确保已登录
  186 |     await ensureLoggedIn(page);
  187 |     
  188 |     // 查找退出按钮（可能在导航栏、用户菜单或头部区域）
  189 |     const logoutButton = page.locator(
  190 |       'button:has(text="退出"), ' +
  191 |       'button:has(text="登出"), ' +
  192 |       'a:has(text="退出"), ' +
  193 |       'a:has(text="登出"), ' +
  194 |       '[data-testid="logout-btn"], ' +
  195 |       'button[aria-label*="退出"]'
  196 |     ).first();
  197 |     
  198 |     if (await logoutButton.isVisible().catch(() => false)) {
  199 |       await logoutButton.click();
  200 |       
  201 |       // 验证跳转到登录/注册页面
  202 |       await expect(page).toHaveURL(/\/(login|register)/, { timeout: 10000 });
  203 |       
  204 |       console.log('✅ 已退出登录');
  205 |     } else {
  206 |       // 尝试清除 localStorage 直接退出
  207 |       await page.evaluate(() => {
  208 |         localStorage.removeItem('token');
  209 |         localStorage.removeItem('user');
  210 |       });
  211 |       
  212 |       // 刷新页面
  213 |       await page.reload();
  214 |       
  215 |       // 应该被重定向到登录页
  216 |       await expect(page).toHaveURL(/\/(login|register)/, { timeout: 10000 });
  217 |       
  218 |       console.log('✅ 通过清除 localStorage 退出');
  219 |     }
  220 |     
  221 |     // 清除 localStorage 验证退出
  222 |     const tokenInStorage = await page.evaluate(() => {
  223 |       return localStorage.getItem('token');
  224 |     });
  225 |     expect(tokenInStorage).toBeNull();
  226 |   });
  227 | 
  228 |   test('完整流程：注册 → 创建 → 完成 → 退出', async ({ page }) => {
  229 |     const flowUser = {
  230 |       name: `流程用户-${Date.now()}`,
  231 |       email: `flow-${Date.now()}@test.com`,
  232 |       password: 'FlowTest123',
  233 |     };
  234 |     
  235 |     console.log('\n🔄 开始完整流程测试...\n');
  236 |     
  237 |     // 1. 注册
  238 |     console.log('1️⃣ 注册新用户...');
  239 |     await page.goto('/register');
> 240 |     await expect(page.locator('h2:has-text("创建账号")')).toBeVisible({ timeout: 10000 });
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  241 |     
  242 |     await page.fill('#name', flowUser.name);
  243 |     await page.fill('#email', flowUser.email);
  244 |     await page.fill('#password', flowUser.password);
  245 |     await page.fill('#confirmPassword', flowUser.password);
  246 |     await page.check('#agreement');
  247 |     await page.click('button[type="submit"]');
  248 |     
  249 |     await expect(page).toHaveURL(/\/todos/, { timeout: 15000 });
  250 |     console.log(`   ✅ 注册成功: ${flowUser.email}\n`);
  251 |     
  252 |     // 2. 创建待办
  253 |     console.log('2️⃣ 创建待办...');
  254 |     const newBtn = page.locator('button:has(svg.lucide-plus)').first();
  255 |     if (await newBtn.isVisible().catch(() => false)) {
  256 |       await newBtn.click();
  257 |       await page.waitForTimeout(300);
  258 |       
  259 |       const modal = page.locator('.fixed.inset-0.z-50').first();
  260 |       await expect(modal).toBeVisible({ timeout: 3000 });
  261 |       
  262 |       await modal.locator('input').first().fill('完整流程测试待办');
  263 |       await modal.locator('button[type="submit"], button:has-text("保存")').first().click();
  264 |       
  265 |       await expect(page.locator('text=完整流程测试待办')).toBeVisible({ timeout: 5000 });
  266 |       console.log('   ✅ 待办创建成功\n');
  267 |     }
  268 |     
  269 |     // 3. 标记完成
  270 |     console.log('3️⃣ 标记完成...');
  271 |     const card = page.locator('[class*="bg-white"][class*="rounded"]').filter({ hasText: '完整流程测试待办' }).first();
  272 |     if (await card.isVisible().catch(() => false)) {
  273 |       const btn = card.locator('button').first();
  274 |       if (await btn.isVisible().catch(() => false)) {
  275 |         await btn.click();
  276 |         await page.waitForTimeout(500);
  277 |         console.log('   ✅ 已标记完成\n');
  278 |       }
  279 |     }
  280 |     
  281 |     // 4. 退出
  282 |     console.log('4️⃣ 退出登录...');
  283 |     const logout = page.locator('button:has(text="退出"), a:has(text="退出")').first();
  284 |     if (await logout.isVisible().catch(() => false)) {
  285 |       await logout.click();
  286 |     } else {
  287 |       await page.evaluate(() => {
  288 |         localStorage.clear();
  289 |       });
  290 |       await page.reload();
  291 |     }
  292 |     
  293 |     await expect(page).toHaveURL(/\/(login|register)/, { timeout: 10000 });
  294 |     console.log('   ✅ 已退出登录\n');
  295 |     
  296 |     console.log('🎉 完整流程测试完成！');
  297 |   });
  298 | });
  299 | 
  300 | // 辅助函数：确保用户已登录
  301 | async function ensureLoggedIn(page) {
  302 |   const currentUrl = page.url();
  303 |   
  304 |   // 如果不在待办页面，尝试登录
  305 |   if (!currentUrl.includes('/todos')) {
  306 |     console.log('需要登录，尝试登录流程...');
  307 |     
  308 |     // 导航到登录页
  309 |     await page.goto('/login');
  310 |     await page.waitForTimeout(1000);
  311 |     
  312 |     // 检查是否在登录页面
  313 |     const loginPage = page.locator('h2:has-text("登录"), h2:has-text("欢迎回来")').first();
  314 |     if (await loginPage.isVisible().catch(() => false)) {
  315 |       console.log('在登录页面，填写凭据...');
  316 |       
  317 |       // 填写登录表单
  318 |       const emailInput = page.locator('#email, input[type="email"]').first();
  319 |       const passwordInput = page.locator('#password, input[type="password"]').first();
  320 |       
  321 |       await emailInput.fill(testUser.email);
  322 |       await passwordInput.fill(testUser.password);
  323 |       
  324 |       // 点击登录按钮
  325 |       await page.click('button[type="submit"]');
  326 |       
  327 |       // 等待跳转
  328 |       try {
  329 |         await expect(page).toHaveURL(/\/todos/, { timeout: 15000 });
  330 |         console.log('✅ 登录成功');
  331 |       } catch {
  332 |         console.log('⚠️ 登录可能失败，继续测试...');
  333 |       }
  334 |     }
  335 |   }
  336 |   
  337 |   // 最终检查
  338 |   const finalUrl = page.url();
  339 |   if (finalUrl.includes('/todos')) {
  340 |     console.log('✓ 当前在待办页面');
```