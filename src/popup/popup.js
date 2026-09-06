(function () {
  const NS = self.NairaShield;
  const verdictEl = document.getElementById("verdict");
  const shieldEl = document.getElementById("shield");
  const kickerEl = document.getElementById("kicker");
  const titleEl = document.getElementById("title");
  const subtitleEl = document.getElementById("subtitle");
  const urlEl = document.getElementById("url");
  const reasonsEl = document.getElementById("reasons");
  const recentEl = document.getElementById("recent");

  const ICONS = {
    safe: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6.2v5.3c0 4.4 2.9 7.5 7 8.5 4.1-1 7-4.1 7-8.5V6.2L12 3Z" stroke="#1FA971" stroke-width="1.7"/><path d="m8.6 12.1 2.2 2.2 4.6-4.8" stroke="#1FA971" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    caution: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6.2v5.3c0 4.4 2.9 7.5 7 8.5 4.1-1 7-4.1 7-8.5V6.2L12 3Z" stroke="#F5B942" stroke-width="1.7"/><path d="M12 8.4v5.1" stroke="#F5B942" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="15.8" r="0.9" fill="#F5B942"/></svg>',
    danger: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6.2v5.3c0 4.4 2.9 7.5 7 8.5 4.1-1 7-4.1 7-8.5V6.2L12 3Z" stroke="#FF5A57" stroke-width="1.7"/><path d="m9.4 9.4 5.2 5.2M14.6 9.4l-5.2 5.2" stroke="#FF5A57" stroke-width="1.8" stroke-linecap="round"/></svg>',
    idle: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6.2v5.3c0 4.4 2.9 7.5 7 8.5 4.1-1 7-4.1 7-8.5V6.2L12 3Z" stroke="#E0B44A" stroke-width="1.7"/></svg>',
    clear: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 3 5 6.2v5.3c0 4.4 2.9 7.5 7 8.5 4.1-1 7-4.1 7-8.5V6.2L12 3Z" stroke="#8B93A7" stroke-width="1.7"/></svg>'
  };

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme || "dark";
  }

  function renderVerdict(result) {
    const level = result.level || "idle";
    verdictEl.dataset.level = level;
    shieldEl.innerHTML = ICONS[level] || ICONS.idle;
    kickerEl.textContent =
      level === "safe"
        ? "Trusted domain"
        : level === "caution"
          ? "Check this carefully"
          : level === "danger"
            ? "Do not enter details"
            : level === "clear"
              ? "No bank threat"
              : "Ready";
    titleEl.textContent = result.title;
    subtitleEl.textContent = result.subtitle;
    urlEl.textContent = result.host || "";
    reasonsEl.innerHTML = (result.reasons || []).map((reason) => "<li>" + escapeHtml(reason) + "</li>").join("");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function renderRecent(items) {
    if (!items.length) {
      recentEl.innerHTML = '<p class="empty">No checks yet. Browse a bank site or a suspicious link.</p>';
      return;
    }
    recentEl.innerHTML = items
      .map((item) => {
        return (
          '<div class="recent-item"><p>' +
          escapeHtml(item.host) +
          '</p><span class="ns-chip ns-chip-' +
          item.level +
          '">' +
          item.level +
          "</span></div>"
        );
      })
      .join("");
  }

  async function init() {
    const settings = await NS.getDetectionContext();
    applyTheme(settings.theme);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab && tab.url;
    let page = { title: tab && tab.title };

    if (tab && tab.id && /^https?:/.test(url || "")) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "NS_PAGE_SIGNALS" });
        if (response) page = Object.assign(page, response);
      } catch (err) {
        // Content script may be missing on restricted pages.
      }
    }

    const result = NS.analyzeUrl(url, page, settings);
    renderVerdict(result);
    bindReport(url, result);

    if (result.host && result.level !== "idle" && result.level !== "clear") {
      await NS.addRecent({
        host: result.host,
        level: result.level,
        title: result.title,
        at: Date.now()
      });
    }

    renderRecent(await NS.getRecent());
  }

  document.getElementById("clear-recent").addEventListener("click", async () => {
    await NS.clearRecent();
    renderRecent([]);
  });

  function bindReport(url, result) {
    const button = document.getElementById("report");
    const status = document.getElementById("report-status");
    const canReport = !!(url && /^https?:/.test(url) && result.level !== "idle");
    button.disabled = !canReport;
    if (!canReport) {
      status.textContent = "";
      return;
    }
    NS.isBlacklistedHost(result.host || url).then((listed) => {
      if (listed) {
        button.textContent = "Already on your blacklist";
        button.disabled = true;
      }
    });
    button.onclick = async () => {
      button.disabled = true;
      const outcome = await NS.reportUrl(url, { title: result.title, reason: "user_report" });
      if (!outcome.ok) {
        status.textContent = outcome.error || "Could not report this site.";
        button.disabled = false;
        return;
      }
      button.textContent = "Reported";
      status.textContent = outcome.blacklisted
        ? "Saved to your local blacklist. NairaShield will block this host."
        : "Saved as a report. Official bank domains are not blacklisted.";
    };
  }

  init();
})();
