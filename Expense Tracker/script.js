// SpendWise - Expense Tracker Application
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const expenseForm = document.getElementById('expense-form');
    const expenseNameInput = document.getElementById('expense-name');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseCategorySelect = document.getElementById('expense-category');
    const expenseDateInput = document.getElementById('expense-date');
    const expenseNotesInput = document.getElementById('expense-notes');
    const expensesList = document.getElementById('expenses-list');
    const totalExpenseElement = document.getElementById('total-expense');
    const totalTransactionsElement = document.getElementById('total-transactions');
    const todayExpenseElement = document.getElementById('today-expense');
    const weekExpenseElement = document.getElementById('week-expense');
    const avgExpenseElement = document.getElementById('avg-expense');
    const topCategoryElement = document.getElementById('top-category');
    const categoryFilter = document.getElementById('category-filter');
    const clearBtn = document.getElementById('clear-btn');
    const deleteAllBtn = document.getElementById('delete-all');
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const categoryBreakdown = document.getElementById('category-breakdown');
    const themeToggle = document.getElementById('theme-toggle');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Initialize expenses array
    let expenses = JSON.parse(localStorage.getItem('spendwiseExpenses')) || [];
    let editMode = false;
    let currentEditId = null;
    
    // Initialize date to today
    const today = new Date().toISOString().split('T')[0];
    expenseDateInput.value = today;
    expenseDateInput.max = today;
    
    // Load expenses on page load
    loadExpenses();
    updateAllStats();
    
    // Theme Switcher
    themeToggle.addEventListener('click', function() {
        const themeOptionsDiv = document.querySelector('.theme-options');
        themeOptionsDiv.style.display = themeOptionsDiv.style.display === 'flex' ? 'none' : 'flex';
    });
    
    themeOptions.forEach(option => {
        option.addEventListener('click', function() {
            const theme = this.dataset.theme;
            document.body.className = `theme-${theme}`;
            localStorage.setItem('preferredTheme', theme);
            
            // Update theme options display
            document.querySelector('.theme-options').style.display = 'none';
        });
    });
    
    // Load saved theme
    const savedTheme = localStorage.getItem('preferredTheme') || 'dark';
    document.body.className = `theme-${savedTheme}`;
    
    // Form submission
    expenseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = expenseNameInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        const category = expenseCategorySelect.value;
        const date = expenseDateInput.value;
        const notes = expenseNotesInput.value.trim();
        
        if (!name || !amount || !category || !date) {
            showNotification('Please fill all required fields', 'error');
            return;
        }
        
        if (amount <= 0) {
            showNotification('Amount must be greater than 0', 'error');
            return;
        }
        
        if (editMode && currentEditId) {
            // Update existing expense
            const index = expenses.findIndex(exp => exp.id === currentEditId);
            if (index !== -1) {
                expenses[index] = {
                    id: currentEditId,
                    name,
                    amount,
                    category,
                    date,
                    notes,
                    updatedAt: new Date().toISOString()
                };
            }
            showNotification('Expense updated successfully!', 'success');
            editMode = false;
            currentEditId = null;
        } else {
            // Add new expense
            const expense = {
                id: Date.now().toString(),
                name,
                amount,
                category,
                date,
                notes,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            expenses.push(expense);
            showNotification('Expense added successfully!', 'success');
        }
        
        saveExpenses();
        loadExpenses();
        updateAllStats();
        clearForm();
    });
    
    // Clear form button
    clearBtn.addEventListener('click', clearForm);
    
    // Delete all expenses
    deleteAllBtn.addEventListener('click', function() {
        if (expenses.length === 0) {
            showNotification('No expenses to delete', 'warning');
            return;
        }
        
        if (confirm('Are you sure you want to delete ALL expenses? This cannot be undone.')) {
            expenses = [];
            saveExpenses();
            loadExpenses();
            updateAllStats();
            showNotification('All expenses deleted successfully!', 'success');
        }
    });
    
    // Export expenses
    exportBtn.addEventListener('click', function() {
        if (expenses.length === 0) {
            showNotification('No expenses to export', 'warning');
            return;
        }
        
        const dataStr = JSON.stringify(expenses, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `spendwise-expenses-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification(`Exported ${expenses.length} expenses successfully!`, 'success');
    });
    
    // Import expenses
    importBtn.addEventListener('click', function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = function(event) {
                try {
                    const importedExpenses = JSON.parse(event.target.result);
                    
                    if (!Array.isArray(importedExpenses)) {
                        throw new Error('Invalid file format');
                    }
                    
                    // Merge with existing expenses
                    expenses = [...expenses, ...importedExpenses];
                    // Remove duplicates by id
                    const uniqueIds = new Set();
                    expenses = expenses.filter(expense => {
                        if (uniqueIds.has(expense.id)) {
                            return false;
                        }
                        uniqueIds.add(expense.id);
                        return true;
                    });
                    
                    saveExpenses();
                    loadExpenses();
                    updateAllStats();
                    showNotification(`Successfully imported ${importedExpenses.length} expenses!`, 'success');
                } catch (error) {
                    showNotification('Error importing file. Please check the file format.', 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });
    
    // Category filter
    categoryFilter.addEventListener('change', loadExpenses);
    
    // Functions
    function loadExpenses() {
        const filterValue = categoryFilter.value;
        
        let filteredExpenses = expenses;
        
        // Filter by category
        if (filterValue !== 'all') {
            filteredExpenses = filteredExpenses.filter(exp => exp.category === filterValue);
        }
        
        // Sort by date (newest first)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (filteredExpenses.length === 0) {
            expensesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No expenses found</h3>
                    <p>${filterValue === 'all' ? 'Add your first expense' : 'No expenses in this category'}</p>
                </div>
            `;
            return;
        }
        
        expensesList.innerHTML = filteredExpenses.map(expense => `
            <div class="expense-item" data-id="${expense.id}">
                <div class="expense-info">
                    <div class="expense-name">
                        ${expense.name}
                        <span class="expense-category">${expense.category}</span>
                    </div>
                    <div class="expense-meta">
                        <span class="expense-date">${formatDate(expense.date)}</span>
                        ${expense.notes ? `<span class="expense-notes">${expense.notes}</span>` : ''}
                    </div>
                </div>
                <div class="expense-amount">
                    <span class="currency-symbol">₹</span>
                    ${expense.amount.toLocaleString('en-IN')}
                </div>
                <div class="expense-actions">
                    <button class="action-btn edit-btn" onclick="editExpense('${expense.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteExpense('${expense.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    function updateAllStats() {
        updateSummary();
        updateTodayExpense();
        updateWeekExpense();
        updateAvgExpense();
        updateTopCategory();
        updateCategoryBreakdown();
    }
    
    function updateSummary() {
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        totalExpenseElement.textContent = `₹ ${total.toLocaleString('en-IN')}`;
        totalTransactionsElement.textContent = expenses.length;
    }
    
    function updateTodayExpense() {
        const today = new Date().toISOString().split('T')[0];
        const todayExpenses = expenses.filter(exp => exp.date === today);
        const todayTotal = todayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        todayExpenseElement.textContent = `₹ ${todayTotal.toLocaleString('en-IN')}`;
    }
    
    function updateWeekExpense() {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        const weekExpenses = expenses.filter(exp => {
            const expenseDate = new Date(exp.date);
            return expenseDate >= oneWeekAgo;
        });
        
        const weekTotal = weekExpenses.reduce((sum, exp) => sum + exp.amount, 0);
        weekExpenseElement.textContent = `₹ ${weekTotal.toLocaleString('en-IN')}`;
    }
    
    function updateAvgExpense() {
        if (expenses.length === 0) {
            avgExpenseElement.textContent = '₹ 0';
            return;
        }
        
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        const oldestDate = new Date(Math.min(...expenses.map(exp => new Date(exp.date))));
        const today = new Date();
        const daysDiff = Math.max(1, Math.floor((today - oldestDate) / (1000 * 60 * 60 * 24)));
        const avg = total / daysDiff;
        
        avgExpenseElement.textContent = `₹ ${avg.toFixed(0)}`;
    }
    
    function updateTopCategory() {
        if (expenses.length === 0) {
            topCategoryElement.textContent = '-';
            return;
        }
        
        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        
        let topCategory = '';
        let maxAmount = 0;
        
        for (const [category, amount] of Object.entries(categoryTotals)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                topCategory = category;
            }
        }
        
        topCategoryElement.textContent = topCategory;
    }
    
    function updateCategoryBreakdown() {
        if (expenses.length === 0) {
            categoryBreakdown.innerHTML = `
                <div class="empty-state">
                    <p>Add expenses to see category breakdown</p>
                </div>
            `;
            return;
        }
        
        const categoryTotals = {};
        expenses.forEach(exp => {
            categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
        });
        
        const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        
        // Sort categories by amount (descending)
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);
        
        categoryBreakdown.innerHTML = sortedCategories.map(([category, amount]) => {
            const percentage = ((amount / total) * 100).toFixed(1);
            return `
                <div class="category-item">
                    <div class="category-header">
                        <span class="category-name">${category}</span>
                        <span class="category-amount">
                            <span class="currency-symbol">₹</span>
                            ${amount.toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div class="category-bar">
                        <div class="category-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="category-percentage">${percentage}%</div>
                </div>
            `;
        }).join('');
    }
    
    function saveExpenses() {
        localStorage.setItem('spendwiseExpenses', JSON.stringify(expenses));
    }
    
    function clearForm() {
        expenseForm.reset();
        expenseDateInput.value = today;
        expenseDateInput.max = today;
        editMode = false;
        currentEditId = null;
        document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-plus"></i> Add Expense';
    }
    
    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    }
    
    function showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#f59e0b'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
    
    // Global functions for edit/delete
    window.editExpense = function(id) {
        const expense = expenses.find(exp => exp.id === id);
        if (expense) {
            expenseNameInput.value = expense.name;
            expenseAmountInput.value = expense.amount;
            expenseCategorySelect.value = expense.category;
            expenseDateInput.value = expense.date;
            expenseNotesInput.value = expense.notes || '';
            
            editMode = true;
            currentEditId = id;
            
            // Update button text
            document.querySelector('.btn-primary').innerHTML = '<i class="fas fa-save"></i> Update Expense';
            
            // Scroll to form
            document.querySelector('.input-card').scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            
            showNotification('Editing expense. Update the fields and click "Update Expense"', 'info');
        }
    };
    
    window.deleteExpense = function(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            expenses = expenses.filter(exp => exp.id !== id);
            saveExpenses();
            loadExpenses();
            updateAllStats();
            showNotification('Expense deleted successfully!', 'success');
        }
    };
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .notification-content i {
            font-size: 1.2rem;
        }
        
        /* Indian number formatting */
        .amount, .stat-value, .category-amount, .expense-amount {
            font-feature-settings: "tnum";
            font-variant-numeric: tabular-nums;
        }
    `;
    document.head.appendChild(style);
});