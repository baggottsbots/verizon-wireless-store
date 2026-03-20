(function(){
  var params=new URLSearchParams(window.location.search);
  var fields={};
  var paramMap={
    'first_name':'firstName','last_name':'lastName','full_name':'fullName',
    'email':'email','phone':'phone','company':'company',
    'city':'city','state':'state','country':'country'
  };
  var skipTags={'SCRIPT':1,'STYLE':1,'NOSCRIPT':1,'TEXTAREA':1,'CODE':1,'PRE':1};
  var hasUrlFields=false;
  for(var p in paramMap){
    var v=params.get(p);
    if(v){fields[paramMap[p]]=v;hasUrlFields=true;}
  }
  var contactId=params.get('contact_id');
  function esc(s){
    if(!s)return s;
    var d=document.createElement('div');
    d.appendChild(document.createTextNode(s));
    return d.innerHTML;
  }
  function doReplace(data){
    var r={};
    r['{{full_name}}']=esc(((data.firstName||'')+' '+(data.lastName||'')).trim()||((data.fullName||data.name)||''));
    r['{{first_name}}']=esc(data.firstName||(data.name?data.name.split(' ')[0]:'')||'');
    r['{{last_name}}']=esc(data.lastName||(data.name&&data.name.indexOf(' ')>-1?data.name.substring(data.name.indexOf(' ')+1):'')||'');
    r['{{email}}']=esc(data.email||'');
    r['{{phone}}']=esc(data.phone||'');
    r['{{company}}']=esc(data.company||'');
    r['{{city}}']=esc(data.city||'');
    r['{{state}}']=esc(data.state||'');
    r['{{country}}']=esc(data.country||'');
    r['{{date}}']=new Date().toLocaleDateString();
    r['{{time}}']=new Date().toLocaleTimeString();
    r['{{location}}']=[data.city,data.state,data.country].filter(Boolean).join(', ');
    r['{{tracking_id}}']=esc(data.trackingId||'');
    r['{{lastClickedProduct}}']=esc(data.lastClickedProduct||'');
    r['{{lastProductClickDate}}']=esc(data.lastProductClickDate||'');
    r['{{lastClickedProductPrice}}']=esc(data.lastClickedProductPrice||'');
    r['{{lastClickedProductURL}}']=esc(data.lastClickedProductURL||'');
    r['{{productsClickedCount}}']=esc(data.productsClickedCount||'0');
    r['{{ip_address}}']=esc(data.ipAddress||'');
    r['{{ip}}']=esc(data.ipAddress||'');
    if(data.customFields){
      for(var k in data.customFields){
        r['{{'+k+'}}']=esc(String(data.customFields[k]||''));
      }
    }
    params.forEach(function(v,k){
      if(!paramMap[k]&&k!=='contact_id'&&k!=='page_id'&&k.indexOf('utm_')!==0){
        r['{{'+k+'}}']=esc(v);
      }
    });
    var hasValues=false;
    for(var key in r){if(r[key]){hasValues=true;break;}}
    if(!hasValues)return;
    var walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{
      acceptNode:function(n){
        var p=n.parentNode;
        if(p&&skipTags[p.nodeName])return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while(node=walker.nextNode()){
      var txt=node.nodeValue;
      if(txt&&txt.indexOf('{{')>-1){
        var changed=txt;
        for(var ph in r){
          if(r[ph]&&changed.indexOf(ph)>-1){
            changed=changed.split(ph).join(r[ph]);
          }
        }
        if(changed!==txt)node.nodeValue=changed;
      }
    }
    var attrs=['value','placeholder','content','alt','title'];
    attrs.forEach(function(attr){
      var els=document.querySelectorAll('['+attr+'*="{{"]');
      for(var i=0;i<els.length;i++){
        var tag=els[i].tagName;
        if(skipTags[tag])continue;
        var val=els[i].getAttribute(attr);
        if(val){
          var nv=val;
          for(var ph in r){
            if(r[ph]&&nv.indexOf(ph)>-1){
              nv=nv.split(ph).join(r[ph]);
            }
          }
          if(nv!==val)els[i].setAttribute(attr,nv);
        }
      }
    });
  }
  function run(){
    if(contactId){
      var xhr=new XMLHttpRequest();
      xhr.open('GET','https://paymegpt.com/api/landing/context/'+encodeURIComponent(contactId)+'?page_id=2229');
      xhr.onload=function(){
        if(xhr.status===200){
          try{
            var resp=JSON.parse(xhr.responseText);
            if(resp.success&&resp.contact){
              var merged=resp.contact;
              for(var k in fields){merged[k]=fields[k];}
              doReplace(merged);
              return;
            }
          }catch(e){}
        }
        if(hasUrlFields)doReplace(fields);
      };
      xhr.onerror=function(){if(hasUrlFields)doReplace(fields);};
      xhr.send();
    }else if(hasUrlFields){
      doReplace(fields);
    }
  }
  if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',run);}
  else{run();}
})();

(function(){
  var slug='9nSeEAP3Dx';
  var apiBase='https://paymegpt.com';
  window.__processPayment=function(opts){
    if(!opts||typeof opts!=='object'){return Promise.reject('Invalid payment options');}
    var amountCents=opts.amountCents;var email=opts.email;var productName=opts.productName;
    var productDescription=opts.productDescription||'';var customerName=opts.name||'';var quantity=opts.quantity||1;
    if(!productName){alert('Product name is required.');return Promise.reject('no_product_name');}
    if(!amountCents||amountCents<100){alert('Amount must be at least $1.00');return Promise.reject('invalid_amount');}
    if(!email){alert('Please enter your email address.');return Promise.reject('no_email');}
    var successBase=window.location.href.split('?')[0];
    return fetch(apiBase+'/api/landing-pages/public/'+slug+'/payment/checkout',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({email:email,name:customerName,amountCents:amountCents,productName:productName,productDescription:productDescription,quantity:quantity,successUrl:successBase+'?payment=success&product='+encodeURIComponent(productName)+'&session_id={CHECKOUT_SESSION_ID}',cancelUrl:successBase+'?payment=cancelled'})
    }).then(function(r){return r.json();}).then(function(d){
      if(d.checkoutUrl){window.location.href=d.checkoutUrl;}
      else{alert(d.error||'Failed to process payment');throw new Error(d.error);}
    });
  };
  document.addEventListener('DOMContentLoaded',function(){
    var urlParams=new URLSearchParams(window.location.search);
    if(urlParams.get('payment')==='success'){
      var pName=urlParams.get('product')||'your item';
      var overlay=document.createElement('div');overlay.id='payment-success-overlay';
      overlay.style.cssText='position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:999999;font-family:system-ui,-apple-system,sans-serif;';
      overlay.innerHTML='<div style="background:white;border-radius:16px;padding:40px;max-width:420px;width:90%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.15);"><div style="width:64px;height:64px;border-radius:50%;background:#dcfce7;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div><h2 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#111827;">Payment Successful!</h2><p style="margin:0 0 24px;color:#6b7280;font-size:16px;">Thank you for purchasing '+pName.replace(/</g,'&lt;').replace(/>/g,'&gt;')+'.</p><button onclick="document.getElementById(\'payment-success-overlay\').remove();window.history.replaceState({},\'\',window.location.pathname);" style="padding:12px 32px;font-size:16px;font-weight:600;background:#16a34a;color:white;border:none;border-radius:8px;cursor:pointer;">Continue</button></div>';
      document.body.appendChild(overlay);
    }
  });
})();

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