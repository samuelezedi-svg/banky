(function () {
  const NS = self.NairaShield;
  const params = new URLSearchParams(location.search);
  const target = params.get("u") || "";

  async function init() {
    const settings = await NS.getDetectionContext();
    document.documentElement.dataset.theme = settings.theme;
    const result = NS.analyzeUrl(target, {}, settings);
    document.getElementById("title").textContent = result.title;
    document.getElementById("subtitle").textContent = result.subtitle;
    document.getElementById("url").textContent = result.url || target;
    document.getElementById("reasons").innerHTML = (result.reasons || [])
      .map((reason) => "<li>" + reason.replace(/</g, "&lt;") + "</li>")
      .join("");
  }

  document.getElementById("back").addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
      return;
    }
    chrome.tabs.getCurrent((tab) => {
      if (tab && tab.id) chrome.tabs.remove(tab.id);
    });
  });

  document.getElementById("continue").addEventListener("click", async () => {
    if (!target) return;
    await NS.allowOnce(target, 10);
    location.replace(target);
  });

  document.getElementById("report").addEventListener("click", async () => {
    if (!target) return;
    const button = document.getElementById("report");
    const status = document.getElementById("report-status");
    button.disabled = true;
    const outcome = await NS.reportUrl(target, { reason: "user_report" });
    if (!outcome.ok) {
      status.textContent = outcome.error || "Could not report this site.";
      button.disabled = false;
      return;
    }
    button.textContent = "Reported";
    status.textContent = outcome.blacklisted
      ? "This host is now on your local blacklist."
      : "Report saved. Official domains are not blacklisted.";
  });

  init();
})();
