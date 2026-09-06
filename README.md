# NairaShield local fake-bank demo server

Small Node server that hosts lookalike Nigerian bank pages for **lab testing** with the NairaShield extension.

These pages are fake, stay on your machine/network, and do not save passwords.

## Quick start

1. Add fake hostnames to `/etc/hosts` (see `hosts.txt`).
2. Run:

```bash
node server.js
```

3. Open:
   - `http://accessbank-login.test:8787/update-account`
   - `http://gtbannk.test:8787/verify-bvn`

## Files

- `server.js` — demo HTTP server
- `hosts.txt` — sample `/etc/hosts` entries
- `public/demo.css` — shared styles

## Kali / remote server

See the full NairaShield project docs for nginx setup on a lab server.
