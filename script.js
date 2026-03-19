const bar = document.getElementById('bar');
const close = document.getElementById('close');
const nav = document.getElementById('navbar');

if (bar) {
    bar.addEventListener('click', () => {
        nav.classList.add('active');
    });
}

if (close) {
    close.addEventListener('click', () => {
        nav.classList.remove('active');
    });
}
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    const backToTop = document.getElementById('back-to-top');

    if (header) {
        if (window.scrollY > 100) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }
    }

    if (backToTop) {
        if (window.scrollY > 500) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    }
});
const backToTopBtn = document.getElementById('back-to-top');
if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
function showNotification(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notice ${type}`;
    toast.innerHTML = `
        <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: type === 'success' ? '#088178' : '#d8000c',
        color: '#fff',
        padding: '15px 25px',
        borderRadius: '8px',
        boxShadow: '0 5px 15px rgba(0,0,0,0.2)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        animation: 'slideUp 0.3s ease-out'
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = '0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
const style = document.createElement('style');
style.innerHTML = `
    @keyframes slideUp {
        from { transform: translateY(100px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeInUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .fadeInUp {
        animation: fadeInUp 0.8s ease forwards;
    }
`;
document.head.appendChild(style);
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal:not(.active)');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    reveals.forEach(el => observer.observe(el));
}

async function checkAuth() {
    try {
        const res = await fetch('/api/profile');
        if (res.ok) {
            const user = await res.json();
            updateNavbar(user);
        } else {
            updateNavbar(null);
        }
    } catch (err) {
        updateNavbar(null);
    }
}

function updateNavbar(user) {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;
    const existingAuth = navbar.querySelectorAll('.auth-link');
    existingAuth.forEach(el => el.remove());
    const bagIcons = document.querySelectorAll('a[href="Profile.html"] i.far.fa-shopping-bag');
    bagIcons.forEach(icon => {
        icon.parentElement.href = 'Cart.html';
    });

    if (user) {
        navbar.insertAdjacentHTML('beforeend', `
            <li class="auth-link"><a href="Profile.html">Profile</a></li>
            <li class="auth-link"><a href="#" onclick="logout()">Logout</a></li>
        `);
    } else {
        navbar.insertAdjacentHTML('beforeend', `
            <li class="auth-link"><a href="Login.html">Login</a></li>
        `);
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.reload();
}

async function loadProducts(containerId) {
    const section = document.getElementById(containerId);
    if (!section) return;
    const container = section.querySelector('.pro-container');
    if (!container) return;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();

        let displayProducts = products.slice(0, 21);

        container.innerHTML = displayProducts.map(p => `
            <div class="pro reveal" onclick="window.location.href='Sproduct.html?id=${p.id}'">
                <div class="img-container">
                    <img src="${p.image}" alt="${p.name}">
                </div>
                <div class="des">
                    <span>${p.brand}</span>
                    <h5>${p.name}</h5>
                    <h4>Rs.${p.price}</h4>
                </div>
            </div>
        `).join('');
        initScrollReveal();
    } catch (err) {
        console.error('Error loading products:', err);
    }
}

async function loadProductDetails(productId) {
    try {
        const res = await fetch(`/api/products/${productId}`);
        const product = await res.json();

        const mainImg = document.getElementById('MainImg');
        const proName = document.getElementById('pro-name');
        const proPrice = document.getElementById('pro-price');
        const proPriceBox = document.getElementById('pro-price-box');
        const proDesc = document.getElementById('pro-desc');
        const proBrand = document.getElementById('pro-brand');
        const cartBtn = document.getElementById('add-to-cart-btn');

        if (mainImg) mainImg.src = product.image;
        if (proName) proName.innerText = product.name;
        if (proPrice) proPrice.innerText = `₹ ${product.price}.00`;
        if (proPriceBox) proPriceBox.innerText = `₹ ${product.price}.00`;
        if (proDesc) proDesc.innerText = product.description;
        if (proBrand) proBrand.innerText = `Visit the ${product.brand} Store`;

        const smallImgs = document.querySelectorAll('.small-img');
        if (smallImgs.length > 0) {
            smallImgs[0].src = product.image;
        }

        if (cartBtn) {
            cartBtn.onclick = () => {
                const qtySelect = document.getElementById('pro-quantity');
                const qty = qtySelect ? qtySelect.value : 1;
                addToCart(product.id, qty, true);
            };
        }

        loadProducts('product1');

    } catch (err) {
        console.error('Error loading product details:', err);
    }
}

async function addToCart(productId, quantity = 1, redirect = false) {
    try {
        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: parseInt(quantity) })
        });
        if (res.ok) {
            showNotification('Item added to cart successfully! ✨');
            if (redirect) {
                setTimeout(() => window.location.href = 'Cart.html', 800);
            }
        } else {
            const data = await res.json();
            if (res.status === 401) {
                showNotification('Please login to continue.', 'error');
                setTimeout(() => window.location.href = 'Login.html', 1000);
            } else {
                showNotification(data.message || 'Failed to add item.', 'error');
            }
        }
    } catch (err) {
        console.error('Error adding to cart:', err);
        showNotification('Network error. Could not add to cart.', 'error');
    }
}
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initScrollReveal();
    if (document.getElementById('product1')) {
        if (!window.location.pathname.includes('Sproduct.html')) {
            loadProducts('product1');
        }
    }
});

async function processCheckout() {
    try {
        const res = await fetch('/api/checkout', { method: 'POST' });
        const data = await res.json();

        if (res.ok) {
            showNotification('Order placed successfully! ✨');
            const cartTable = document.querySelector('.cart-table');
            const cartSummary = document.querySelector('.cart-summary');
            const pageHeader = document.querySelector('#page-header p');

            if (cartTable) cartTable.style.display = 'none';
            if (cartSummary) cartSummary.style.display = 'none';
            if (pageHeader) pageHeader.innerText = 'Your order is on its way!';
            const confirmation = document.getElementById('checkout-confirmation');
            if (confirmation) {
                confirmation.style.display = 'block';
                confirmation.scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            showNotification(data.message || 'Checkout failed.', 'error');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        showNotification('Network error during checkout.', 'error');
    }
}

async function buyNow() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const qtySelect = document.getElementById('pro-quantity');
    const quantity = qtySelect ? qtySelect.value : 1;

    if (!productId) {
        showNotification('Invalid product.', 'error');
        return;
    }

    try {
        const res = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: parseInt(productId), quantity: parseInt(quantity) })
        });

        if (res.ok) {
            window.location.href = 'Cart.html';
        } else {
            const data = await res.json();
            if (res.status === 401) {
                showNotification('Please login to buy.', 'error');
                setTimeout(() => window.location.href = 'Login.html', 1000);
            } else {
                showNotification(data.message || 'Failed to buy now.', 'error');
            }
        }
    } catch (err) {
        console.error('Buy Now error:', err);
        showNotification('Network error.', 'error');
    }
}
