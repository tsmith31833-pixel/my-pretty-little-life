# Money & Grace Co. website: deploy guide

This is the approved Money & Grace Co. website as a plain static site.

**No build step. No dependencies. No `package.json`.** Netlify serves the files exactly as they are.

## Upload this folder

```
money-and-grace-site/
```

Upload the **`money-and-grace-site`** folder itself, not this outer folder and not the ZIP.

### Option A: Drag and drop (fastest)

1. Sign in at app.netlify.com.
2. Go to **Sites → Add new site → Deploy manually**.
3. Drag the **`money-and-grace-site`** folder onto the upload area.
4. Netlify gives you a live address like `https://something.netlify.app`.

To update the site later, open the site in Netlify, go to **Deploys**, and drag the updated folder onto the deploy area.

### Option B: From GitHub

Use these settings when you connect the repository:

| Setting | Value |
| --- | --- |
| Base directory | `website-deploy/money-and-grace-site` |
| Build command | *(leave empty)* |
| Publish directory | `.` *(or leave the default, since `netlify.toml` sets it)* |

## Use your own domain

1. In Netlify, open the site and go to **Domain management → Add a domain**.
2. Type your domain, for example `moneyandgraceco.com`.
3. Follow Netlify's DNS instructions. You can point your registrar's nameservers to Netlify, or add the A and CNAME records Netlify shows you.
4. Netlify adds the free HTTPS certificate automatically, usually within an hour.
5. Once the domain works, open `index.html` and change `content="og-image.png"` to the full address, for example `content="https://moneyandgraceco.com/og-image.png"`. Link previews on social media need the full address.

## What is in the folder

| Path | What it is |
| --- | --- |
| `index.html` | The whole site. Pages switch with links like `#shop`, `#reset-room` and `#product-budget-planner`. |
| `css/styles.css` | The approved design: colors, layout and components. |
| `css/fonts.css` and `fonts/` | Playfair Display, Lato and Pinyon Script, self-hosted (SIL Open Font License, see `fonts/OFL.txt`). |
| `js/main.js` | Navigation, pages, product pages, checklists, prompts and forms. |
| `js/config.js` | **The settings you edit**: checkout links, form connections, contact email and social links. |
| `404.html` | Page shown for addresses that do not exist. |
| `favicon.svg`, `apple-touch-icon.png`, `og-image.png` | Browser icon, iPhone home-screen icon and social share image. |
| `_headers`, `netlify.toml` | Netlify settings: security headers, font caching and no build step. |
| `robots.txt` | Lets search engines index the site. |

The planner and lifestyle images are drawn in code (in `js/main.js`), so there are no image files to lose. When you have real product photos, they can replace the drawn mockups.

## Before launch: connect what is not connected yet

Open **`js/config.js`** in a text editor. Every setting has a note next to it.

1. **Contact email.** Replace `hello@moneyandgraceco.com` with your inbox. The Contact page and the footer update automatically, and the "Placeholder address" note disappears.
2. **Checkout (Payhip).** For each product that is ready, set `status: 'available'` and paste its Payhip link into `checkout`. A product shows **Available now** and **Buy Now** only when it has both. Prices live in Payhip, not on the site.
3. **Forms.** Each form needs an address that accepts form submissions. Formspree works well: create a form, then paste its URL, for example `https://formspree.io/f/abcdwxyz`. You can use one Formspree form for everything, or a separate one for each:
   - `newsletter`: the homepage, footer, Money Edit and free kit signups
   - `notify`: "Notify me" on Coming soon products
   - `community`: Join the free Money & Grace community (The Reset Room)
   - `wins`: Share your win
   - `contact`: the Contact form

   Each submission includes a `form` field naming which form it came from. Until a form has an address, visitors see a message saying it is not connected yet, and nothing is sent or saved.
4. **Social links.** Replace the four platform addresses with your own profile links.
5. **Content.** Replace the drafted product details (in `js/main.js`, under `PRODUCTS`), the founder story placeholder on the About page, and the monthly challenge each month.
6. **Legal pages.** Add a privacy policy, terms and a refund policy for digital products before you take payments or collect emails.

## Preview on your computer

Opening `index.html` by double-clicking works for a quick look. For a true preview, run this inside `money-and-grace-site`:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## How the interactive features work

- **Checklists** (Sunday Reset, Monthly Money Reset, Challenge of the Month, No-Spend Weekend, Debt check-in): ticks are saved in each visitor's own browser on that device. Nobody else sees them, and they are not sent anywhere.
- **Community wins** are clearly labeled sample content until you add real wins that members gave permission to share.
- There are **no member accounts or discussion boards**. The Reset Room community runs by email once you connect your email platform.
- The site uses the light cream design you approved, on every device, including phones set to dark mode.
