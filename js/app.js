const STORAGE_KEYS = {
    USER: 'smart_todo_user',
    TASKS: 'smart_todo_tasks'
};

const CATEGORIES = ['工作', '生活', '学习', '娱乐', '健康'];
const PRIORITIES = ['high', 'medium', 'low'];

class SmartTodoApp {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.currentFilter = 'all';
        this.currentView = 'todo';
        this.init();
    }

    init() {
        this.loadUser();
        if (this.currentUser) {
            this.loadTasks();
            this.renderApp();
        } else {
            this.renderAuth();
        }
        this.bindEvents();
    }

    loadUser() {
        const saved = localStorage.getItem(STORAGE_KEYS.USER);
        if (saved) {
            this.currentUser = JSON.parse(saved);
        }
    }

    saveUser(user) {
        this.currentUser = user;
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }

    loadTasks() {
        const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (saved) {
            this.tasks = JSON.parse(saved);
        } else {
            this.tasks = this.generateMockTasks();
            this.saveTasks();
        }
    }

    saveTasks() {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(this.tasks));
    }

    generateMockTasks() {
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        return [
            { id: 1, title: '完成项目报告', description: '整理Q2季度项目进度报告', completed: false, priority: 'high', category: '工作', dueDate: today, createdAt: yesterday },
            { id: 2, title: '回复客户邮件', description: '回复关于产品报价的邮件', completed: false, priority: 'medium', category: '工作', dueDate: today, createdAt: yesterday },
            { id: 3, title: '整理会议记录', description: '整理昨天的部门会议记录', completed: true, priority: 'low', category: '工作', dueDate: yesterday, createdAt: yesterday },
            { id: 4, title: '学习Vue3', description: '学习Vue3组合式API', completed: false, priority: 'medium', category: '学习', dueDate: tomorrow, createdAt: today },
            { id: 5, title: '健身锻炼', description: '健身房有氧运动30分钟', completed: false, priority: 'low', category: '健康', dueDate: today, createdAt: today },
            { id: 6, title: '购买日用品', description: '购买牛奶、面包等生活用品', completed: true, priority: 'medium', category: '生活', dueDate: yesterday, createdAt: yesterday },
            { id: 7, title: '准备周会PPT', description: '准备下周部门周会的演示文稿', completed: false, priority: 'high', category: '工作', dueDate: tomorrow, createdAt: today },
            { id: 8, title: '阅读技术文档', description: '阅读最新的前端技术文档', completed: false, priority: 'low', category: '学习', dueDate: tomorrow, createdAt: today },
            { id: 9, title: '看电影', description: '观看周末电影', completed: false, priority: 'low', category: '娱乐', dueDate: tomorrow, createdAt: today },
            { id: 10, title: '财务报表分析', description: '分析月度财务报表', completed: true, priority: 'high', category: '工作', dueDate: yesterday, createdAt: yesterday },
        ];
    }

    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.closest('.nav-item')) {
                this.handleNavClick(e.target.closest('.nav-item'));
            } else if (e.target.closest('.filter-tab')) {
                this.handleFilterClick(e.target.closest('.filter-tab'));
            } else if (e.target.closest('.checkbox')) {
                this.handleToggleComplete(e.target.closest('.checkbox'));
            } else if (e.target.closest('.action-btn.delete')) {
                this.handleDeleteTask(e.target.closest('.action-btn.delete'));
            } else if (e.target.closest('.action-btn.edit')) {
                this.handleEditTask(e.target.closest('.action-btn.edit'));
            } else if (e.target.closest('.add-btn')) {
                this.handleAddTask();
            } else if (e.target.closest('.logout-btn')) {
                this.handleLogout();
            } else if (e.target.closest('.close-btn')) {
                this.closeModal();
            } else if (e.target.closest('.modal-btn.primary')) {
                this.handleSaveTask();
            } else if (e.target.closest('.modal-btn.secondary')) {
                this.closeModal();
            } else if (e.target.closest('.auth-btn')) {
                this.handleAuthSubmit();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const activeInput = document.activeElement;
                if (activeInput && activeInput.id === 'taskInput') {
                    this.handleAddTask();
                } else if (activeInput && activeInput.closest('.auth-form')) {
                    this.handleAuthSubmit();
                }
            }
        });
    }

    renderAuth() {
        const html = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1>智能代办助手</h1>
                        <p>高效管理您的每一天</p>
                    </div>
                    <form class="auth-form" id="loginForm">
                        <div class="form-group">
                            <label for="email">邮箱</label>
                            <input type="email" id="email" placeholder="请输入邮箱" required>
                        </div>
                        <div class="form-group">
                            <label for="password">密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <button type="button" class="auth-btn">登录</button>
                    </form>
                    <div class="auth-switch">
                        还没有账号？<a href="#" id="registerLink">立即注册</a>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app').innerHTML = html;
        
        document.getElementById('registerLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.renderRegister();
        });
    }

    renderRegister() {
        const html = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h1>智能代办助手</h1>
                        <p>创建您的账号</p>
                    </div>
                    <form class="auth-form" id="registerForm">
                        <div class="form-group">
                            <label for="name">姓名</label>
                            <input type="text" id="name" placeholder="请输入姓名" required>
                        </div>
                        <div class="form-group">
                            <label for="email">邮箱</label>
                            <input type="email" id="email" placeholder="请输入邮箱" required>
                        </div>
                        <div class="form-group">
                            <label for="password">密码</label>
                            <input type="password" id="password" placeholder="请输入密码" required>
                        </div>
                        <div class="form-group">
                            <label for="confirmPassword">确认密码</label>
                            <input type="password" id="confirmPassword" placeholder="请确认密码" required>
                        </div>
                        <button type="button" class="auth-btn">注册</button>
                    </form>
                    <div class="auth-switch">
                        已有账号？<a href="#" id="loginLink">立即登录</a>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('app').innerHTML = html;
        
        document.getElementById('loginLink').addEventListener('click', (e) => {
            e.preventDefault();
            this.renderAuth();
        });
    }

    handleAuthSubmit() {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (loginForm) {
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (email && password) {
                const user = { id: 1, name: email.split('@')[0], email, avatar: email.charAt(0).toUpperCase() };
                this.saveUser(user);
                this.loadTasks();
                this.renderApp();
            }
        } else if (registerForm) {
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;
            
            if (name && email && password && password === confirmPassword) {
                const user = { id: 1, name, email, avatar: name.charAt(0).toUpperCase() };
                this.saveUser(user);
                this.tasks = this.generateMockTasks();
                this.saveTasks();
                this.renderApp();
            }
        }
    }

    renderApp() {
        const html = `
            <div class="app-layout">
                <aside class="sidebar">
                    <div class="sidebar-header">
                        <h1>智能代办助手</h1>
                    </div>
                    <nav class="sidebar-nav">
                        <ul class="nav-items">
                            <li class="nav-item ${this.currentView === 'todo' ? 'active' : ''}" data-view="todo">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="9" cy="21" r="1"></circle>
                                    <circle cx="20" cy="21" r="1"></circle>
                                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6"></path>
                                </svg>
                                <span>待办管理</span>
                            </li>
                            <li class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="3" width="7" height="7"></rect>
                                    <rect x="14" y="14" width="7" height="7"></rect>
                                    <rect x="3" y="14" width="7" height="7"></rect>
                                </svg>
                                <span>数据看板</span>
                            </li>
                        </ul>
                    </nav>
                    <div class="sidebar-footer">
                        <div class="user-profile">
                            <div class="user-avatar">${this.currentUser.avatar}</div>
                            <div class="user-info">
                                <div class="user-name">${this.currentUser.name}</div>
                                <div class="user-email">${this.currentUser.email}</div>
                            </div>
                            <button class="logout-btn">退出</button>
                        </div>
                    </div>
                </aside>
                <main class="main-content" id="mainContent">
                    ${this.currentView === 'todo' ? this.renderTodoSection() : this.renderDashboard()}
                </main>
            </div>
        `;
        document.getElementById('app').innerHTML = html;
    }

    handleNavClick(navItem) {
        const view = navItem.dataset.view;
        if (view !== this.currentView) {
            this.currentView = view;
            this.renderApp();
        }
    }

    handleLogout() {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.removeItem(STORAGE_KEYS.TASKS);
        this.currentUser = null;
        this.tasks = [];
        this.renderAuth();
    }

    renderTodoSection() {
        return `
            <div class="todo-section">
                <div class="section-header">
                    <h2 class="section-title">待办任务</h2>
                </div>
                ${this.renderParserHint()}
                <div class="add-task">
                    <input type="text" id="taskInput" placeholder="添加新任务...（支持智能解析，如：明天下午3点开会）">
                    <button class="add-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        添加
                    </button>
                </div>
                <div class="filter-tabs">
                    <button class="filter-tab ${this.currentFilter === 'all' ? 'active' : ''}" data-filter="all">全部</button>
                    <button class="filter-tab ${this.currentFilter === 'pending' ? 'active' : ''}" data-filter="pending">待办</button>
                    <button class="filter-tab ${this.currentFilter === 'completed' ? 'active' : ''}" data-filter="completed">已完成</button>
                    <button class="filter-tab ${this.currentFilter === 'overdue' ? 'active' : ''}" data-filter="overdue">已逾期</button>
                </div>
                <ul class="todo-list" id="todoList">
                    ${this.renderTaskList()}
                </ul>
            </div>
        `;
    }

    renderParserHint() {
        return `
            <div class="parser-hint">
                <div class="parser-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 15s1.5-2 4-2 4 2 4 2"></path>
                        <circle cx="9" cy="9" r="1"></circle>
                        <circle cx="15" cy="9" r="1"></circle>
                    </svg>
                </div>
                <div class="parser-text">
                    <h4>智能解析</h4>
                    <p>支持自然语言输入，如"明天下午3点开会"，系统会自动识别时间和任务内容</p>
                </div>
            </div>
        `;
    }

    renderTaskList() {
        const filteredTasks = this.getFilteredTasks();
        
        if (filteredTasks.length === 0) {
            return `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6"></path>
                    </svg>
                    <p>暂无任务，开始添加吧！</p>
                </div>
            `;
        }

        return filteredTasks.map(task => `
            <li class="todo-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                <div class="checkbox ${task.completed ? 'checked' : ''}"></div>
                <div class="task-content">
                    <div class="task-text">${task.title}</div>
                    <div class="task-meta">
                        <span class="priority-badge priority-${task.priority}">${this.getPriorityLabel(task.priority)}</span>
                        <span class="category-tag">${task.category}</span>
                        <span>${task.dueDate}</span>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="action-btn edit">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="action-btn delete">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </li>
        `).join('');
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        switch (this.currentFilter) {
            case 'completed':
                filtered = filtered.filter(t => t.completed);
                break;
            case 'pending':
                filtered = filtered.filter(t => !t.completed);
                break;
            case 'overdue':
                const today = new Date().toISOString().split('T')[0];
                filtered = filtered.filter(t => !t.completed && t.dueDate < today);
                break;
        }
        
        return filtered.sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.dueDate.localeCompare(b.dueDate);
        });
    }

    getPriorityLabel(priority) {
        const labels = { high: '高', medium: '中', low: '低' };
        return labels[priority] || priority;
    }

    handleFilterClick(tab) {
        this.currentFilter = tab.dataset.filter;
        this.renderTodoSection();
    }

    handleToggleComplete(checkbox) {
        const taskItem = checkbox.closest('.todo-item');
        const taskId = parseInt(taskItem.dataset.id);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTodoSection();
        }
    }

    handleDeleteTask(btn) {
        const taskItem = btn.closest('.todo-item');
        const taskId = parseInt(taskItem.dataset.id);
        
        if (confirm('确定要删除这个任务吗？')) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
            this.saveTasks();
            this.renderTodoSection();
        }
    }

    handleEditTask(btn) {
        const taskItem = btn.closest('.todo-item');
        const taskId = parseInt(taskItem.dataset.id);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.renderEditModal(task);
        }
    }

    handleAddTask() {
        const input = document.getElementById('taskInput');
        const text = input.value.trim();
        
        if (!text) return;
        
        const parsed = this.parseNaturalLanguage(text);
        
        const newTask = {
            id: Date.now(),
            title: parsed.title,
            description: '',
            completed: false,
            priority: parsed.priority || 'medium',
            category: parsed.category || '工作',
            dueDate: parsed.dueDate || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString().split('T')[0]
        };
        
        this.tasks.push(newTask);
        input.value = '';
        this.saveTasks();
        this.renderTodoSection();
    }

    parseNaturalLanguage(text) {
        const result = { title: text, priority: null, category: null, dueDate: null };
        
        const priorityMap = {
            '紧急': 'high', '重要': 'high', '高': 'high',
            '一般': 'medium', '中等': 'medium', '中': 'medium',
            '低': 'low', '次要': 'low'
        };
        
        const categoryMap = {
            '工作': '工作', '项目': '工作', '会议': '工作', '报告': '工作', '邮件': '工作',
            '学习': '学习', '课程': '学习', '阅读': '学习', '研究': '学习',
            '生活': '生活', '购物': '生活', '家务': '生活',
            '娱乐': '娱乐', '电影': '娱乐', '游戏': '娱乐',
            '健康': '健康', '锻炼': '健康', '健身': '健康'
        };
        
        for (const [keyword, priority] of Object.entries(priorityMap)) {
            if (text.includes(keyword)) {
                result.priority = priority;
                result.title = text.replace(keyword, '').trim();
                break;
            }
        }
        
        for (const [keyword, category] of Object.entries(categoryMap)) {
            if (text.includes(keyword)) {
                result.category = category;
                break;
            }
        }
        
        const today = new Date();
        const tomorrow = new Date(Date.now() + 86400000);
        
        if (text.includes('今天') || text.includes('今日')) {
            result.dueDate = today.toISOString().split('T')[0];
        } else if (text.includes('明天') || text.includes('明日')) {
            result.dueDate = tomorrow.toISOString().split('T')[0];
        } else if (text.includes('后天')) {
            result.dueDate = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];
        } else if (text.includes('下周')) {
            const nextWeek = new Date(today.getTime() + (7 - today.getDay() + 7) * 86400000);
            result.dueDate = nextWeek.toISOString().split('T')[0];
        }
        
        return result;
    }

    renderEditModal(task) {
        const html = `
            <div class="modal-overlay show" id="editModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">编辑任务</h3>
                        <button class="close-btn">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form class="modal-form" id="editForm">
                        <input type="hidden" id="taskId" value="${task.id}">
                        <div class="form-group">
                            <label for="taskTitle">任务标题</label>
                            <input type="text" id="taskTitle" value="${task.title}" required>
                        </div>
                        <div class="form-group">
                            <label for="taskDescription">任务描述</label>
                            <textarea id="taskDescription">${task.description || ''}</textarea>
                        </div>
                        <div class="form-row">
                            <div class="form-group">
                                <label for="taskPriority">优先级</label>
                                <select id="taskPriority">
                                    <option value="high" ${task.priority === 'high' ? 'selected' : ''}>高</option>
                                    <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>中</option>
                                    <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="taskCategory">分类</label>
                                <select id="taskCategory">
                                    ${CATEGORIES.map(cat => `<option value="${cat}" ${task.category === cat ? 'selected' : ''}>${cat}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="taskDueDate">截止日期</label>
                            <input type="date" id="taskDueDate" value="${task.dueDate}">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="modal-btn secondary">取消</button>
                            <button type="button" class="modal-btn primary">保存</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    handleSaveTask() {
        const modal = document.getElementById('editModal');
        if (!modal) return;
        
        const taskId = parseInt(document.getElementById('taskId').value);
        const task = this.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.title = document.getElementById('taskTitle').value;
            task.description = document.getElementById('taskDescription').value;
            task.priority = document.getElementById('taskPriority').value;
            task.category = document.getElementById('taskCategory').value;
            task.dueDate = document.getElementById('taskDueDate').value;
            
            this.saveTasks();
            this.closeModal();
            this.renderTodoSection();
        }
    }

    closeModal() {
        const modal = document.getElementById('editModal');
        if (modal) {
            modal.remove();
        }
    }

    renderDashboard() {
        const stats = this.getStats();
        return `
            <div class="dashboard-section">
                <div class="stat-card">
                    <div class="stat-icon total">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 1.99-1.61L23 6H6"></path>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">总任务数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon pending">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.pending}</div>
                    <div class="stat-label">待完成</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon completed">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.completed}</div>
                    <div class="stat-label">已完成</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon overdue">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="M12 6v6l4 2"></path>
                        </svg>
                    </div>
                    <div class="stat-value">${stats.overdue}</div>
                    <div class="stat-label">已逾期</div>
                </div>
            </div>
            <div class="chart-section">
                <h3 class="section-title">任务完成趋势</h3>
                <div class="chart-container">
                    ${this.renderChart()}
                </div>
            </div>
            <div class="chart-section">
                <h3 class="section-title">任务分类统计</h3>
                <div class="chart-container">
                    ${this.renderCategoryChart()}
                </div>
            </div>
        `;
    }

    getStats() {
        const today = new Date().toISOString().split('T')[0];
        const total = this.tasks.length;
        const completed = this.tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const overdue = this.tasks.filter(t => !t.completed && t.dueDate < today).length;
        
        return { total, completed, pending, overdue };
    }

    renderChart() {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date(Date.now() - i * 86400000);
            last7Days.push(date.toISOString().split('T')[0]);
        }
        
        const completedData = last7Days.map(date => {
            return this.tasks.filter(t => t.completed && t.createdAt === date).length;
        });
        
        const createdData = last7Days.map(date => {
            return this.tasks.filter(t => t.createdAt === date).length;
        });
        
        const maxValue = Math.max(...completedData, ...createdData, 1);
        
        return `
            <svg viewBox="0 0 800 250" class="chart-svg">
                <defs>
                    <linearGradient id="completedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.2" />
                    </linearGradient>
                    <linearGradient id="createdGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:#667eea;stop-opacity:0.8" />
                        <stop offset="100%" style="stop-color:#667eea;stop-opacity:0.2" />
                    </linearGradient>
                </defs>
                ${this.renderGridLines(maxValue)}
                ${this.renderBarChart(last7Days, createdData, 'createdGradient', 30, 150)}
                ${this.renderBarChart(last7Days, completedData, 'completedGradient', 70, 150)}
                ${this.renderXAxis(last7Days)}
                <g transform="translate(50, 230)">
                    <rect x="0" y="-20" width="20" height="15" fill="url(#createdGradient)"></rect>
                    <text x="25" y="-8" font-size="12" fill="#6b7280">创建</text>
                    <rect x="60" y="-20" width="20" height="15" fill="url(#completedGradient)"></rect>
                    <text x="85" y="-8" font-size="12" fill="#6b7280">完成</text>
                </g>
            </svg>
        `;
    }

    renderGridLines(maxValue) {
        const lines = [];
        const step = maxValue > 0 ? Math.ceil(maxValue / 4) : 1;
        
        for (let i = 0; i <= 4; i++) {
            const value = i * step;
            const y = 200 - (i * 150 / 4);
            lines.push(`
                <line x1="60" y1="${y}" x2="780" y2="${y}" stroke="#e5e7eb" stroke-dasharray="4" />
                <text x="50" y="${y + 4}" font-size="12" fill="#9ca3af" text-anchor="end">${value}</text>
            `);
        }
        return lines.join('');
    }

    renderBarChart(labels, data, gradientId, offset, width) {
        const barWidth = width / labels.length;
        const maxValue = Math.max(...data, 1);
        
        return data.map((value, index) => {
            const x = 60 + index * barWidth + offset;
            const height = maxValue > 0 ? (value / maxValue) * 150 : 0;
            const y = 200 - height;
            
            return `
                <rect x="${x}" y="${y}" width="${barWidth - 10}" height="${height}" fill="url(#${gradientId})" rx="4" />
            `;
        }).join('');
    }

    renderXAxis(labels) {
        const barWidth = 150 / labels.length;
        
        return labels.map((date, index) => {
            const x = 60 + index * barWidth + 75;
            const dateObj = new Date(date);
            const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
            return `<text x="${x}" y="220" font-size="11" fill="#9ca3af" text-anchor="middle">${label}</text>`;
        }).join('');
    }

    renderCategoryChart() {
        const categoryCounts = CATEGORIES.map(cat => {
            return this.tasks.filter(t => t.category === cat).length;
        });
        
        const total = categoryCounts.reduce((a, b) => a + b, 0);
        const colors = ['#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
        
        let currentAngle = 0;
        const segments = [];
        const centerX = 400;
        const centerY = 125;
        const radius = 80;
        
        categoryCounts.forEach((count, index) => {
            if (count === 0) return;
            
            const angle = (count / total) * 360;
            const startAngle = (currentAngle - 90) * (Math.PI / 180);
            const endAngle = (currentAngle + angle - 90) * (Math.PI / 180);
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArc = angle > 180 ? 1 : 0;
            
            segments.push(`
                <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${colors[index]}" opacity="0.8" />
            `);
            
            currentAngle += angle;
        });
        
        const legendItems = CATEGORIES.map((cat, index) => {
            const count = categoryCounts[index];
            return `
                <g transform="translate(${550 + (index % 3) * 100}, ${60 + Math.floor(index / 3) * 30})">
                    <rect x="0" y="0" width="16" height="12" fill="${colors[index]}" rx="2"></rect>
                    <text x="22" y="10" font-size="12" fill="#4b5563">${cat} (${count})</text>
                </g>
            `;
        }).join('');
        
        return `
            <svg viewBox="0 0 800 250" class="chart-svg">
                ${segments.join('')}
                ${legendItems}
            </svg>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SmartTodoApp();
});
