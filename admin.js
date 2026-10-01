/* Hidden admin area for the frontend-only MVP.
   IMPORTANT: this is not secure authentication. Credentials and data live in browser JavaScript/localStorage.
   Real authentication, shared orders, backups and multi-device operation require a backend such as Spring Boot + MySQL + cloud storage. */

const ADMIN_CONFIG = { username:"admin", password:"ChangeThisPassword" }; // CHANGE THESE BEFORE CLIENT DELIVERY.
const ADMIN_STATUSES = ["Order Placed","Processing","Shipped","Out for Delivery","Delivered","Cancelled"];
const ADMIN_FRESH_START_KEY = "madhuravana_admin_fresh_start_v2";

function initializeFreshAdmin(){
  if(!localStorage.getItem(ADMIN_FRESH_START_KEY)){
    saveOnlineOrders([]);
    saveOfflineOrders([]);
    localStorage.setItem(ADMIN_FRESH_START_KEY,"1");
  }
}

function adminOpenLogin(){
  const root=document.getElementById("modal-root");if(!root)return;
  root.innerHTML=`<div class="modal-backdrop" id="admin-login-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="admin-title">
    <div class="modal-head"><div><span class="eyebrow">Private area</span><h2 id="admin-title">Admin Login</h2><p>This frontend-only login is not secure authentication.</p></div><button class="close-modal" id="close-admin">×</button></div>
    <form id="admin-login-form"><label>Admin ID<input name="username" autocomplete="username" required></label><label>Password<input name="password" type="password" autocomplete="current-password" required></label><button class="btn btn-primary" type="submit">Login</button></form>
  </div></div>`;
  document.getElementById("close-admin").onclick=closeModal;
  document.getElementById("admin-login-backdrop").addEventListener("click",e=>{if(e.target.id==="admin-login-backdrop")closeModal()});
  document.getElementById("admin-login-form").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));if(d.username===ADMIN_CONFIG.username&&d.password===ADMIN_CONFIG.password){safeSave(KEYS.session,{loggedIn:true,at:Date.now()});closeModal();location.hash="admin";renderAdmin()}else showToast("Invalid admin ID or password.","warn")};
}
function closeModal(){const r=document.getElementById("modal-root");if(r)r.innerHTML=""}
function isAdmin(){return !!safeParse(KEYS.session,null)?.loggedIn}
function adminLogout(){localStorage.removeItem(KEYS.session);location.hash="";location.reload()}
function renderAdmin(){
  if(!isAdmin()){adminOpenLogin();return}
  const body=document.body;body.innerHTML=`<div class="admin-shell"><aside class="admin-sidebar"><div class="admin-logo">MADHURAVANA<small>BUSINESS ADMIN</small></div><nav class="admin-nav" id="admin-nav">
    ${["dashboard","online","offline","products","customers","settings"].map((x,i)=>`<button data-admin-view="${x}" class="${i===0?"active":""}">${x==="dashboard"?"Dashboard":x==="online"?"Online Orders":x==="offline"?"Offline Orders":x==="products"?"Products / Stock":x==="customers"?"Customers":"Settings"}</button>`).join("")}
    <button id="admin-logout" style="margin-top:18px;color:#e5a398">Log out</button></nav></aside><main class="admin-main"><div class="admin-top"><div><span class="eyebrow">Madhuravana business console</span><h1 id="admin-title-main">Dashboard</h1></div><a class="mini-btn" href="index.html">View Website ↗</a></div><div id="admin-content"></div></main></div>`;
  document.getElementById("admin-logout").onclick=adminLogout;
  document.querySelectorAll("[data-admin-view]").forEach(b=>b.onclick=()=>{document.querySelectorAll("[data-admin-view]").forEach(x=>x.classList.remove("active"));b.classList.add("active");renderAdminView(b.dataset.adminView)});
  renderAdminView("dashboard");
}
function adminOrders(){return [...getOnlineOrders(),...getOfflineOrders()]}
function statCards(){const o=adminOrders();const count=s=>o.filter(x=>x.status===s).length;return `<div class="admin-grid">${[
  ["Total Orders",o.length],["Online Orders",getOnlineOrders().length],["Offline Orders",getOfflineOrders().length],["Order Placed",count("Order Placed")],["Processing",count("Processing")],["Shipped",count("Shipped")],["Out for Delivery",count("Out for Delivery")],["Delivered",count("Delivered")],["Cancelled",count("Cancelled")],["Total COD Value",money(o.reduce((s,x)=>s+Number(x.total||0),0))]
].map(([a,b])=>`<div class="stat-card"><span>${a}</span><strong>${b}</strong></div>`).join("")}</div>`}
function renderAdminView(view){
  const content=document.getElementById("admin-content"),title=document.getElementById("admin-title-main");if(!content)return;
  const titles={dashboard:"Dashboard",online:"Online Orders",offline:"Offline Orders",products:"Products / Stock",customers:"Customers",settings:"Settings"};title.textContent=titles[view];
  if(view==="dashboard"){content.innerHTML=statCards()+`<div class="admin-section"><h2>Recent orders</h2>${orderTable(adminOrders().slice(0,8))}</div>`;return}
  if(view==="online"){
    content.innerHTML=ordersView("ONLINE",getOnlineOrders());
    bindOrderTable();
    bindManualOrderForm();
    return;
  }
  if(view==="offline"){
    content.innerHTML=ordersView("OFFLINE",getOfflineOrders());
    bindOrderTable();
    bindManualOrderForm();
    return;
  }
  if(view==="products"){
    content.innerHTML=productsView();
    bindProducts();
    return;
  }
  if(view==="customers"){content.innerHTML=customersView();return}
  if(view==="settings"){content.innerHTML=settingsView();bindSettings();return}
}
function ordersView(type,orders){
  return `<div class="admin-section">
    <div class="admin-section-head" style="display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap">
      <div><h2 style="margin-bottom:4px">${type==="ONLINE"?"Online Orders":"Offline Orders"}</h2><p class="admin-note" style="margin:0">Orders are entered manually by the business owner.</p></div>
    </div>

    <form class="admin-form" id="manual-order-form" style="margin:20px 0;padding:18px;border:1px solid #e5e0d8;border-radius:14px;background:#faf8f4">
      <label>Customer Name<input name="customerName" required></label>
      <label>Phone<input name="phone" inputmode="numeric" maxlength="10" required></label>
      <label class="full">Street Address<input name="street" required></label>
      <label>City<input name="city" required></label>
      <label>State<input name="state" required></label>
      <label>Pincode<input name="pincode" inputmode="numeric" maxlength="6" required></label>

      <div class="full">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px">
          <strong style="font-size:.8rem">Products</strong>
          <button type="button" class="mini-btn" id="add-manual-product">+ Add Product</button>
        </div>
        <div id="manual-product-list">${manualProductRow()}</div>
      </div>

      <div class="full" style="display:flex;justify-content:space-between;align-items:center;gap:15px">
        <strong>Total: <span id="manual-order-total">${money(0)}</span></strong>
        <button class="btn btn-primary" type="submit">Save ${type==="ONLINE"?"Online":"Offline"} Order</button>
      </div>
    </form>

    <div class="admin-toolbar">
      <input id="order-search" placeholder="Search order ID, name or phone">
      <select id="order-filter"><option>All</option>${ADMIN_STATUSES.map(s=>`<option>${s}</option>`).join("")}</select>
    </div>
    <div id="orders-table">${orderTable(orders)}</div>
  </div>`;
}

function manualProductRow(){
  const products=getProducts();
  return `<div class="manual-product-row" style="display:grid;grid-template-columns:1fr 110px auto;gap:8px;margin-bottom:8px">
    <select class="manual-product" name="productId" required>
      ${products.map(p=>`<option value="${esc(p.id)}" ${p.inStock?"":"disabled"}>${esc(p.weight)} · ${money(p.price)}${p.inStock?"":" · OUT OF STOCK"}</option>`).join("")}
    </select>
    <input class="manual-quantity" type="number" min="1" max="99" value="1" required>
    <button type="button" class="mini-btn danger remove-manual-product" aria-label="Remove product">×</button>
  </div>`;
}

function bindManualOrderForm(){
  const form=document.getElementById("manual-order-form");
  if(!form)return;

  const list=document.getElementById("manual-product-list");
  const totalEl=document.getElementById("manual-order-total");

  const updateTotal=()=>{
    let total=0;
    list.querySelectorAll(".manual-product-row").forEach(row=>{
      const p=getProducts().find(x=>x.id===row.querySelector(".manual-product")?.value);
      const q=Math.max(1,Number(row.querySelector(".manual-quantity")?.value||1));
      if(p)total+=p.price*q;
    });
    totalEl.textContent=money(total);
  };

  document.getElementById("add-manual-product")?.addEventListener("click",()=>{
    const wrap=document.createElement("div");
    wrap.innerHTML=manualProductRow();
    list.appendChild(wrap.firstElementChild);
    bindManualRows();
    updateTotal();
  });

  const bindManualRows=()=>{
    list.querySelectorAll(".manual-product,.manual-quantity").forEach(el=>{
      el.onchange=updateTotal;
      el.oninput=updateTotal;
    });
    list.querySelectorAll(".remove-manual-product").forEach(btn=>{
      btn.onclick=()=>{
        const rows=list.querySelectorAll(".manual-product-row");
        if(rows.length===1){showToast("At least one product is required.","warn");return}
        btn.closest(".manual-product-row").remove();
        updateTotal();
      };
    });
  };

  bindManualRows();
  updateTotal();

  form.onsubmit=e=>{
    e.preventDefault();
    const d=Object.fromEntries(new FormData(form));

    const phone=d.phone.replace(/\D/g,"");
    const pincode=d.pincode.trim();

    if(!/^[0-9]{10}$/.test(phone))return showToast("Enter a valid 10-digit phone number.","warn");
    if(!/^[0-9]{6}$/.test(pincode))return showToast("Enter a valid 6-digit pincode.","warn");

    const products=[];
    let total=0;

    list.querySelectorAll(".manual-product-row").forEach(row=>{
      const product=getProducts().find(x=>x.id===row.querySelector(".manual-product")?.value);
      const quantity=Math.max(1,Number(row.querySelector(".manual-quantity")?.value||1));
      if(product){
        products.push({
          id:product.id,
          name:product.name,
          weight:product.weight,
          quantity,
          price:product.price
        });
        total+=product.price*quantity;
      }
    });

    if(!products.length)return showToast("Add at least one product.","warn");

    const now=new Date();
    const type=document.getElementById("admin-title-main").textContent==="Online Orders"?"ONLINE":"OFFLINE";
    const order={
      id:type==="ONLINE"?generateOnlineId():generateOfflineId(),
      customerName:d.customerName.trim(),
      phone,
      products,
      total,
      paymentMethod:"Cash on Delivery",
      address:{
        street:d.street.trim(),
        city:d.city.trim(),
        state:d.state.trim(),
        pincode
      },
      orderType:type,
      orderDate:now.toLocaleDateString("en-IN"),
      orderTime:now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"}),
      status:"Order Placed",
      createdAt:now.toISOString()
    };

    if(type==="ONLINE"){
      const orders=getOnlineOrders();
      orders.unshift(order);
      saveOnlineOrders(orders);
    }else{
      const orders=getOfflineOrders();
      orders.unshift(order);
      saveOfflineOrders(orders);
    }

    showToast(`✓ ${type==="ONLINE"?"Online":"Offline"} order added`);
    renderAdminView(type==="ONLINE"?"online":"offline");
  };
}
function statusClass(s){return s.toLowerCase().replaceAll(" ","-")}
function orderTable(orders){if(!orders.length)return `<div class="empty-state"><h2>No orders yet.</h2><p>Orders created through the website will appear here.</p></div>`;return `<table class="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Type</th><th>Total</th><th>Status</th><th>Date</th><th></th></tr></thead><tbody>${orders.map(o=>`<tr><td><strong>${esc(o.id)}</strong></td><td>${esc(o.customerName)}<br><span class="muted">${esc(o.phone)}</span></td><td>${esc(o.orderType)}</td><td>${money(o.total)}</td><td><span class="admin-badge ${statusClass(o.status)}">${esc(o.status)}</span></td><td>${esc(o.orderDate)}</td><td><button class="mini-btn" data-order-view="${esc(o.id)}">Details</button></td></tr>`).join("")}</tbody></table>`}
function bindOrderTable(){
  document.querySelectorAll("[data-order-view]").forEach(b=>b.onclick=()=>showOrderModal(b.dataset.orderView));
  document.getElementById("order-search")?.addEventListener("input",filterOrders);document.getElementById("order-filter")?.addEventListener("change",filterOrders);
}
function filterOrders(){
  const q=(document.getElementById("order-search")?.value||"").toLowerCase(),f=document.getElementById("order-filter")?.value||"All";
  const type=document.getElementById("admin-title-main").textContent==="Online Orders"?"ONLINE":"OFFLINE";
  let orders=type==="ONLINE"?getOnlineOrders():getOfflineOrders();orders=orders.filter(o=>(f==="All"||o.status===f)&&(!q||`${o.id} ${o.customerName} ${o.phone}`.toLowerCase().includes(q)));document.getElementById("orders-table").innerHTML=orderTable(orders);bindOrderTable();
}
function showOrderModal(id){
  const o=adminOrders().find(x=>x.id===id);if(!o)return;const root=document.getElementById("modal-root")||document.body;let modal=document.createElement("div");modal.id="admin-order-modal";modal.className="modal-backdrop";modal.innerHTML=`<div class="modal" style="width:min(620px,100%)"><div class="modal-head"><div><span class="eyebrow">${esc(o.orderType)} ORDER</span><h2>${esc(o.id)}</h2></div><button class="close-modal" id="order-close">×</button></div>
  <div class="summary-row"><span>Customer</span><strong>${esc(o.customerName)}</strong></div><div class="summary-row"><span>Phone</span><span>${esc(o.phone)}</span></div><div class="summary-row"><span>Products</span><span>${o.products.map(p=>`${esc(p.name)} ${esc(p.weight)} × ${p.quantity}`).join("<br>")}</span></div><div class="summary-row"><span>Total</span><strong>${money(o.total)}</strong></div><div class="summary-row"><span>Payment</span><span>${esc(o.paymentMethod)}</span></div><div class="summary-row"><span>Address</span><span>${esc(o.address.street)}, ${esc(o.address.city)}, ${esc(o.address.state)} - ${esc(o.address.pincode)}</span></div><div class="summary-row"><span>Date / Time</span><span>${esc(o.orderDate)} · ${esc(o.orderTime)}</span></div>
  <label style="display:block;margin-top:18px;font-size:.78rem;font-weight:800">Update Status<select id="modal-status" style="display:block;width:100%;margin-top:6px;padding:12px;border:1px solid var(--line);border-radius:10px">${ADMIN_STATUSES.map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}</select></label><div class="product-actions"><button class="btn btn-primary" id="modal-save-status">Update Status</button><button class="btn btn-ghost" id="modal-print">Print Order</button></div></div>`;
  root.appendChild(modal);modal.querySelector("#order-close").onclick=()=>modal.remove();modal.addEventListener("click",e=>{if(e.target===modal)modal.remove()});
  modal.querySelector("#modal-save-status").onclick=()=>{updateOrderStatus(o.id,modal.querySelector("#modal-status").value);modal.remove();const view=document.getElementById("admin-title-main").textContent.toLowerCase().split(" ")[0];renderAdminView(view==="online"?"online":view==="offline"?"offline":"dashboard");showToast("✓ Order status updated")};
  modal.querySelector("#modal-print").onclick=()=>printOrder(o);
}
function updateOrderStatus(id,status){let on=getOnlineOrders(),idx=on.findIndex(o=>o.id===id);if(idx>=0){on[idx].status=status;saveOnlineOrders(on);return}let off=getOfflineOrders();idx=off.findIndex(o=>o.id===id);if(idx>=0){off[idx].status=status;saveOfflineOrders(off)}}
function printOrder(o){const w=window.open("","_blank","width=800,height=900");if(!w){showToast("Please allow popups to print the order.","warn");return}w.document.write(`<html><head><title>${esc(o.id)}</title><style>body{font:14px Arial;padding:40px;color:#2b1b12}h1{font:700 28px Georgia}.line{padding:9px 0;border-bottom:1px solid #ddd}small{color:#777}</style></head><body><h1>MADHURAVANA Pure Honey</h1><p><strong>${esc(o.id)}</strong> · ${esc(o.orderType)}</p><div class="line"><strong>Customer:</strong> ${esc(o.customerName)} · ${esc(o.phone)}</div><div class="line"><strong>Products:</strong><br>${o.products.map(p=>`${esc(p.name)} - ${esc(p.weight)} × ${p.quantity} — ${money(p.price*p.quantity)}`).join("<br>")}</div><div class="line"><strong>Total:</strong> ${money(o.total)}</div><div class="line"><strong>Payment:</strong> ${esc(o.paymentMethod)}</div><div class="line"><strong>Address:</strong> ${esc(o.address.street)}, ${esc(o.address.city)}, ${esc(o.address.state)} - ${esc(o.address.pincode)}</div><div class="line"><strong>Status:</strong> ${esc(o.status)}</div><p><small>Printed ${new Date().toLocaleString("en-IN")}</small></p><script>window.onload=()=>window.print()</script></body></html>`);w.document.close()}
function productsView(){const p=getProducts();return `<div class="admin-section"><div class="admin-toolbar"><strong>PRODUCTS</strong></div><table class="admin-table"><thead><tr><th>Product</th><th>Weight</th><th>Price</th><th>Stock</th><th>Amazon</th><th>Actions</th></tr></thead><tbody>${p.map(x=>`<tr><td>${esc(x.name)}</td><td>${esc(x.weight)}</td><td>${money(x.price)}</td><td><span class="admin-badge ${x.inStock?"delivered":"cancelled"}">${x.inStock?"IN STOCK":"OUT OF STOCK"}</span></td><td>${x.amazonUrl?"Configured":"—"}</td><td class="admin-actions"><button class="mini-btn" data-stock="${x.id}">${x.inStock?"Mark Out of Stock":"Mark In Stock"}</button><button class="mini-btn" data-edit-product="${x.id}">Edit</button></td></tr>`).join("")}</tbody></table></div><div class="admin-section"><h2>Developer note</h2><p class="admin-note">Stock is shared through the configured Supabase table. The browser keeps a local cache for offline fallback. Customers refresh their shared stock automatically every few seconds.</p></div>`}
function bindProducts(){
  document.querySelectorAll("[data-stock]").forEach(b=>{
    b.onclick=async()=>{
      const products=getProducts();
      const product=products.find(i=>i.id===b.dataset.stock);
      if(!product)return;
      const next=!product.inStock;
      b.disabled=true;
      b.textContent="Updating…";
      const ok=typeof setSharedProductStock==="function" ? await setSharedProductStock(product.id,next) : false;
      if(ok){
        product.inStock=next;
        saveProducts(products);
        renderAdminView("products");
        showToast(product.inStock ? "✓ Product is now IN STOCK for customers" : "✓ Product is now OUT OF STOCK for customers");
      }else{
        renderAdminView("products");
      }
    };
  });

  document.querySelectorAll("[data-edit-product]").forEach(b=>{
    b.onclick=()=>editProduct(b.dataset.editProduct);
  });
}

function editProduct(id){const p=getProducts(),x=p.find(i=>i.id===id);if(!x)return;const root=document.getElementById("modal-root")||document.body;const m=document.createElement("div");m.className="modal-backdrop";m.innerHTML=`<div class="modal"><div class="modal-head"><h2>Edit Product</h2><button class="close-modal">×</button></div><form class="admin-form" id="edit-p"><label class="full">Name<input name="name" value="${esc(x.name)}" required></label><label>Weight<input name="weight" value="${esc(x.weight)}" required></label><label>Price<input name="price" type="number" min="0" value="${x.price}" required></label><label class="full">Description<textarea name="description">${esc(x.description)}</textarea></label><label class="full">Amazon URL<input name="amazonUrl" value="${esc(x.amazonUrl||"")}"></label><button class="btn btn-primary" type="submit">Save Product</button></form></div>`;root.appendChild(m);m.querySelector(".close-modal").onclick=()=>m.remove();m.querySelector("form").onsubmit=e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));x.name=d.name.trim();x.weight=d.weight.trim();x.price=Number(d.price);x.description=d.description.trim();x.amazonUrl=d.amazonUrl.trim();saveProducts(p);m.remove();renderAdminView("products");showToast("✓ Product updated")}}
function customersView(){const map=new Map();for(const o of adminOrders()){const key=o.phone||o.customerName;if(!map.has(key))map.set(key,{name:o.customerName,phone:o.phone,count:0,total:0,last:o.orderDate,type:new Set()});const c=map.get(key);c.count++;c.total+=Number(o.total||0);c.last=o.orderDate;c.type.add(o.orderType)}const cs=[...map.values()];return `<div class="admin-section"><h2>Customers</h2><table class="admin-table"><thead><tr><th>Name</th><th>Phone</th><th>Orders</th><th>Total Purchase</th><th>Last Order</th><th>Type</th></tr></thead><tbody>${cs.length?cs.map(c=>`<tr><td>${esc(c.name)}</td><td>${esc(c.phone)}</td><td>${c.count}</td><td>${money(c.total)}</td><td>${esc(c.last)}</td><td>${[...c.type].join(" / ")}</td></tr>`).join(""):`<tr><td colspan="6">No customers yet.</td></tr>`}</tbody></table></div>`}
function settingsView(){const s=getSettings();return `<div class="settings-grid"><div class="admin-section"><h2>Business Configuration</h2><form class="admin-form" id="settings-form"><label class="full">Brand Name<input name="brandName" value="${esc(s.brandName)}"></label><label class="full">WhatsApp Number<input name="whatsappNumber" value="${esc(s.whatsappNumber)}"></label><label class="full">Instagram URL<input name="instagramUrl" value="${esc(s.instagramUrl)}"></label><label>Phone<input name="phone" value="${esc(s.phone)}"></label><label>Email<input name="email" value="${esc(s.email)}"></label><label class="full">Address<input name="address" value="${esc(s.address)}"></label><button class="btn btn-primary" type="submit">Save Settings</button></form></div>
<div class="admin-section"><h2>Backup</h2><p>Because this is a frontend-only MVP, browser storage is not a cloud backup. Export regularly.</p><div class="admin-actions"><button class="mini-btn" id="export-data">Export Data</button><label class="mini-btn" style="cursor:pointer">Import Data<input id="import-data" type="file" accept=".json,application/json" hidden></label></div><p class="admin-note" style="margin-top:15px">Export includes products, online orders, offline orders and settings.</p></div>
<div class="admin-section danger-zone"><h2>Danger Zone</h2><div class="admin-actions"><button class="mini-btn danger" id="clear-orders">Clear Orders</button><button class="mini-btn danger" id="reset-products">Reset Products</button><button class="mini-btn danger" id="clear-all">Clear All Local Data</button></div></div>
<div class="admin-section"><h2>Frontend-only limitation</h2><p class="admin-note">localStorage is browser-specific. Multiple devices do not share orders, WhatsApp messages cannot be automatically received by this site, and this admin login is not secure authentication. For production multi-device operations, move data/authentication behind a backend such as Spring Boot + MySQL + cloud hosting.</p></div></div>`}
function bindSettings(){document.getElementById("settings-form")?.addEventListener("submit",e=>{e.preventDefault();saveSettings(Object.fromEntries(new FormData(e.currentTarget)));showToast("✓ Settings saved");renderHeader();renderFooter()});document.getElementById("export-data")?.addEventListener("click",exportData);document.getElementById("import-data")?.addEventListener("change",importData);document.getElementById("clear-orders")?.addEventListener("click",()=>{if(confirm("Delete ALL online and offline orders? This cannot be undone unless you exported a backup.")){saveOnlineOrders([]);saveOfflineOrders([]);renderAdminView("settings");showToast("Orders cleared")}});document.getElementById("reset-products")?.addEventListener("click",()=>{if(confirm("Reset all products to the default catalog?")){saveProducts(DEFAULT_PRODUCTS);renderAdminView("products");showToast("Products reset")}});document.getElementById("clear-all")?.addEventListener("click",()=>{if(confirm("Clear ALL MADHURAVANA local data? Export a backup first.")){Object.values(KEYS).forEach(k=>localStorage.removeItem(k));localStorage.removeItem("madhuravana_offline_counter");alert("All local data cleared. The page will reload.");location.href="index.html"}})}
function exportData(){const data={exportedAt:new Date().toISOString(),products:getProducts(),onlineOrders:getOnlineOrders(),offlineOrders:getOfflineOrders(),settings:getSettings()};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`madhuravana-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);showToast("✓ Backup exported")}
function importData(e){const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const d=JSON.parse(reader.result);if(!Array.isArray(d.products)||!Array.isArray(d.onlineOrders)||!Array.isArray(d.offlineOrders))throw new Error("Invalid backup");if(confirm("Import this backup and replace current browser data?")){saveProducts(d.products);saveOnlineOrders(d.onlineOrders);saveOfflineOrders(d.offlineOrders);if(d.settings)saveSettings(d.settings);renderAdminView("dashboard");showToast("✓ Backup imported")}}catch(err){showToast("Invalid backup file.","warn")}};reader.readAsText(file)}
initializeFreshAdmin();

window.addEventListener("open-admin-login",()=>{if(location.hash==="#admin"&&isAdmin())renderAdmin();else adminOpenLogin()});
window.addEventListener("hashchange",()=>{if(location.hash==="#admin")renderAdmin()});
if(location.hash==="#admin")window.addEventListener("DOMContentLoaded",()=>{setTimeout(renderAdmin,50)});

