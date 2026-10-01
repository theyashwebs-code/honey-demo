/* MADHURAVANA Pure Honey — shared frontend application.
   Shared stock is synced through Supabase REST. LocalStorage remains the offline/cache layer.
   IMPORTANT: never put a Supabase service_role key in this file. Use the public anon key only. */

const BUSINESS_CONFIG = {
  brandName: "MADHURAVANA Pure Honey",
  whatsappNumber: "917092722605", // Replace with business WhatsApp number, digits only, country code included.
  instagramUrl: "https://instagram.com/xxxxx", // Replace with real Instagram URL.
  phone: "7092722605",
  email: "yashwantchatti@gmail.com",
  address: "Hyderabad, Telangana"
};

const CLOUD_CONFIG = {
  // Create a Supabase project, then paste these two public values here.
  // SUPABASE_ANON_KEY is safe to expose only when Row Level Security is configured correctly.
  url: "YOUR_SUPABASE_PROJECT_URL",
  anonKey: "YOUR_SUPABASE_ANON_KEY",
  table: "madhuravana_products",
  refreshMs: 5000
};

const DEFAULT_PRODUCTS = [
  {id:"MH001",name:"MADHURAVANA Pure Honey",weight:"250g",price:299,description:"A beautiful everyday jar of naturally golden honey, ideal for morning rituals, tea and recipes.",inStock:true,amazonUrl:""},
  {id:"MH002",name:"MADHURAVANA Pure Honey",weight:"500g",price:499,description:"Our balanced everyday size for homes that love keeping a little more golden goodness close.",inStock:true,amazonUrl:""},
  {id:"MH003",name:"MADHURAVANA Pure Honey",weight:"1kg",price:899,description:"A generous family jar made for regular use, gifting and those who simply love honey.",inStock:true,amazonUrl:""}
];

const KEYS = {
  cart:"madhuravana_cart", products:"madhuravana_products", online:"madhuravana_online_orders",
  offline:"madhuravana_offline_orders", session:"madhuravana_admin_session", lastOrder:"madhuravana_last_order",
  settings:"madhuravana_settings", counter:"madhuravana_order_counter"
};

function safeParse(key,fallback){try{const raw=localStorage.getItem(key);return raw===null?fallback:JSON.parse(raw)}catch(e){console.warn("localStorage read failed",key,e);return fallback}}
function safeSave(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch(e){showToast("Browser storage is unavailable. Please check storage permissions.","warn");return false}}
function cloudConfigured(){return /^https:\/\/[^\s]+$/.test(CLOUD_CONFIG.url) && !CLOUD_CONFIG.url.includes("YOUR_") && !!CLOUD_CONFIG.anonKey && !CLOUD_CONFIG.anonKey.includes("YOUR_")}
function cloudHeaders(extra={}){return {apikey:CLOUD_CONFIG.anonKey,Authorization:`Bearer ${CLOUD_CONFIG.anonKey}`,Accept:"application/json",...extra}}
function getProducts(){const p=safeParse(KEYS.products,null);if(!Array.isArray(p)){safeSave(KEYS.products,DEFAULT_PRODUCTS);return structuredClone(DEFAULT_PRODUCTS)}return p}
function saveProducts(v){return safeSave(KEYS.products,v)}
async function loadSharedProducts(options={}){
  if(!cloudConfigured()) return getProducts();
  try{
    const r=await fetch(`${CLOUD_CONFIG.url}/rest/v1/${CLOUD_CONFIG.table}?select=id,name,weight,price,description,in_stock,amazon_url&order=id`,{headers:cloudHeaders()});
    if(!r.ok) throw new Error(`Cloud stock request failed (${r.status})`);
    const rows=await r.json();
    if(!Array.isArray(rows) || !rows.length) return getProducts();
    const products=rows.map(x=>({id:x.id,name:x.name,weight:x.weight,price:Number(x.price),description:x.description||"",inStock:x.in_stock!==false,amazonUrl:x.amazon_url||""}));
    const before=JSON.stringify(getProducts().map(p=>({id:p.id,inStock:!!p.inStock,price:p.price,name:p.name,weight:p.weight})));
    const after=JSON.stringify(products.map(p=>({id:p.id,inStock:!!p.inStock,price:p.price,name:p.name,weight:p.weight})));
    saveProducts(products);
    if(options.render!==false && before!==after) refreshCurrentProductPage();
    return products;
  }catch(err){console.warn("Shared stock sync failed:",err);return getProducts()}
}
async function setSharedProductStock(id,inStock){
  const products=getProducts();
  const local=products.find(p=>p.id===id);
  if(local){local.inStock=inStock;saveProducts(products)}
  if(!cloudConfigured()){showToast("Cloud stock is not configured yet.","warn");return false}
  try{
    const r=await fetch(`${CLOUD_CONFIG.url}/rest/v1/${CLOUD_CONFIG.table}?id=eq.${encodeURIComponent(id)}`,{method:"PATCH",headers:cloudHeaders({"Content-Type":"application/json","Prefer":"return=representation"}),body:JSON.stringify({in_stock:inStock,updated_at:new Date().toISOString()})});
    if(!r.ok) throw new Error(`Cloud stock update failed (${r.status})`);
    return true;
  }catch(err){console.error(err);showToast("Could not update shared stock. Check Supabase setup.","warn");await loadSharedProducts({render:false});return false}
}
function refreshCurrentProductPage(){
  const current=page();
  if(current==="home") { renderHome(); return; }
  if(current==="shop") { renderShop(); return; }
  if(current==="product") { renderProduct(); return; }
  if(current==="cart") { renderCart(); updateCartCount(); return; }
  if(current==="checkout") { renderCheckout(); }
}
function startSharedStockSync(){
  if(!cloudConfigured()) return;
  loadSharedProducts({render:true});
  setInterval(()=>loadSharedProducts({render:true}),CLOUD_CONFIG.refreshMs);
  window.addEventListener("focus",()=>loadSharedProducts({render:true}));
}

function getCart(){return safeParse(KEYS.cart,[])}
function saveCart(v){return safeSave(KEYS.cart,v)}
function getOnlineOrders(){return safeParse(KEYS.online,[])}
function saveOnlineOrders(v){return safeSave(KEYS.online,v)}
function getOfflineOrders(){return safeParse(KEYS.offline,[])}
function saveOfflineOrders(v){return safeSave(KEYS.offline,v)}
function getSettings(){return {...BUSINESS_CONFIG,...safeParse(KEYS.settings,{})}}
function saveSettings(v){return safeSave(KEYS.settings,v)}
function money(n){return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function page(){return document.body.dataset.page||""}

function showToast(message,type=""){const root=document.getElementById("toast-root");if(!root)return;const el=document.createElement("div");el.className=`toast ${type}`;el.textContent=message;root.appendChild(el);setTimeout(()=>el.remove(),3200)}
function miniJar(){return `<div class="mini-jar" aria-hidden="true"><div class="mini-lid"></div><div class="mini-body"></div><div class="mini-label"><small>MADHURAVANA</small>PURE<br>HONEY</div></div>`}

function renderHeader(){
  const root=document.getElementById("site-header"); if(!root)return;
  root.innerHTML=`<header class="site-header"><div class="container nav">
    <a class="brand" href="index.html">MADHURAVANA<small>Pure Honey</small></a>
    <button class="menu-btn" id="menu-btn" aria-label="Open menu" aria-expanded="false">☰</button>
    <nav class="nav-links" id="nav-links" aria-label="Primary navigation">
      <a href="index.html">Home</a><a href="shop.html">Shop</a><a href="index.html#about">About</a><a href="index.html#contact">Contact</a>
      <a data-instagram href="#" target="_blank" rel="noopener">Instagram</a><a data-whatsapp href="#">WhatsApp</a>
      <a class="cart-link" href="cart.html">Cart <span class="cart-count" id="cart-count">0</span></a>
    </nav>
  </div></header>`;
  const btn=document.getElementById("menu-btn"), nav=document.getElementById("nav-links");
  btn?.addEventListener("click",()=>{const open=nav.classList.toggle("open");btn.setAttribute("aria-expanded",String(open));});
  document.querySelectorAll("[data-instagram]").forEach(a=>a.href=getSettings().instagramUrl);
  document.querySelectorAll("[data-whatsapp]").forEach(a=>a.href=whatsappUrl("Hello MADHURAVANA, I have a question about your honey products."));
  updateCartCount();
}
function renderFooter(){
  const root=document.getElementById("site-footer");if(!root)return;
  root.innerHTML=`<footer class="site-footer"><div class="container footer-grid">
    <div><div class="footer-brand">MADHURAVANA<small>PURE HONEY</small></div><p style="margin-top:15px">Natural sweetness, thoughtfully presented. Premium honey for everyday rituals and special moments.</p></div>
    <div class="footer-col"><h4>Explore</h4><a href="index.html">Home</a><a href="shop.html">Shop</a><a href="index.html#about">About</a><a href="index.html#contact">Contact</a></div>
    <div class="footer-col"><h4>Connect</h4><a data-instagram target="_blank" rel="noopener">Instagram ↗</a><a data-whatsapp>WhatsApp ↗</a><p>${esc(getSettings().email)}</p><p>${esc(getSettings().phone)}</p></div>
  </div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} MADHURAVANA Pure Honey</span><span>Made with natural warmth.</span></div></footer>`;
  document.querySelectorAll("[data-instagram]").forEach(a=>a.href=getSettings().instagramUrl);
  document.querySelectorAll("[data-whatsapp]").forEach(a=>a.href=whatsappUrl("Hello MADHURAVANA, I have a question about your honey products."));
}
function whatsappUrl(message){const n=getSettings().whatsappNumber.replace(/\D/g,"");return n&&n.length>=8?`https://wa.me/${n}?text=${encodeURIComponent(message)}`:"#"}
function updateCartCount(){const el=document.getElementById("cart-count");if(el)el.textContent=getCart().reduce((a,i)=>a+i.quantity,0)}

function productCard(p){
  const out=!p.inStock;
  return `<article class="product-card reveal visible">
    <a href="product.html?id=${encodeURIComponent(p.id)}" class="product-visual" aria-label="View ${esc(p.name)} ${esc(p.weight)}">${miniJar()}</a>
    <div class="product-content"><div class="product-meta"><span class="eyebrow">${esc(p.weight)}</span><span class="stock-badge ${out?"out":""}">${out?"Out of Stock":"In Stock"}</span></div>
    <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${esc(p.name)}</a></h3><p>${esc(p.description)}</p>
    <div class="product-meta"><span class="price">${money(p.price)}</span></div>
    <div class="product-actions"><a class="btn btn-ghost" href="product.html?id=${encodeURIComponent(p.id)}">View</a><button class="btn ${out?"btn-ghost":"btn-primary"} add-btn" data-add="${esc(p.id)}" ${out?"disabled":""}>${out?"Unavailable":"Add to Cart"}</button></div></div></article>`;
}
function renderProductGrid(target,products){const el=document.getElementById(target);if(!el)return;el.innerHTML=products.map(productCard).join("")||`<div class="empty-state"><h2>No products found.</h2><p>Please check the product configuration.</p></div>`}
function attachAddButtons(){document.querySelectorAll("[data-add]").forEach(btn=>btn.addEventListener("click",()=>addToCart(btn.dataset.add,1)))}
function addToCart(id, quantity = 1) {
  const p = getProducts().find(x => x.id === id);

  if (!p) {
    showToast("Product not found.", "warn");
    return;
  }

  if (!p.inStock) {
    showToast("This product is currently out of stock.", "warn");
    return;
  }

  const cart = getCart();
  const item = cart.find(x => x.id === id);

  if (item) {
    item.quantity += quantity;
  } else {
    cart.push({
      id: id,
      quantity: quantity
    });
  }

  saveCart(cart);
  updateCartCount();

  showToast(
    `✓ ${p.name} ${p.weight} added to cart`,
    ""
  );
}
function changeCart(id,delta){const cart=getCart();const item=cart.find(x=>x.id===id);if(!item)return;item.quantity+=delta;if(item.quantity<=0){saveCart(cart.filter(x=>x.id!==id));showToast("✓ Product removed")}else saveCart(cart);renderCart();updateCartCount()}
function removeCart(id){saveCart(getCart().filter(x=>x.id!==id));renderCart();updateCartCount();showToast("✓ Product removed")}
function cartDetailed(){const products=getProducts();return getCart().map(i=>{const p=products.find(x=>x.id===i.id);return p?{...p,quantity:i.quantity}:null}).filter(Boolean)}
function cartTotal(){return cartDetailed().reduce((s,i)=>s+i.price*i.quantity,0)}

function renderCart(){
  const box=document.getElementById("cart-items"),summary=document.getElementById("cart-summary");if(!box||!summary)return;
  const items=cartDetailed();
  if(!items.length){box.innerHTML=`<div class="empty-state"><h2>Your cart is waiting.</h2><p>Choose a jar of MADHURAVANA Pure Honey and it will appear here.</p><a class="btn btn-primary" href="shop.html">Shop Honey</a></div>`;summary.innerHTML="";return}
  box.innerHTML=items.map(i=>`<div class="cart-item"><div class="cart-thumb">${miniJar()}</div><div><h3>${esc(i.name)}</h3><div class="muted">${esc(i.weight)} · ${money(i.price)}</div><div class="cart-controls"><button class="circle-btn" data-minus="${i.id}" aria-label="Decrease quantity">−</button><strong>${i.quantity}</strong><button class="circle-btn" data-plus="${i.id}" aria-label="Increase quantity">+</button><button class="remove-btn" data-remove="${i.id}">Remove</button></div></div><div class="price">${money(i.price*i.quantity)}</div></div>`).join("");
  const total=cartTotal();
  summary.innerHTML=`<h3>Order summary</h3>${items.map(i=>`<div class="summary-row"><span>${esc(i.weight)} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong></div>`).join("")}<div class="summary-total"><span>Total</span><span>${money(total)}</span></div><p class="form-note" style="margin-top:18px">Cash on Delivery · WhatsApp order preparation</p><a class="btn btn-primary btn-block" href="checkout.html">Proceed to Checkout</a><button class="btn btn-ghost btn-block" id="empty-cart" style="margin-top:8px">Empty Cart</button>`;
  box.querySelectorAll("[data-minus]").forEach(b=>b.onclick=()=>changeCart(b.dataset.minus,-1));box.querySelectorAll("[data-plus]").forEach(b=>b.onclick=()=>changeCart(b.dataset.plus,1));box.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>removeCart(b.dataset.remove));document.getElementById("empty-cart").onclick=()=>{if(confirm("Empty your entire cart?")){saveCart([]);renderCart();updateCartCount();}};
}

function renderCheckout(){
  const summary=document.getElementById("checkout-summary");if(!summary)return;
  const items=cartDetailed();if(!items.length){summary.innerHTML=`<div class="empty-state"><h2>Cart is empty.</h2><a class="btn btn-primary" href="shop.html">Shop Honey</a></div>`;document.getElementById("checkout-form").style.display="none";return}
  summary.innerHTML=`<h3>Order summary</h3>${items.map(i=>`<div class="summary-row"><span>${esc(i.name)} · ${esc(i.weight)} × ${i.quantity}</span><strong>${money(i.price*i.quantity)}</strong></div>`).join("")}<div class="summary-total"><span>Total</span><span>${money(cartTotal())}</span></div>`;
  document.getElementById("checkout-form").addEventListener("submit",submitCheckout);
}
function submitCheckout(e){
  e.preventDefault();const f=e.currentTarget;const data=Object.fromEntries(new FormData(f).entries());
  if(!data.name.trim())return showToast("Please enter your full name.","warn");
  if(!/^[0-9]{10}$/.test(data.phone.replace(/\D/g,"")))return showToast("Please enter a valid 10-digit mobile number.","warn");
  if(!data.address.trim()||!data.city.trim()||!data.state.trim())return showToast("Please complete the delivery address.","warn");
  if(!/^[0-9]{6}$/.test(data.pincode.trim()))return showToast("Please enter a valid 6-digit pincode.","warn");
  const items=cartDetailed();if(!items.length)return showToast("Your cart is empty.","warn");
  const products=getProducts();for(const i of items){const live=products.find(p=>p.id===i.id);if(!live?.inStock)return showToast(`${i.name} (${i.weight}) is currently out of stock.`,"warn")}
  const id=generateOnlineId();const now=new Date();const order={id,customerName:data.name.trim(),phone:data.phone.replace(/\D/g,""),products:items.map(i=>({id:i.id,name:i.name,weight:i.weight,quantity:i.quantity,price:i.price})),total:cartTotal(),paymentMethod:"Cash on Delivery",address:{street:data.address.trim(),city:data.city.trim(),state:data.state.trim(),pincode:data.pincode.trim()},orderType:"ONLINE",orderDate:now.toLocaleDateString("en-IN"),orderTime:now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),status:"Order Placed",createdAt:now.toISOString()};
  // Customer checkout does NOT create an admin order automatically.
  // The customer prepares the WhatsApp message and the business owner manually
  // enters the order into Admin > Online Orders after receiving it.
  const message=buildWhatsAppMessage(order);
  const url=whatsappUrl(message);
  if(url==="#"){
    showToast("Add the business WhatsApp number in BUSINESS_CONFIG first.","warn");
    return;
  }

  safeSave(KEYS.lastOrder,{...order,whatsappUrl:url});
  saveCart([]);
  updateCartCount();
  window.location.href=`order-success.html?order=${encodeURIComponent(order.id)}`;
}
function generateOnlineId(){const d=new Date();const date=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;const n=(safeParse(KEYS.counter,0)||0)+1;safeSave(KEYS.counter,n);return `MH${date}${String(n).padStart(3,"0")}`}
function generateOfflineId(){const n=(safeParse("madhuravana_offline_counter",1000)||1000)+1;safeSave("madhuravana_offline_counter",n);return `OFF-MH-${n}`}
function buildWhatsAppMessage(o){return `NEW MADHURAVANA HONEY ORDER\n\nOrder ID: ${o.id}\n\nCUSTOMER DETAILS\n\nName: ${o.customerName}\nPhone: ${o.phone}\n\nORDER DETAILS\n\n${o.products.map(p=>`${p.name} - ${p.weight}\nQuantity: ${p.quantity}\nPrice: ${money(p.price*p.quantity)}`).join("\n\n")}\n\nTOTAL: ${money(o.total)}\n\nPAYMENT METHOD:\nCash on Delivery\n\nDELIVERY ADDRESS:\n${o.address.street}\n${o.address.city}\n${o.address.state}\n${o.address.pincode}`}

function renderProduct(){
  const root=document.getElementById("product-detail");if(!root)return;
  const id=new URLSearchParams(location.search).get("id");const p=getProducts().find(x=>x.id===id);
  if(!p){root.innerHTML=`<div class="empty-state"><h2>Product not found.</h2><a class="btn btn-primary" href="shop.html">Back to Shop</a></div>`;return}
  root.innerHTML=`<div class="product-detail"><div class="detail-visual">${miniJar()}</div><div class="detail-copy"><span class="eyebrow">${esc(p.weight)}</span><h1>${esc(p.name)}</h1><div class="price">${money(p.price)}</div><p class="description">${esc(p.description)}</p><div class="availability ${p.inStock?"ok":"no"}">${p.inStock?"✓ In Stock":"× Currently Out of Stock"}</div>${p.inStock?`<div class="qty-control"><button id="qty-minus" aria-label="Decrease quantity">−</button><span id="qty">1</span><button id="qty-plus" aria-label="Increase quantity">+</button></div><div class="product-actions"><button class="btn btn-primary" id="detail-add">Add to Cart</button><a class="btn btn-ghost" href="${whatsappUrl(`Hello MADHURAVANA, I would like to order ${p.name} - ${p.weight}.`)}" target="_blank" rel="noopener">Order via WhatsApp ↗</a></div>`:`<p class="form-note">Currently unavailable. Please check back after stock is updated.</p>`}${p.amazonUrl?`<a class="text-link" style="display:inline-block;margin-top:20px" href="${esc(p.amazonUrl)}" target="_blank" rel="noopener">Buy on Amazon ↗</a>`:""}</div></div>`;
  if(p.inStock){let q=1;document.getElementById("qty-minus").onclick=()=>{q=Math.max(1,q-1);document.getElementById("qty").textContent=q};document.getElementById("qty-plus").onclick=()=>{q=Math.min(20,q+1);document.getElementById("qty").textContent=q};document.getElementById("detail-add").onclick=()=>addToCart(p.id,q)}
}

function renderHome(){const target=document.getElementById("featured-products");if(target){renderProductGrid("featured-products",getProducts());attachAddButtons()}}
function renderShop(){const all=getProducts();const sort=document.getElementById("shop-sort");const paint=()=>{let p=[...all];if(sort.value==="low")p.sort((a,b)=>a.price-b.price);if(sort.value==="high")p.sort((a,b)=>b.price-a.price);renderProductGrid("shop-products",p);attachAddButtons();document.getElementById("shop-count").textContent=`${p.length} product${p.length!==1?"s":""}`};sort?.addEventListener("change",paint);paint()}

function renderSuccess(){
  const data=safeParse(KEYS.lastOrder,null);const params=new URLSearchParams(location.search);const id=params.get("order");const o=data&&data.id===id?data:data;
  if(!o)return;
  document.getElementById("success-order-card").innerHTML=`<strong>${esc(o.id)}</strong><div class="summary-row"><span>Customer</span><span>${esc(o.customerName)}</span></div><div class="summary-row"><span>Items</span><span>${o.products.reduce((s,p)=>s+p.quantity,0)}</span></div><div class="summary-total"><span>Total</span><span>${money(o.total)}</span></div>`;
  const a=document.getElementById("success-whatsapp");a.href=o.whatsappUrl||whatsappUrl(buildWhatsAppMessage(o));
}

function revealSetup(){const els=document.querySelectorAll(".reveal");if(!("IntersectionObserver" in window)){els.forEach(e=>e.classList.add("visible"));return}const io=new IntersectionObserver(entries=>entries.forEach(x=>x.isIntersecting&&x.target.classList.add("visible")),{threshold:.08});els.forEach(e=>io.observe(e))}
function keyboardAdmin(){document.addEventListener("keydown",e=>{if(e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==="a"){e.preventDefault();window.dispatchEvent(new CustomEvent("open-admin-login"))}})}

document.addEventListener("DOMContentLoaded",()=>{
  getProducts();renderHeader();renderFooter();keyboardAdmin();revealSetup();
  if(page()==="home")renderHome();
  if(page()==="shop")renderShop();
  if(page()==="product")renderProduct();
  if(page()==="cart")renderCart();
  if(page()==="checkout")renderCheckout();
  if(page()==="success")renderSuccess();
  startSharedStockSync();
});
window.MADHURAVANA={BUSINESS_CONFIG,CLOUD_CONFIG,DEFAULT_PRODUCTS,KEYS,getProducts,saveProducts,loadSharedProducts,setSharedProductStock,getCart,saveCart,getOnlineOrders,saveOnlineOrders,getOfflineOrders,saveOfflineOrders,getSettings,saveSettings,money,showToast,whatsappUrl,buildWhatsAppMessage,updateCartCount};
