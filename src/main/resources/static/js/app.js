// API URLs
const API_BASE = 'http://localhost:8080/api';
const PRODUCTS_API = `${API_BASE}/products`;
const CATEGORIES_API = `${API_BASE}/categories`;

// State
let products = [];
let categories = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentCategory = 'all';
let searchQuery = '';

// DOM Elements
const productsGrid = document.getElementById('productsGrid');
const categoriesList = document.getElementById('categoriesList');
const cartBtn = document.getElementById('cartBtn');
const cartCount = document.getElementById('cartCount');
const cartModal = document.getElementById('cartModal');
const productModal = document.getElementById('productModal');
const searchInput = document.getElementById('searchInput');
const sectionTitle = document.getElementById('sectionTitle');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();
    loadProducts();
    updateCartCount();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    cartBtn.addEventListener('click', () => openCart());
    document.getElementById('closeCartModal').addEventListener('click', () => closeCart());
    document.getElementById('closeModal').addEventListener('click', () => closeProductModal());
    document.getElementById('checkoutBtn').addEventListener('click', () => checkout());
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderProducts();
    });

    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target === cartModal) closeCart();
        if (e.target === productModal) closeProductModal();
    });
}

// API Calls
async function loadProducts() {
    try {
        const response = await fetch(PRODUCTS_API);
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', response.status, errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        products = await response.json();
        renderProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        let errorMessage = 'Ошибка загрузки товаров. ';
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += 'Проверьте, что сервер запущен на порту 8080.';
        } else {
            errorMessage += `Ошибка: ${error.message}`;
        }
        productsGrid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--danger-color);">${errorMessage}</p>`;
    }
}

async function loadCategories() {
    try {
        const response = await fetch(CATEGORIES_API);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        categories = await response.json();
        renderCategories();
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Render Functions
function renderCategories() {
    const allBtn = categoriesList.querySelector('[data-category="all"]');
    categories.forEach(category => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'category-btn';
        btn.textContent = category.name;
        btn.dataset.category = category.id;
        btn.addEventListener('click', () => filterByCategory(category.id));
        li.appendChild(btn);
        categoriesList.appendChild(li);
    });
}

function renderProducts() {
    let filteredProducts = products;

    // Filter by category
    if (currentCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category.id === currentCategory);
    }

    // Filter by search query
    if (searchQuery) {
        filteredProducts = filteredProducts.filter(p => 
            p.name.toLowerCase().includes(searchQuery) ||
            p.description.toLowerCase().includes(searchQuery)
        );
    }

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-light);">Товары не найдены</p>';
        return;
    }

    productsGrid.innerHTML = filteredProducts.map(product => {
        const imageUrl = product.imagePath || 'images/placeholder.svg';
        return `
        <div class="product-card">
            <div class="product-image">
                <img src="${imageUrl}" 
                     alt="${product.name}" 
                     onerror="this.onerror=null; this.src='images/placeholder.svg';"
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">
            </div>
            <div class="product-name">${product.name}</div>
            <div class="product-description">${product.description}</div>
            <div class="product-footer">
                <div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-quantity">В наличии: ${product.quantity}</div>
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-secondary" onclick="showProductDetails(${product.id})">
                    Подробнее
                </button>
                <button class="btn btn-primary" onclick="addToCart(${product.id})" 
                        ${product.quantity === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    В корзину
                </button>
            </div>
        </div>
    `;
    }).join('');
}

function filterByCategory(categoryId) {
    currentCategory = categoryId;
    
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === categoryId.toString() || (categoryId === 'all' && btn.dataset.category === 'all')) {
            btn.classList.add('active');
        }
    });

    // Update section title and back button
    const backBtn = document.getElementById('backBtn');
    if (categoryId === 'all') {
        sectionTitle.textContent = 'Все товары';
        if (backBtn) backBtn.style.display = 'none';
    } else {
        const category = categories.find(c => c.id === categoryId);
        sectionTitle.textContent = category ? category.name : 'Все товары';
        if (backBtn) backBtn.style.display = 'inline-block';
    }

    renderProducts();
}

// Product Details
async function showProductDetails(productId) {
    try {
        const response = await fetch(`${PRODUCTS_API}/${productId}`);
        const product = await response.json();
        
        const modalBody = document.getElementById('modalBody');
        const imageUrl = product.imagePath || 'images/placeholder.svg';
        modalBody.innerHTML = `
            <div class="product-detail">
                <div class="product-detail-image">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         onerror="this.onerror=null; this.src='images/placeholder.svg';"
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 0.5rem;">
                </div>
                <div class="product-detail-info">
                    <h2>${product.name}</h2>
                    <p>${product.description}</p>
                    <div class="product-detail-price">${formatPrice(product.price)}</div>
                    <p><strong>Категория:</strong> ${product.category.name}</p>
                    <p><strong>В наличии:</strong> ${product.quantity} шт.</p>
                    <div class="product-actions" style="margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="addToCart(${product.id}); closeProductModal();" 
                                ${product.quantity === 0 ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                            В корзину
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        productModal.classList.add('show');
    } catch (error) {
        console.error('Error loading product details:', error);
    }
}

function closeProductModal() {
    productModal.classList.remove('show');
}

// Cart Functions
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product || product.quantity === 0) {
        alert('Товар недоступен');
        return;
    }

    const cartItem = cart.find(item => item.id === productId);
    if (cartItem) {
        if (cartItem.quantity >= product.quantity) {
            alert('Достигнуто максимальное количество товара');
            return;
        }
        cartItem.quantity++;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }

    saveCart();
    updateCartCount();
    showNotification('Товар добавлен в корзину');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartCount();
    renderCart();
}

function updateCartItemQuantity(productId, change) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;

    const product = products.find(p => p.id === productId);
    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (product && newQuantity > product.quantity) {
        alert('Недостаточно товара на складе');
        return;
    }

    item.quantity = newQuantity;
    saveCart();
    updateCartCount();
    renderCart();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartCount() {
    const total = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = total;
}

function openCart() {
    renderCart();
    cartModal.classList.add('show');
}

function closeCart() {
    cartModal.classList.remove('show');
}

function renderCart() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');

    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">Корзина пуста</div>';
        cartTotal.textContent = '0';
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    cartTotal.textContent = formatPrice(total);

    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">${formatPrice(item.price)} за шт.</div>
            </div>
            <div class="cart-item-quantity">
                <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="updateCartItemQuantity(${item.id}, 1)">+</button>
            </div>
            <div class="cart-item-total">${formatPrice(item.price * item.quantity)}</div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">Удалить</button>
        </div>
    `).join('');
}

function checkout() {
    if (cart.length === 0) {
        alert('Корзина пуста');
        return;
    }

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    alert(`Заказ оформлен!\n\nТоваров: ${cart.reduce((sum, item) => sum + item.quantity, 0)}\nСумма: ${formatPrice(total)}\n\nСпасибо за покупку!`);
    
    cart = [];
    saveCart();
    updateCartCount();
    renderCart();
    closeCart();
}

function formatPrice(price) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'KZT',
        minimumFractionDigits: 0
    }).format(price);
}

function showNotification(message) {
    // Simple notification (можно улучшить)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        box-shadow: var(--shadow-lg);
        z-index: 2000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Add CSS animations
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
`;
document.head.appendChild(style);

