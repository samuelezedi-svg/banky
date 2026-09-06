# Host 2 fake bank URLs on Kali (NairaShield lab)

Use this guide to run **two lookalike Nigerian bank pages** on a Kali Linux server for project demos and evaluation. These pages are **fake**, do not store passwords, and must stay in a **lab / school environment only**.

**Recommended pair (matches NairaShield detection):**

| Fake URL | Real brand | Why NairaShield flags it |
|----------|------------|---------------------------|
| `http://accessbank-login.test/update-account` | Access Bank | Brand in hostname + scam path |
| `http://gtbannk.test/verify-bvn` | GTBank | Typosquat + BVN path |

---

## Before you start

### Safety rules

- Use only on a **private lab network** (VM, home LAN, school VLAN).
- Do **not** expose these sites to the public internet.
- Do **not** use real bank logos or copy exact official pages.
- Do **not** collect or log credentials.
- Tell your supervisor these are **controlled PoC pages** for testing NairaShield.

### What you need

| Item | Example |
|------|---------|
| Kali server IP | `192.168.1.50` |
| Your Mac/PC (browser + NairaShield) | same network as Kali |
| SSH access to Kali | `ssh kali@192.168.1.50` |
| Port | `80` (HTTP) |

Replace `192.168.1.50` with your Kali IP everywhere below.

---

## Overview

```text
┌─────────────────┐     HTTP      ┌──────────────────┐
│  Your Mac/PC    │ ────────────► │  Kali server     │
│  + NairaShield  │               │  nginx :80       │
│  /etc/hosts     │               │  2 virtual hosts │
└─────────────────┘               └──────────────────┘
```

1. Copy demo pages to Kali.
2. Configure nginx with two hostnames.
3. Point fake hostnames to Kali IP in **your computer’s** `/etc/hosts`.
4. Open URLs in Chrome with NairaShield loaded.

---

## Step 1 — Copy demo files to Kali

On **your Mac** (from the project folder):

```bash
scp -r demo/local-banks kali@192.168.1.50:~/
```

On **Kali**, confirm files exist:

```bash
ls ~/local-banks/
# server.js  public/  hosts.txt
```

---

## Step 2 — Install nginx on Kali

```bash
sudo apt update
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

Check nginx is running:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1
# should print 200
```

---

## Step 3 — Create two static fake pages on Kali

Using **nginx** (simplest for a dedicated server). Create directories:

```bash
sudo mkdir -p /var/www/accessbank-login.test
sudo mkdir -p /var/www/gtbannk.test
```

### 3a. Access Bank fake page

```bash
sudo tee /var/www/accessbank-login.test/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Access Bank — Update your account</title>
  <style>
    body { font-family: Segoe UI, sans-serif; background: #07111c; margin: 0; padding: 24px; }
    .banner { background: #111; color: #fde68a; text-align: center; font-size: 12px; padding: 8px; }
    .card { max-width: 420px; margin: 32px auto; background: #fff; border-radius: 16px; padding: 24px; }
    .mark { width: 40px; height: 40px; background: #F26334; color: #fff; border-radius: 10px; display: grid; place-items: center; font-weight: 700; }
    .alert { background: #fff6ed; color: #93370d; padding: 12px; border-radius: 10px; font-size: 13px; }
    label { display: block; margin-top: 12px; font-size: 13px; font-weight: 600; }
    input { width: 100%; padding: 10px; margin-top: 4px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
    button { width: 100%; margin-top: 16px; padding: 12px; background: #F26334; color: #fff; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; }
    .fine { font-size: 11px; color: #666; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="banner">NAIRASHIELD LAB DEMO — not Access Bank — nothing is saved</div>
  <main class="card">
    <div class="mark">AB</div>
    <h1>Access Bank Internet Banking</h1>
    <p class="alert">Your account needs a quick update. Confirm your BVN and OTP to avoid restriction.</p>
    <form onsubmit="event.preventDefault(); alert('Demo only. NairaShield should block this page.');">
      <label>User ID</label>
      <input name="user" autocomplete="off" />
      <label>BVN</label>
      <input name="bvn" autocomplete="off" />
      <label>Password / PIN</label>
      <input name="password" type="password" autocomplete="off" />
      <label>OTP</label>
      <input name="otp" autocomplete="off" />
      <button type="submit">Continue</button>
    </form>
    <p class="fine">Lab host only. For NairaShield final-year project testing.</p>
  </main>
</body>
</html>
EOF
```

### 3b. GTBank typosquat fake page

```bash
sudo tee /var/www/gtbannk.test/index.html > /dev/null << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>GTBank — Verify BVN</title>
  <style>
    body { font-family: Segoe UI, sans-serif; background: #07111c; margin: 0; padding: 24px; }
    .banner { background: #111; color: #fde68a; text-align: center; font-size: 12px; padding: 8px; }
    .card { max-width: 420px; margin: 32px auto; background: #fff; border-radius: 16px; padding: 24px; }
    .mark { width: 40px; height: 40px; background: #E31B23; color: #fff; border-radius: 10px; display: grid; place-items: center; font-weight: 700; }
    .alert { background: #fff6ed; color: #93370d; padding: 12px; border-radius: 10px; font-size: 13px; }
    label { display: block; margin-top: 12px; font-size: 13px; font-weight: 600; }
    input { width: 100%; padding: 10px; margin-top: 4px; border: 1px solid #ddd; border-radius: 8px; box-sizing: border-box; }
    button { width: 100%; margin-top: 16px; padding: 12px; background: #E31B23; color: #fff; border: 0; border-radius: 10px; font-weight: 700; cursor: pointer; }
    .fine { font-size: 11px; color: #666; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="banner">NAIRASHIELD LAB DEMO — not GTBank — nothing is saved</div>
  <main class="card">
    <div class="mark">GT</div>
    <h1>GTBank — Verify BVN</h1>
    <p class="alert">BVN verification is required. Enter your token to restore full access.</p>
    <form onsubmit="event.preventDefault(); alert('Demo only. NairaShield should block this page.');">
      <label>Account number</label>
      <input name="user" autocomplete="off" />
      <label>BVN</label>
      <input name="bvn" autocomplete="off" />
      <label>Password</label>
      <input name="password" type="password" autocomplete="off" />
      <label>OTP</label>
      <input name="otp" autocomplete="off" />
      <button type="submit">Verify now</button>
    </form>
    <p class="fine">Lab host only. For NairaShield final-year project testing.</p>
  </main>
</body>
</html>
EOF
```

---

## Step 4 — Configure nginx virtual hosts

Create the Access Bank site config:

```bash
sudo tee /etc/nginx/sites-available/accessbank-login.test > /dev/null << 'EOF'
server {
    listen 80;
    server_name accessbank-login.test;

    root /var/www/accessbank-login.test;
    index index.html;

    location /update-account {
        try_files /index.html =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

Create the GTBank typosquat site config:

```bash
sudo tee /etc/nginx/sites-available/gtbannk.test > /dev/null << 'EOF'
server {
    listen 80;
    server_name gtbannk.test;

    root /var/www/gtbannk.test;
    index index.html;

    location /verify-bvn {
        try_files /index.html =404;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF
```

Enable both sites and reload nginx:

```bash
sudo ln -sf /etc/nginx/sites-available/accessbank-login.test /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/gtbannk.test /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 5 — Open firewall on Kali (if enabled)

```bash
sudo ufw allow 80/tcp
sudo ufw status
```

If you use VirtualBox/VMware, ensure the VM network is **Bridged** or **Host-only** so your Mac can reach Kali.

---

## Step 6 — Point fake names to Kali on your Mac

Edit hosts on the machine where you browse (your Mac):

```bash
sudo sh -c 'cat >> /etc/hosts << EOF
192.168.1.50 accessbank-login.test
192.168.1.50 gtbannk.test
EOF'
```

Replace `192.168.1.50` with your Kali IP.

Flush DNS cache on macOS (optional):

```bash
sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
```

---

## Step 7 — Test from Kali first

On Kali:

```bash
curl -H "Host: accessbank-login.test" http://127.0.0.1/update-account | head
curl -H "Host: gtbannk.test" http://127.0.0.1/verify-bvn | head
```

Both should return HTML with “NAIRASHIELD LAB DEMO”.

From your Mac:

```bash
curl http://accessbank-login.test/update-account | head
curl http://gtbannk.test/verify-bvn | head
```

---

## Step 8 — Test with NairaShield

1. Load the NairaShield extension on Chrome (`chrome://extensions` → Load unpacked).
2. Open:
   - `http://accessbank-login.test/update-account`
   - `http://gtbannk.test/verify-bvn`
3. Expected results:
   - **Danger** verdict in popup
   - Full-page warning (if “Block dangerous pages” is on)
   - Reasons mention unofficial domain, brand name, BVN/login path

Use **Continue anyway** only if you need a screenshot of the fake portal.

---

## Alternative — Run the Node demo server on Kali

If you prefer the project’s existing `server.js`:

### On Kali

```bash
# Install Node if needed
sudo apt install -y nodejs npm

cd ~/local-banks
```

Edit `server.js` so it listens on all interfaces (not just localhost). Change the last lines from:

```js
server.listen(PORT, "127.0.0.1", () => {
```

to:

```js
server.listen(PORT, "0.0.0.0", () => {
```

Run it:

```bash
PORT=80 node server.js
# or if port 80 needs root:
sudo PORT=80 node server.js
```

Add the same `/etc/hosts` entries on your Mac pointing to Kali IP.

URLs (with port 8787 if you keep default port):

- `http://accessbank-login.test:8787/update-account`
- `http://gtbannk.test:8787/verify-bvn`

**Tip:** nginx on port 80 is easier for demos (no `:8787` in the URL).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Page does not load | Ping Kali IP; check VM network mode |
| Wrong page / nginx default | Check `server_name` matches hostname in browser |
| `502` / nginx error | Run `sudo nginx -t` and check `/var/log/nginx/error.log` |
| NairaShield does not block | Reload extension; check Options → Block dangerous pages is ON |
| Host not resolving | Verify Mac `/etc/hosts` has Kali IP + fake names |
| Port 80 blocked | `sudo ss -tlnp \| grep :80` on Kali |

---

## For your paper / evaluation log

Record these as **controlled lab phishing URLs**:

| URL | Host type | Attack pattern | Expected NairaShield level |
|-----|-----------|----------------|----------------------------|
| `http://accessbank-login.test/update-account` | Fake hostname | Brand impersonation + update path | Danger |
| `http://gtbannk.test/verify-bvn` | Typosquat | Misspelling + BVN path | Danger |

Example log row:

```text
URL: http://gtbannk.test/verify-bvn
Hosted on: Kali 192.168.1.50 (lab only)
Expected: Danger
Actual: Danger
Screenshot: fig-4-2-gtbannk-warning.png
```

---

## Checklist

- [ ] Kali IP noted: `_______________`
- [ ] nginx installed and both sites enabled
- [ ] Mac `/etc/hosts` points fake names to Kali
- [ ] Both URLs load in browser
- [ ] NairaShield shows **Danger** for both
- [ ] Screenshots saved for Chapter 4
- [ ] Server not exposed to public internet

---

## Related project files

- Local version (same idea on your Mac): `demo/local-banks/server.js`
- Demo link page: `demo/test-links.html`
- Project checklist: `PROJECT-CHECKLIST.md`
