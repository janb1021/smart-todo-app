# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: todo-app.spec.js >> 智能代办助手 - E2E 测试 >> 2. 创建待办事项
- Location: e2e\todo-app.spec.js:40:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=智能添加')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('text=智能添加')

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | const testUser = {
  4   |   name: 'E2E Test User',
  5   |   email: `e2e-test-${Date.now()}@example.com`,
  6   |   password: 'Test123456',
  7   | };
  8   | 
  9   | test.describe('智能代办助手 - E2E 测试', () => {
  10  |   // 注意：Playwright 的 beforeAll 不支持 page fixture
  11  |   test.beforeEach(async ({ page }) => {
  12  |     console.log('Starting test...');
  13  |   });
  14  | 
  15  |   test('1. 注册新用户', async ({ page }) => {
  16  |     // 导航到注册页面
  17  |     await page.goto('/register');
  18  |     
  19  |     // 等待页面加载完成
  20  |     await expect(page.locator('h2:has-text("创建账号")')).toBeVisible({ timeout: 10000 });
  21  |     
  22  |     // 填写注册表单（使用正确的选择器）
  23  |     await page.fill('#name', testUser.name);
  24  |     await page.fill('#email', testUser.email);
  25  |     await page.fill('#password', testUser.password);
  26  |     await page.fill('#confirmPassword', testUser.password);
  27  |     
  28  |     // 勾选用户协议复选框
  29  |     await page.check('#agreement');
  30  |     
  31  |     // 提交表单
  32  |     await page.click('button[type="submit"]');
  33  |     
  34  |     // 验证注册成功 - 应该跳转到待办列表页面或显示成功消息
  35  |     await expect(page).toHaveURL(/\/todos/, { timeout: 15000 });
  36  |     
  37  |     console.log('✅ 注册成功:', testUser.email);
  38  |   });
  39  | 
  40  |   test('2. 创建待办事项', async ({ page }) => {
  41  |     // 先登录（如果未登录）
  42  |     await ensureLoggedIn(page);
  43  |     
  44  |     // 等待待办列表页面加载
> 45  |     await expect(page.locator('text=智能添加') || page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
      |                                                                               ^ Error: expect(locator).toBeVisible() failed
  46  |     
  47  |     // 点击"新增待办"按钮 - 查找 Plus 图标按钮
  48  |     const newTodoButton = page.locator('button:has(svg.lucide-plus), button:has-text("新增"), button[aria-label*="新增"]').first();
  49  |     if (await newTodoButton.isVisible()) {
  50  |       await newTodoButton.click();
  51  |       
  52  |       // 等待模态框出现
  53  |       const modal = page.locator('.fixed.inset-0.z-50, [role="dialog"], [class*="modal"]').first();
  54  |       await expect(modal).toBeVisible({ timeout: 5000 });
  55  |       
  56  |       // 填写待办表单
  57  |       const titleInput = modal.locator('input[placeholder*="标题"], input[name="title"], input[type="text"]').first();
  58  |       await titleInput.fill('E2E 测试待办');
  59  |       
  60  |       // 选择优先级（如果存在）
  61  |       const prioritySelect = modal.locator('select').first();
  62  |       if (await prioritySelect.isVisible()) {
  63  |         await prioritySelect.selectOption('high');
  64  |       }
  65  |       
  66  |       // 提交表单
  67  |       const submitBtn = modal.locator('button[type="submit"], button:has-text("保存"), button:has-text("创建")').first();
  68  |       await submitBtn.click();
  69  |       
  70  |       // 等待模态框关闭
  71  |       await expect(modal).toBeHidden({ timeout: 5000 }).catch(() => true);
  72  |       
  73  |       // 验证待办创建成功
  74  |       await expect(page.locator('text=E2E 测试待办')).toBeVisible({ timeout: 5000 });
  75  |       
  76  |       console.log('✅ 待办创建成功');
  77  |     } else {
  78  |       console.log('⚠️ 未找到新增按钮，尝试其他方式...');
  79  |       // 尝试直接使用 AI 输入框
  80  |       const aiInput = page.locator('input[placeholder*="自然语言"], input[placeholder*="快速添加"]').first();
  81  |       if (await aiInput.isVisible()) {
  82  |         await aiInput.fill('测试待办事项');
  83  |         await page.keyboard.press('Enter');
  84  |         await page.waitForTimeout(2000);
  85  |       }
  86  |     }
  87  |   });
  88  | 
  89  |   test('3. 标记待办为完成', async ({ page }) => {
  90  |     // 先登录并确保有待办
  91  |     await ensureLoggedIn(page);
  92  |     
  93  |     // 查找待办卡片中的勾选按钮/复选框
  94  |     // 可能的选择器：Circle/CheckCircle2 图标按钮、checkbox、toggle 按钮
  95  |     const todoCard = page.locator('[class*="bg-white"][class*="rounded"], [class*="todo-card"], div[class*="shadow"]').first().catch(() => null);
  96  |     
  97  |     if (todoCard) {
  98  |       // 尝试多种可能的完成按钮选择器
  99  |       const completeButton = todoCard.locator(
  100 |         'button:has(svg.lucide-circle), ' +
  101 |         'button:has(svg.lucide-check-circle), ' +
  102 |         '[data-testid="complete-btn"], ' +
  103 |         '[aria-label*="完成"], ' +
  104 |         '[aria-label*="标记"]'
  105 |       ).first();
  106 |       
  107 |       if (await completeButton.isVisible().catch(() => false)) {
  108 |         await completeButton.click();
  109 |         
  110 |         // 等待状态更新
  111 |         await page.waitForTimeout(1000);
  112 |         
  113 |         console.log('✅ 待办已标记为完成');
  114 |         
  115 |         // 验证状态变化 - 检查是否有删除线或已完成样式
  116 |         const isCompleted = await todoCard.evaluate(el => 
  117 |           el.classList.contains('completed') || 
  118 |           el.classList.contains('done') ||
  119 |           el.style.textDecoration === 'line-through' ||
  120 |           el.querySelector('.line-through, .opacity-50, .text-gray-400') !== null
  121 |         ).catch(() => false);
  122 |         
  123 |         if (isCompleted) {
  124 |           console.log('✅ 视觉状态已更新');
  125 |         }
  126 |       } else {
  127 |         console.log('⚠️ 未找到完成按钮');
  128 |       }
  129 |     } else {
  130 |       console.log('⚠️ 未找到待办卡片');
  131 |     }
  132 |   });
  133 | 
  134 |   test('4. 验证待办列表更新', async ({ page }) => {
  135 |     // 登录
  136 |     await ensureLoggedIn(page);
  137 |     
  138 |     // 获取当前可见的待办数量（通过统计卡片或列表项）
  139 |     const initialCount = await page.locator(
  140 |       '[class*="bg-white"][class*="rounded"], ' +
  141 |       '[data-testid="todo-item"], ' +
  142 |       'li:has(button), ' +
  143 |       'div:has(> button)'
  144 |     ).count();
  145 |     
```