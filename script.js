// Product Data
        const products = [
            { id: 1, name: "iPhone 16 Pro", price: 999.00 },
            { id: 2, name: "Samsung Galaxy S25 Ultra", price: 1299.00 },
            { id: 3, name: "Google Pixel 9 Pro", price: 899.00 },
            { id: 4, name: "iPhone 16", price: 799.00 },
            { id: 5, name: "Samsung Galaxy S25", price: 799.00 },
            { id: 6, name: "Google Pixel 9", price: 699.00 }
        ];

        let cart = [];

        // SVGs
        const phoneSvg = `<svg viewBox="0 0 24 24"><path d="M17 2H7c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 18H7V4h10v16zM9 19h6v1H9z"/></svg>`;

        // Format Currency
        const formatMoney = (amount) => {
            return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
        };

        // Initialize App
        function init() {
            renderProducts();
            updateCartUI();
        }

        // Render Product Grid
        function renderProducts() {
            const grid = document.getElementById('productGrid');
            grid.innerHTML = products.map(product => {
                const monthly = product.price / 36;
                return `
                    <div class="product-card">
                        <div class="product-image">
                            ${phoneSvg}
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <div class="product-price-monthly">
                                ${formatMoney(monthly)}<span>/mo</span>
                            </div>
                            <div class="product-price-retail">
                                for 36 mos, 0% APR; Retail price: ${formatMoney(product.price)}
                            </div>
                            <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Add to Cart
        function addToCart(productId) {
            const product = products.find(p => p.id === productId);
            const existingItem = cart.find(item => item.product.id === productId);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ product, quantity: 1 });
            }

            updateCartUI();
            
            // Open cart automatically when adding
            if(!document.getElementById('cartPanel').classList.contains('active')) {
                toggleCart();
            }
        }

        // Change Quantity
        function changeQuantity(productId, delta) {
            const itemIndex = cart.findIndex(item => item.product.id === productId);
            if (itemIndex > -1) {
                cart[itemIndex].quantity += delta;
                if (cart[itemIndex].quantity <= 0) {
                    cart.splice(itemIndex, 1);
                }
                updateCartUI();
            }
        }

        // Update Cart UI
        function updateCartUI() {
            // Update Badge Count
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            document.getElementById('cartCount').textContent = totalItems;

            // Calculate Total
            const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            const formattedTotal = formatMoney(totalPrice);
            document.getElementById('cartTotalDue').textContent = formattedTotal;
            document.getElementById('modalTotalDue').textContent = formattedTotal;

            // Enable/Disable Checkout Button
            const checkoutBtn = document.getElementById('checkoutBtn');
            checkoutBtn.disabled = cart.length === 0;
            checkoutBtn.style.opacity = cart.length === 0 ? '0.5' : '1';
            checkoutBtn.style.cursor = cart.length === 0 ? 'not-allowed' : 'pointer';

            // Render Items
            const cartItemsContainer = document.getElementById('cartItems');
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `<div class="empty-cart">Your cart is empty.</div>`;
                return;
            }

            cartItemsContainer.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="cart-item-img">${phoneSvg}</div>
                    <div class="cart-item-details">
                        <div class="cart-item-title">${item.product.name}</div>
                        <div class="cart-item-price">${formatMoney(item.product.price)}</div>
                        <div class="cart-item-actions">
                            <button class="qty-btn" onclick="changeQuantity(${item.product.id}, -1)">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="changeQuantity(${item.product.id}, 1)">+</button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Toggle Cart Panel
        function toggleCart() {
            const panel = document.getElementById('cartPanel');
            const overlay = document.getElementById('cartOverlay');
            panel.classList.toggle('active');
            overlay.classList.toggle('active');
            
            if(document.body.style.overflow === 'hidden') {
                document.body.style.overflow = '';
            } else {
                document.body.style.overflow = 'hidden';
            }
        }

        // Modal Controls
        function openCheckout() {
            if (cart.length === 0) return;
            toggleCart(); // Close cart panel
            const modal = document.getElementById('checkoutModal');
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeCheckout() {
            const modal = document.getElementById('checkoutModal');
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        // Handle Checkout Submission
        function handleCheckout(event) {
            event.preventDefault();
            
            const name = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            
            const totalPrice = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
            const amountCents = Math.round(totalPrice * 100);
            
            const productNamesList = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
            const productDescription = `Order for ${name} (${email}): ${productNamesList}`;

            closeCheckout();

            // Call requested function
            if (typeof window.__processPayment === 'function') {
                window.__processPayment(amountCents, productNamesList, productDescription);
            } else {
                console.log("window.__processPayment called with:", { amountCents, productName: productNamesList, productDescription });
                // Fallback for visual testing if function doesn't exist
                const btn = event.target.querySelector('button[type="submit"]');
                const originalText = btn.textContent;
                btn.textContent = "Processing...";
                setTimeout(() => {
                    alert(`Payment processed successfully!\n\nAmount: ${amountCents} cents\nItems: ${productNamesList}\nDesc: ${productDescription}`);
                    cart = [];
                    updateCartUI();
                    btn.textContent = originalText;
                }, 800);
            }
        }

        // Boot
        window.addEventListener('DOMContentLoaded', init);