(function () {
  const NS = self.NairaShield;
  const ROOT_ID = "naira-shield-root";
  let currentResult = null;

  function pageSignals() {
    const forms = Array.from(document.querySelectorAll("form"));
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const textLike = document.querySelectorAll(
      'input[type="text"], input[type="tel"], input[type="number"], input[type="email"], input:not([type])'
    );
    const fieldText = Array.from(document.querySelectorAll("input, label, textarea"))
      .map((el) =>
        [el.name, el.id, el.placeholder, el.getAttribute("aria-label"), el.textContent]
          .filter(Boolean)
          .join(" ")
      )
      .join(" ")
      .toLowerCase();
    const meta = document.querySelector('meta[http-equiv="refresh" i]');
    let redirectHost = "";
    if (meta) {
      const content = meta.getAttribute("content") || "";
      const match = content.match(/url\s*=\s*['"]?([^'">\s]+)/i);
      if (match && match[1]) {
        try {
          redirectHost = new URL(match[1], location.href).hostname;
        } catch (err) {
          redirectHost = "";
        }
      }
    }

    const brandBits = Array.from(document.querySelectorAll("h1, h2, .logo, [class*='logo' i]"))
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 6)
      .join(" ");

    return {
      title: document.title || "",
      brandText: brandBits.slice(0, 240),
      bodyText: ((document.body && document.body.innerText) || "").replace(/\s+/g, " ").slice(0, 4000),
      hasPassword: passwordInputs.length > 0,
      hasLoginForm:
        forms.some((form) => form.querySelector('input[type="password"]')) ||
        (passwordInputs.length > 0 && textLike.length > 0),
      hasSensitiveFields: /bvn|nin|otp|pin|token|cvv|card.?number|account.?number|userid|user id/.test(fieldText),
      formCount: forms.length,
      hasMetaRefresh: !!meta,
      redirectHost: redirectHost
    };
  }

  function ensureRoot() {
    let root = document.getElementById(ROOT_ID);
    if (root) return root;
    root = document.createElement("div");
    root.id = ROOT_ID;
    (document.documentElement || document.body).appendChild(root);
    return root;
  }

  function hideUi() {
    const root = document.getElementById(ROOT_ID);
    if (root) root.innerHTML = "";
  }

  function renderBanner(result) {
    const root = ensureRoot();
    root.innerHTML =
      '<div class="ns-banner ns-banner-' +
      result.level +
      '" role="status">' +
      '<div class="ns-banner-copy"><strong>' +
      escapeHtml(result.title) +
      "</strong><span>" +
      escapeHtml(result.subtitle) +
      "</span></div>" +
      '<button class="ns-banner-close" type="button" aria-label="Dismiss">Dismiss</button></div>';
    root.querySelector(".ns-banner-close").addEventListener("click", hideUi);
  }

  function renderGate(result, href, mode) {
    const root = ensureRoot();
    const action = mode === "click" ? "Open this link?" : "This page was blocked";
    root.innerHTML =
      '<div class="ns-gate" role="dialog" aria-modal="true">' +
      '<div class="ns-gate-card">' +
      '<p class="ns-gate-kicker">NairaShield</p>' +
      '<p class="ns-gate-level">' +
      escapeHtml(result.level) +
      "</p>" +
      "<h2>" +
      escapeHtml(result.title) +
      "</h2>" +
      "<p>" +
      escapeHtml(result.subtitle) +
      "</p>" +
      '<p class="ns-gate-url">' +
      escapeHtml(href || result.url) +
      "</p>" +
      '<div class="ns-gate-actions">' +
      '<button class="ns-gate-back" type="button">Go back</button>' +
      '<button class="ns-gate-go" type="button">' +
      (mode === "click" ? "Open anyway" : "Continue anyway") +
      "</button></div>" +
      '<button class="ns-gate-report" type="button" id="ns-report">Report this site</button>' +
      "<small>" +
      escapeHtml(action) +
      "</small></div></div>";

    root.querySelector(".ns-gate-back").addEventListener("click", () => {
      hideUi();
    });
    root.querySelector(".ns-gate-go").addEventListener("click", async () => {
      const target = href || result.url;
      await NS.allowOnce(target, 10);
      hideUi();
      if (mode === "click") {
        location.href = target;
      }
    });
    root.querySelector("#ns-report").addEventListener("click", async (event) => {
      const button = event.currentTarget;
      const target = href || result.url;
      const outcome = await NS.reportUrl(target, { title: result.title, reason: "user_report" });
      button.textContent = outcome.ok
        ? outcome.blacklisted
          ? "Reported and blacklisted"
          : "Reported (official domain, not blacklisted)"
        : outcome.error || "Could not report";
      button.disabled = true;
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  async function evaluateLocation() {
    if (!/^https?:/.test(location.href)) return;
    if (await NS.isAllowed(location.href)) return;
    const settings = await NS.getDetectionContext();
    const result = NS.analyzeUrl(location.href, pageSignals(), settings);
    currentResult = result;
    chrome.runtime.sendMessage({ type: "NS_LOG_CHECK", result });

    if (result.level === "danger" && settings.interceptEnabled) {
      renderGate(result, location.href, "page");
      return;
    }
    if (result.level === "caution") {
      renderBanner(result);
    }
  }

  function closestLink(node) {
    if (!node || !node.closest) return null;
    return node.closest("a[href]");
  }

  document.addEventListener(
    "click",
    async (event) => {
      const link = closestLink(event.target);
      if (!link) return;
      const href = link.href;
      if (!/^https?:/.test(href)) return;
      if (href === location.href) return;
      if (await NS.isAllowed(href)) return;

      const settings = await NS.getDetectionContext();
      if (!settings.interceptEnabled) return;
      const result = NS.analyzeUrl(href, {}, settings);
      if (result.level !== "danger" && !(settings.sensitivity === "strict" && result.level === "caution")) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      renderGate(result, href, "click");
    },
    true
  );

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message && message.type === "NS_PAGE_SIGNALS") {
      sendResponse(pageSignals());
      return true;
    }
    if (message && message.type === "NS_CURRENT") {
      sendResponse(currentResult);
      return true;
    }
    return false;
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", evaluateLocation, { once: true });
  } else {
    evaluateLocation();
  }
})();
