(function () {
  const NS = self.NairaShield;
  const interceptEl = document.getElementById("intercept");
  const sensitivityEl = document.getElementById("sensitivity");
  const themeEl = document.getElementById("theme");
  const banksEl = document.getElementById("banks");
  const feedUrlEl = document.getElementById("feed-url");
  const feedStatusEl = document.getElementById("feed-status");
  const blacklistEl = document.getElementById("blacklist");

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme || "dark";
  }

  function renderBanks(settings) {
    const disabled = new Set(settings.disabledBanks || []);
    banksEl.innerHTML = NS.BANKS.map((bank) => {
      return (
        '<label class="bank">' +
        '<input type="checkbox" data-bank="' +
        bank.id +
        '"' +
        (disabled.has(bank.id) ? "" : " checked") +
        " />" +
        '<i style="background:' +
        bank.color +
        '"></i>' +
        "<div><strong>" +
        bank.name +
        "</strong><small>" +
        bank.domains[0] +
        "</small></div></label>"
      );
    }).join("");
  }

  function formatTime(value) {
    if (!value) return "never";
    try {
      return new Date(value).toLocaleString();
    } catch (err) {
      return "unknown";
    }
  }

  async function renderThreat() {
    const threat = await NS.getThreatData();
    feedUrlEl.value = threat.feedUrl || "";
    if (threat.lastFetchStatus === "error") {
      feedStatusEl.textContent = "Last update failed: " + (threat.lastFetchError || "unknown error");
    } else if (threat.lastFetchAt) {
      feedStatusEl.textContent =
        "Last update: " + formatTime(threat.lastFetchAt) + " (" + (threat.lastFetchStatus || "feed") + "). " +
        threat.blacklist.length + " blacklisted hosts.";
    } else {
      feedStatusEl.textContent = "Lists have not been updated yet.";
    }

    if (!threat.blacklist.length) {
      blacklistEl.innerHTML = '<p class="hint">No blacklisted hosts yet. Report a site from the popup or warning page.</p>';
      return;
    }

    blacklistEl.innerHTML = threat.blacklist
      .map((item) => {
        const host = item.host || item;
        const source = item.source || "feed";
        return (
          '<div class="listed">' +
          "<div><strong>" +
          host +
          "</strong><small>" +
          source +
          (item.reason ? " — " + item.reason : "") +
          "</small></div>" +
          '<button type="button" data-remove="' +
          host +
          '">Remove</button></div>'
        );
      })
      .join("");
  }

  async function persist() {
    const disabledBanks = Array.from(banksEl.querySelectorAll("input[data-bank]"))
      .filter((input) => !input.checked)
      .map((input) => input.dataset.bank);

    const current = await NS.getSettings();
    const settings = Object.assign({}, current, {
      interceptEnabled: interceptEl.checked,
      sensitivity: sensitivityEl.value,
      theme: themeEl.value,
      disabledBanks
    });
    applyTheme(settings.theme);
    await NS.saveSettings(settings);
  }

  async function init() {
    const settings = await NS.getSettings();
    interceptEl.checked = settings.interceptEnabled;
    sensitivityEl.value = settings.sensitivity;
    themeEl.value = settings.theme;
    applyTheme(settings.theme);
    renderBanks(settings);
    await renderThreat();
  }

  interceptEl.addEventListener("change", persist);
  sensitivityEl.addEventListener("change", persist);
  themeEl.addEventListener("change", persist);
  banksEl.addEventListener("change", persist);

  document.getElementById("save-feed").addEventListener("click", async () => {
    await NS.setFeedUrl(feedUrlEl.value);
    feedStatusEl.textContent = "Feed URL saved. Click Update lists now to fetch it.";
  });

  document.getElementById("refresh-feed").addEventListener("click", async () => {
    feedStatusEl.textContent = "Updating…";
    const result = await NS.refreshThreatFeed();
    if (!result.ok) {
      feedStatusEl.textContent = "Update failed: " + (result.error || "unknown error");
      return;
    }
    await renderThreat();
  });

  blacklistEl.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-remove]");
    if (!button) return;
    await NS.removeBlacklistHost(button.getAttribute("data-remove"));
    await renderThreat();
  });

  init();
})();
