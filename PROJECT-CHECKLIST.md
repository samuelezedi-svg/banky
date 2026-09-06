# NairaShield — Project checklist

Use this list to track app work, evaluation, and paper updates.  
Check items off as you complete them.

**Legend:** `[x]` = done in code or by us · `[ ]` = still to do · `[~]` = partly done

---

## A. App improvements (supervisor feedback)

### A1. Punycode / homograph detection
- [x] Decode Punycode/IDN hostnames before comparing to official domains
- [x] Flag lookalike domains that use disguised characters
- [ ] Reload extension on `chrome://extensions` after pulling latest code
- [ ] Manually verify `https://xn--gtbnk-3ve.com/` shows **Danger**
- [ ] Screenshot punycode warning for Chapter 4

### A2. Richer page-content analysis
- [x] Detect login forms and password fields
- [x] Detect BVN / NIN / OTP / PIN-style fields
- [x] Scan page text for scam keywords (BVN, OTP, NIBSS, account blocked, etc.)
- [x] Detect meta-refresh redirects
- [ ] Test on local fake bank pages (`node demo/local-banks/server.js`)
- [ ] Screenshot content-based warning for Chapter 4

### A3. Blacklist + user reporting
- [x] Local blacklist stored in `chrome.storage`
- [x] **Report this site** button (popup, warning page, on-page gate)
- [x] Options page shows local blacklist with remove button
- [ ] Report a test site and confirm it appears in Options → Local blacklist
- [ ] Confirm reported host is blocked on next visit

### A4. Automatic threat-list updates
- [x] Bundled feed: `data/threat-feed.json`
- [x] Auto-refresh on install + every 12 hours
- [x] Options: set remote feed URL + **Update lists now**
- [ ] Open Options → **Update lists now** and confirm status message
- [ ] (Optional) Host feed on GitHub Pages and paste URL in Options
- [ ] Note in paper: local + optional remote JSON feed (not a commercial API)

---

## B. Evaluation & testing (you need to do)

### B1. Expand the URL evaluation dataset
- [ ] Grow dataset beyond 120 URLs (target: **300–500+** if possible)
- [ ] Include more attack types:
  - [ ] Typosquatting
  - [ ] Punycode / homograph
  - [ ] Brand + risky TLD
  - [ ] Fake BVN / KYC / login paths
  - [ ] HTTP impersonation
  - [ ] Blacklist hits
  - [ ] Redirect-style pages
- [ ] Keep balanced legit samples (official Nigerian domains + other safe sites)
- [ ] Regenerate evaluation CSVs after expansion
- [ ] Share updated CSVs with teammate for Chapter 4

**Current files (old 120-URL set):**
- `demo/evaluation-summary.csv`
- `demo/evaluation-results.csv`
- `demo/question-answers.csv`

### B2. Test on real websites
- [ ] Test official bank sites (GTBank, First Bank, Access, Kuda, CBN, etc.)
- [ ] Confirm popup shows **Safe / Official [Bank]**
- [ ] Test local fake banks (`demo/local-banks/`)
- [ ] Confirm **Danger** intercept + warning page
- [ ] (Optional) Test a few URLs from a public phishing list — do not enter credentials
- [ ] Keep a simple test log:

| # | URL | Expected | Actual | Screenshot file |
|---|-----|----------|--------|-----------------|
| 1 | | | | |
| 2 | | | | |

### B3. Per-variable evaluation metrics (for paper)
- [ ] Document which detection signals exist (punycode, blacklist, typosquat, form, content keywords, redirect, etc.)
- [ ] Add columns to evaluation export for each signal (or summary counts)
- [ ] Report TP / FP / TN / FN on the **expanded** dataset
- [ ] Report breakdown by attack type (typosquat vs punycode vs brand+TLD, etc.)
- [ ] Reconcile latency numbers (125 ms vs 170 ms) with one clear measurement method

### B4. Usability testing (other people)
- [ ] Recruit **5–10** testers (classmates, friends)
- [ ] Prepare short task script:
  - [ ] Open an official bank site and read the popup
  - [ ] Open a fake / local phishing link and read the warning
  - [ ] Try **Report this site** (optional)
- [ ] Collect feedback:
  - [ ] Was the warning understandable?
  - [ ] Would they stop and go back?
  - [ ] Any confusion or false alarms?
- [ ] Summarize results in a table for the paper

| Participant | Task | Understood warning? | Would go back? | Comments |
|-------------|------|---------------------|----------------|----------|
| P1 | | | | |
| P2 | | | | |

---

## C. Screenshots & figures (for Chapter 4)

- [ ] **Figure:** Popup on legitimate e-banking portal (Safe)
- [ ] **Figure:** Full-page danger / alert on threat detection
- [ ] **Figure:** Options page (blacklist + feed update) — optional
- [ ] **Figure:** Local fake bank login page (after Continue anyway) — optional
- [ ] **Figure:** Dataset distribution chart (after expanded dataset)
- [ ] **Figure:** Attack-vector breakdown chart (after expanded dataset)
- [ ] **Figure:** Confusion matrix / metrics table (after re-evaluation)

---

## D. Paper / documentation (teammate — after data is ready)

### D1. Chapter 4 rewrite (depends on B1–B3)
- [ ] Update dataset size and composition
- [ ] Update TP / FP / TN / FN counts from new evaluation
- [ ] Update accuracy, precision, recall, F1, specificity
- [ ] Describe new detection variables (punycode, content, blacklist, feed)
- [ ] Add usability testing section (from B4)
- [ ] Fix architecture wording: **client-side** detection (no backend required for PoC)
- [ ] Remove or correct claims about SQL database if not implemented
- [ ] Align latency numbers with one testing method

### D2. Abstract (supervisor format)
- [ ] **Paragraph 1:** Background, problem, aim/objective
- [ ] **Paragraph 2:** Methodology and key findings
- [ ] **Paragraph 3:** Conclusion, implications, contribution

### D3. Limitations (be honest)
- [ ] State dataset was partly synthetic / constructed
- [ ] Do not overclaim “99% in the wild”
- [ ] Note punycode was a prior weakness (now addressed in app)
- [ ] Note no large-scale real phishing feed unless you add one

### D4. Question sheet answers (for teammate)
- [ ] Q1: All PoC source files — see `demo/question-answers.csv` + README layout
- [ ] Q2: Storage model — local allowlist + blacklist + reports (not remote DB)
- [ ] Q3–Q4: UI screenshots — from section C
- [ ] Q5–Q10: Counts — regenerate after expanded evaluation

---

## E. Quick commands reference

```bash
# Load extension
# chrome://extensions → Developer mode → Load unpacked → this folder

# Local fake bank demos
sudo sh -c 'cat demo/local-banks/hosts.txt >> /etc/hosts'
node demo/local-banks/server.js
# Then open http://accessbank-login.test:8787/update-account

# Demo link page
# Open demo/test-links.html in the browser
```

---

## F. Suggested order of work

1. [ ] Reload extension and complete **Section A** verification checkboxes  
2. [ ] Complete **Section B2** (real + local website tests + screenshots)  
3. [ ] Expand evaluation dataset **B1** and regenerate metrics **B3**  
4. [ ] Run usability tests **B4**  
5. [ ] Hand off CSVs, screenshots, and test logs to teammate for **Section D**

---

## G. Already completed in code (reference)

| Feature | Location |
|---------|----------|
| Punycode decode | `src/lib/detect.js` |
| Content / form / keyword checks | `src/lib/detect.js`, `src/content/content.js` |
| Blacklist + reports + feed refresh | `src/lib/storage.js` |
| Bundled threat feed | `data/threat-feed.json` |
| Report UI | `src/popup/`, `src/warning/`, `src/content/` |
| Options: feed + blacklist | `src/options/` |
| Local demo banks | `demo/local-banks/` |
| Original 120-URL evaluation | `demo/evaluation-*.csv`, `demo/question-answers.csv` |

---

*Last updated: September 2026 — extension version 1.1.0*
