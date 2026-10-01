# MADHURAVANA Pure Honey — Frontend E-commerce MVP

## Stack
- HTML5
- CSS3
- Vanilla JavaScript
- Browser `localStorage`

No backend, database, payment gateway, framework, or external e-commerce platform is used.

## Files
- `index.html` — public home page
- `shop.html` — catalogue
- `product.html` — product details
- `cart.html` — persistent browser cart
- `checkout.html` — COD checkout + WhatsApp message generation
- `order-success.html` — honest WhatsApp handoff confirmation
- `style.css` — customer + admin styling
- `script.js` — products, cart, checkout, WhatsApp, storage helpers
- `admin.js` — hidden admin dashboard, orders, stock, customers, settings, backup
- `images/` — reserved for client product images

## Important configuration
Edit `BUSINESS_CONFIG` in `script.js`:
- `whatsappNumber`
- `instagramUrl`
- `phone`
- `email`
- `address`

Edit `ADMIN_CONFIG` in `admin.js` before delivery:
- username
- password

The supplied credentials are intentionally placeholders.

## Admin access
Press **Ctrl + Shift + A**. A login modal appears first. After successful login, the dashboard opens at `#admin`.

This is **not secure authentication** because the project has no backend.

## WhatsApp behavior
The website creates and stores an online order locally, generates a unique order ID, prepares a complete WhatsApp message, and opens WhatsApp. The customer must press **Send**. The website cannot automatically receive WhatsApp messages.

## Data limitation
`localStorage` is browser-specific:
- clearing browser storage can remove data
- different devices do not share orders
- there is no cloud database
- order status changes are local to that browser

Use the Admin → Settings → Export Data function regularly.

## Future production upgrade
The UI/data helpers are intentionally modular so the local storage layer can later be replaced with:
Frontend → Spring Boot API → MySQL → Cloud Server
without redesigning the customer experience.
