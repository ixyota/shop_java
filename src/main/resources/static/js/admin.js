// API URLs
const API_BASE = 'http://localhost:8080/api';
const ADMIN_API = `${API_BASE}/admin`;

// State
let isAuthenticated = false;
let categories = [];
let products = [];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const adminPanel = document.getElementById('adminPanel');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    loginBtn.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    logoutBtn.addEventListener('click', handleLogout);
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });

    // Category form
    document.getElementById('categoryForm').addEventListener('submit', handleCategorySubmit);
    
    // Product form
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
}

// Authentication
function checkAuth() {
    const auth = localStorage.getItem('adminAuth');
    if (auth === 'true') {
        isAuthenticated = true;
        showAdminPanel();
    } else {
        showLoginScreen();
    }
}

function handleLogin() {
    const password = passwordInput.value;
    
    fetch(`${ADMIN_API}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            localStorage.setItem('adminAuth', 'true');
            isAuthenticated = true;
            showAdminPanel();
            loginError.textContent = '';
        } else {
            loginError.textContent = data.message || 'Неверный пароль';
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        loginError.textContent = 'Ошибка при входе';
    });
}

function handleLogout() {
    localStorage.removeItem('adminAuth');
    isAuthenticated = false;
    showLoginScreen();
    passwordInput.value = '';
}

function showLoginScreen() {
    loginScreen.style.display = 'flex';
    adminPanel.style.display = 'none';
}

function showAdminPanel() {
    loginScreen.style.display = 'none';
    adminPanel.style.display = 'block';
    loadData();
}

// Tab Management
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(`${tab}Tab`).classList.add('active');
}

// Data Loading
function loadData() {
    loadCategories();
    loadProducts();
}

async function loadCategories() {
    try {
        const response = await fetch(`${ADMIN_API}/categories`);
        categories = await response.json();
        renderCategories();
        updateCategorySelect();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

async function loadProducts() {
    try {
        const response = await fetch(`${ADMIN_API}/products`);
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

// Render Functions
function renderCategories() {
    const tbody = document.getElementById('categoriesTable');
    tbody.innerHTML = categories.map(category => `
        <tr>
            <td>${category.id}</td>
            <td>${category.name}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editCategory(${category.id})">Редактировать</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCategory(${category.id})">Удалить</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function renderProducts() {
    const tbody = document.getElementById('productsTable');
    tbody.innerHTML = products.map(product => {
        const imageUrl = product.imagePath || 'images/placeholder.svg';
        const categoryName = product.category ? product.category.name : 'Без категории';
        return `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     class="table-image"
                     onerror="this.src='images/placeholder.svg'">
            </td>
            <td>${product.name}</td>
            <td>${product.price ? product.price.toFixed(2) : '0.00'} ₸</td>
            <td>${product.quantity || 0}</td>
            <td>${categoryName}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editProduct(${product.id})">Редактировать</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteProduct(${product.id})">Удалить</button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// Category Management
function showCategoryModal(categoryId = null) {
    const modal = document.getElementById('categoryModal');
    const form = document.getElementById('categoryForm');
    const title = document.getElementById('categoryModalTitle');
    
    if (categoryId) {
        const category = categories.find(c => c.id === categoryId);
        document.getElementById('categoryId').value = category.id;
        document.getElementById('categoryName').value = category.name;
        title.textContent = 'Редактировать категорию';
    } else {
        form.reset();
        document.getElementById('categoryId').value = '';
        title.textContent = 'Добавить категорию';
    }
    
    modal.classList.add('show');
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('show');
    document.getElementById('categoryForm').reset();
}

function handleCategorySubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('categoryId').value;
    const name = document.getElementById('categoryName').value;
    
    const category = { name };
    const url = id ? `${ADMIN_API}/categories/${id}` : `${ADMIN_API}/categories`;
    const method = id ? 'PUT' : 'POST';
    
    if (id) category.id = parseInt(id);
    
    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(category)
    })
    .then(response => response.json())
    .then(() => {
        closeCategoryModal();
        loadCategories();
    })
    .catch(error => {
        console.error('Error saving category:', error);
        alert('Ошибка при сохранении категории');
    });
}

function editCategory(id) {
    showCategoryModal(id);
}

function deleteCategory(id) {
    if (!confirm('Вы уверены, что хотите удалить эту категорию?')) return;
    
    fetch(`${ADMIN_API}/categories/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        loadCategories();
        loadProducts(); // Reload products in case category was deleted
    })
    .catch(error => {
        console.error('Error deleting category:', error);
        alert('Ошибка при удалении категории');
    });
}

// Product Management
function showProductModal(productId = null) {
    const modal = document.getElementById('productModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productModalTitle');
    
    if (productId) {
        const product = products.find(p => p.id === productId);
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price || 0;
        document.getElementById('productQuantity').value = product.quantity || 0;
        document.getElementById('productCategory').value = product.category ? product.category.id : '';
        document.getElementById('productImagePath').value = product.imagePath || '';
        
        // Show image preview
        const preview = document.getElementById('imagePreview');
        if (product.imagePath) {
            preview.innerHTML = `<img src="${product.imagePath}" alt="${product.name}">`;
            preview.classList.remove('empty');
        } else {
            preview.innerHTML = 'Нет изображения';
            preview.classList.add('empty');
        }
        
        title.textContent = 'Редактировать товар';
    } else {
        form.reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').innerHTML = 'Нет изображения';
        document.getElementById('imagePreview').classList.add('empty');
        title.textContent = 'Добавить товар';
    }
    
    updateCategorySelect();
    modal.classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    document.getElementById('productForm').reset();
}

function updateCategorySelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Выберите категорию</option>' +
        categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    fetch(`${ADMIN_API}/upload`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.url) {
            document.getElementById('productImagePath').value = data.url;
            const preview = document.getElementById('imagePreview');
            preview.innerHTML = `<img src="${data.url}" alt="Preview">`;
            preview.classList.remove('empty');
        } else {
            alert('Ошибка при загрузке изображения: ' + (data.error || 'Неизвестная ошибка'));
        }
    })
    .catch(error => {
        console.error('Error uploading image:', error);
        alert('Ошибка при загрузке изображения');
    });
}

function handleProductSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const name = document.getElementById('productName').value;
    const description = document.getElementById('productDescription').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const quantity = parseInt(document.getElementById('productQuantity').value);
    const categoryId = parseInt(document.getElementById('productCategory').value);
    const imagePath = document.getElementById('productImagePath').value;
    
    const category = categories.find(c => c.id === categoryId);
    if (!category) {
        alert('Выберите категорию');
        return;
    }
    
    const product = {
        name,
        description,
        price,
        quantity,
        category: { id: categoryId, name: category.name },
        imagePath: imagePath || null
    };
    
    const url = id ? `${ADMIN_API}/products/${id}` : `${ADMIN_API}/products`;
    const method = id ? 'PUT' : 'POST';
    
    if (id) product.id = parseInt(id);
    
    fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(product)
    })
    .then(response => response.json())
    .then(() => {
        closeProductModal();
        loadProducts();
    })
    .catch(error => {
        console.error('Error saving product:', error);
        alert('Ошибка при сохранении товара');
    });
}

function editProduct(id) {
    showProductModal(id);
}

function deleteProduct(id) {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    fetch(`${ADMIN_API}/products/${id}`, {
        method: 'DELETE'
    })
    .then(() => {
        loadProducts();
    })
    .catch(error => {
        console.error('Error deleting product:', error);
        alert('Ошибка при удалении товара');
    });
}
