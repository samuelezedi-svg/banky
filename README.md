# NairaShield

A Chrome, Edge, and Brave extension that helps people spot fake Nigerian bank and fintech links before they tap.

Checks run on the device. Browsing history is not uploaded.

## What it does

- Marks official bank, fintech, and regulator domains as **Safe**
- Flags misspellings, punycode lookalikes, and fake BVN / login pages as **Caution** or **Danger**
- Inspects login forms, BVN/OTP fields, and scam wording on the page
- Lets you report a site onto a local blacklist, with optional feed updates
- Intercepts dangerous clicks and navigations with a full warning screen
- Shows a live verdict in the toolbar popup

## Load the extension

1. Open Chrome, Edge, or Brave
2. Go to `chrome://extensions` (or `edge://extensions`)
3. Turn on **Developer mode**
4. Click **Load unpacked**
5. Select this project folder (`project-project`)

The NairaShield shield should appear in the toolbar.

## Try it

Open `demo/test-links.html` in the same browser, then:

- Click an official bank link — popup should say **Safe**
- Click a fake lookalike — you should get a **Danger** gate

You can also open any live bank site and click the toolbar icon.

## Local fake-bank hosts

The public fake links above often fail DNS. For screenshots, host lookalike pages on this computer:

1. Add the names in `demo/local-banks/hosts.txt` to `/etc/hosts`:

   ```bash
   sudo sh -c 'cat demo/local-banks/hosts.txt >> /etc/hosts'
   ```

2. Start the local server:

   ```bash
   node demo/local-banks/server.js
   ```

3. Open `http://accessbank-login.test:8787/update-account` (or use the local links in `demo/test-links.html`)

NairaShield should block the page. Use **Continue anyway** if you need a photo of the fake portal itself. These pages stay on `127.0.0.1` and do not save passwords.

## Settings

Right-click the icon → **Options**, or use the gear in the popup.

- Block dangerous pages on or off
- Balanced vs Strict sensitivity
- Dark or light theme
- Turn watching off for specific institutions
- Report a site to a local blacklist
- Refresh bundled or remote allowlist/blacklist feeds

## Project layout

```text
manifest.json
src/lib/banks.js       Official domains and brand names
src/lib/detect.js      Local scoring engine
src/lib/storage.js     Settings, reports, blacklist, threat-feed refresh
data/threat-feed.json  Bundled allowlist/blacklist updates
src/popup/             Toolbar UI
src/options/           Settings
src/warning/           Full-page danger screen
src/content/           On-page banner and click intercept
src/background/        Navigation checks, toolbar badge, feed refresh
demo/local-banks/      Local fake-bank hosts for screenshots
```
