#!/usr/bin/env node
/**
 * Local fake-bank hosts for NairaShield screenshots and demos.
 * These pages never leave this machine and do not collect credentials.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = Number(process.env.PORT) || 8787;
const PUBLIC = path.join(__dirname, "public");

const SITES = {
  "accessbank-login.test": {
    bank: "Access Bank",
    initials: "AB",
    color: "#F26334",
    path: "/update-account",
    kicker: "Internet Banking",
    title: "Access Bank — Update your account",
    alert: "Your internet banking profile needs a quick update. Confirm your details to avoid restriction."
  },
  "gtbannk.test": {
    bank: "GTBank",
    initials: "GT",
    color: "#E31B23",
    path: "/verify-bvn",
    kicker: "GTWorld Secure",
    title: "GTBank — Verify BVN",
    alert: "BVN verification is required. Enter your token to restore full access."
  },
  "zenithbank-secure.test": {
    bank: "Zenith Bank",
    initials: "ZB",
    color: "#ED1C24",
    path: "/reactivate",
    kicker: "Zenith Online",
    title: "Zenith Bank — Reactivate account",
    alert: "This profile was marked inactive. Reactivate now to keep receiving alerts."
  },
  "firstbank-login.test": {
    bank: "First Bank",
    initials: "FB",
    color: "#0033A1",
    path: "/secure-login",
    kicker: "FirstOnline",
    title: "First Bank — Secure login",
    alert: "Unusual sign-in detected. Confirm your password and token to continue."
  },
  "kuda-verify.test": {
    bank: "Kuda",
    initials: "KU",
    color: "#40196D",
    path: "/nin-verify",
    kicker: "Kuda Identity",
    title: "Kuda — NIN verification",
    alert: "NIN update needed to keep your account open. Complete this check today."
  }
};

function siteForHost(host) {
  const name = String(host || "").split(":")[0].toLowerCase();
  if (SITES[name]) return { key: name, site: SITES[name] };
  const asTest = name.replace(/\.localhost$/, ".test");
  if (SITES[asTest]) return { key: asTest, site: SITES[asTest] };
  return null;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderLogin(site, url) {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(site.title)}</title>
    <link rel="stylesheet" href="/demo.css" />
    <style>:root { --accent: ${escapeHtml(site.color)}; }</style>
  </head>
  <body>
    <div class="demo-banner">LOCAL NAIRASHIELD DEMO — not a real bank, nothing is sent anywhere</div>
    <main class="wrap">
      <section class="card">
        <div class="brand">
          <div class="mark">${escapeHtml(site.initials)}</div>
          <div>
            <strong>${escapeHtml(site.bank)}</strong>
            <span>${escapeHtml(site.kicker)}</span>
          </div>
        </div>
        <p class="alert">${escapeHtml(site.alert)}</p>
        <form id="demo-form">
          <label for="user">User ID / account number</label>
          <input id="user" name="user" autocomplete="off" />
          <label for="bvn">BVN</label>
          <input id="bvn" name="bvn" inputmode="numeric" autocomplete="off" />
          <label for="password">Password / PIN</label>
          <input id="password" name="password" type="password" autocomplete="off" />
          <label for="otp">OTP</label>
          <input id="otp" name="otp" inputmode="numeric" autocomplete="off" />
          <button type="submit">Continue</button>
        </form>
        <p class="fine">Hosted only on this computer at ${escapeHtml(url)}. This page exists so NairaShield can show a realistic intercept.</p>
      </section>
    </main>
    <script>
      document.getElementById("demo-form").addEventListener("submit", function (event) {
        event.preventDefault();
        alert("Demo only. NairaShield would have warned you before this fake form.");
      });
    </script>
  </body>
</html>`;
}

function renderHub(port) {
  const items = Object.entries(SITES)
    .map(([host, site]) => {
      const href = `http://${host}:${port}${site.path}`;
      return `<li><a href="${href}">${escapeHtml(site.bank)}</a> — <code>${href}</code></li>`;
    })
    .join("\n          ");

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>NairaShield local demo banks</title>
    <link rel="stylesheet" href="/demo.css" />
  </head>
  <body>
    <main class="hub">
      <p class="demo-banner">Local only. Add demo/local-banks/hosts.txt to /etc/hosts first.</p>
      <h1>Local fake-bank hosts</h1>
      <p>With the extension loaded, these should open the NairaShield danger screen. Use Continue anyway if you need a screenshot of the fake portal itself.</p>
      <ul>
          ${items}
      </ul>
    </main>
  </body>
</html>`;
}

const server = http.createServer((req, res) => {
  const host = req.headers.host || "";
  const url = new URL(req.url, `http://${host}`);

  if (url.pathname === "/demo.css") {
    res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
    res.end(fs.readFileSync(path.join(PUBLIC, "demo.css")));
    return;
  }

  const match = siteForHost(host);
  if (match) {
    const pageUrl = `http://${match.key}:${PORT}${match.site.path}`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(renderLogin(match.site, pageUrl));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(renderHub(PORT));
});

server.listen(PORT, "127.0.0.1", () => {
  console.log("NairaShield local banks on http://127.0.0.1:" + PORT);
  console.log("1. Append demo/local-banks/hosts.txt to /etc/hosts");
  console.log("2. Open http://accessbank-login.test:" + PORT + "/update-account");
  Object.entries(SITES).forEach(([host, site]) => {
    console.log("   http://" + host + ":" + PORT + site.path);
  });
});
