(function (root) {
  const NS = root.NairaShield || {};
  const SETTINGS_KEY = "ns_settings";
  const RECENT_KEY = "ns_recent";
  const ALLOW_KEY = "ns_allow";
  const THREAT_KEY = "ns_threat";

  NS.DEFAULT_SETTINGS = {
    interceptEnabled: true,
    sensitivity: "balanced",
    disabledBanks: [],
    theme: "dark"
  };

  NS.DEFAULT_THREAT = {
    extraAllowlist: [],
    blacklist: [],
    reports: [],
    feedUrl: "",
    lastFetchAt: 0,
    lastFetchStatus: "",
    lastFetchError: ""
  };

  function withDefaults(raw) {
    return Object.assign({}, NS.DEFAULT_SETTINGS, raw || {});
  }

  function withThreatDefaults(raw) {
    const data = Object.assign({}, NS.DEFAULT_THREAT, raw || {});
    data.extraAllowlist = Array.isArray(data.extraAllowlist) ? data.extraAllowlist : [];
    data.blacklist = Array.isArray(data.blacklist) ? data.blacklist : [];
    data.reports = Array.isArray(data.reports) ? data.reports : [];
    return data;
  }

  function stripHost(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "");
  }

  NS.getSettings = async function getSettings() {
    const data = await chrome.storage.local.get(SETTINGS_KEY);
    return withDefaults(data[SETTINGS_KEY]);
  };

  NS.saveSettings = async function saveSettings(settings) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: withDefaults(settings) });
  };

  NS.getThreatData = async function getThreatData() {
    const data = await chrome.storage.local.get(THREAT_KEY);
    return withThreatDefaults(data[THREAT_KEY]);
  };

  NS.saveThreatData = async function saveThreatData(threat) {
    await chrome.storage.local.set({ [THREAT_KEY]: withThreatDefaults(threat) });
  };

  NS.getDetectionContext = async function getDetectionContext() {
    const settings = await NS.getSettings();
    const threat = await NS.getThreatData();
    return Object.assign({}, settings, {
      blacklist: threat.blacklist,
      extraAllowlist: threat.extraAllowlist
    });
  };

  NS.getRecent = async function getRecent() {
    const data = await chrome.storage.local.get(RECENT_KEY);
    return data[RECENT_KEY] || [];
  };

  NS.addRecent = async function addRecent(entry) {
    const recent = await NS.getRecent();
    const next = [
      entry,
      ...recent.filter((item) => item.host !== entry.host)
    ].slice(0, 12);
    await chrome.storage.local.set({ [RECENT_KEY]: next });
    return next;
  };

  NS.clearRecent = async function clearRecent() {
    await chrome.storage.local.set({ [RECENT_KEY]: [] });
  };

  function sessionStore() {
    return chrome.storage.session || chrome.storage.local;
  }

  NS.getAllowList = async function getAllowList() {
    const data = await sessionStore().get(ALLOW_KEY);
    return data[ALLOW_KEY] || [];
  };

  NS.allowOnce = async function allowOnce(url, minutes) {
    const list = await NS.getAllowList();
    const expires = Date.now() + (minutes || 10) * 60 * 1000;
    list.push({ url, expires });
    await sessionStore().set({ [ALLOW_KEY]: list });
  };

  NS.isAllowed = async function isAllowed(url) {
    const list = await NS.getAllowList();
    const now = Date.now();
    const valid = list.filter((item) => item.expires > now);
    if (valid.length !== list.length) {
      await sessionStore().set({ [ALLOW_KEY]: valid });
    }
    return valid.some((item) => item.url === url);
  };

  NS.isBlacklistedHost = async function isBlacklistedHost(host) {
    const threat = await NS.getThreatData();
    const clean = stripHost(host);
    const decoded = NS.decodeHostname ? NS.decodeHostname(clean) : clean;
    return threat.blacklist.some((item) => {
      const listed = stripHost(item.host || item);
      const listedDecoded = NS.decodeHostname ? NS.decodeHostname(listed) : listed;
      return (
        clean === listed ||
        clean.endsWith("." + listed) ||
        decoded === listed ||
        decoded === listedDecoded ||
        clean === listedDecoded
      );
    });
  };

  NS.reportUrl = async function reportUrl(url, meta) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch (err) {
      return { ok: false, error: "That is not a valid web address." };
    }
    if (!/^https?:$/.test(parsed.protocol)) {
      return { ok: false, error: "Only http and https pages can be reported." };
    }

    const host = stripHost(parsed.hostname);
    const settings = await NS.getSettings();
    const official = NS.findOfficial ? NS.findOfficial(host, settings) : null;
    const threat = await NS.getThreatData();
    const report = {
      url: parsed.href,
      host: host,
      at: Date.now(),
      reason: (meta && meta.reason) || "user_report",
      title: (meta && meta.title) || ""
    };

    threat.reports = [report, ...threat.reports.filter((item) => item.host !== host)].slice(0, 100);

    let blacklisted = false;
    if (!official) {
      blacklisted = true;
      threat.blacklist = [
        {
          host: host,
          url: parsed.href,
          reason: (meta && meta.reason) || "user_report",
          source: "user",
          at: Date.now()
        },
        ...threat.blacklist.filter((item) => stripHost(item.host || item) !== host)
      ];
    }

    await NS.saveThreatData(threat);
    return { ok: true, blacklisted: blacklisted, official: !!official, host: host };
  };

  NS.removeBlacklistHost = async function removeBlacklistHost(host) {
    const clean = stripHost(host);
    const threat = await NS.getThreatData();
    threat.blacklist = threat.blacklist.filter((item) => stripHost(item.host || item) !== clean);
    threat.reports = threat.reports.filter((item) => item.host !== clean);
    await NS.saveThreatData(threat);
  };

  NS.setFeedUrl = async function setFeedUrl(url) {
    const threat = await NS.getThreatData();
    threat.feedUrl = String(url || "").trim();
    await NS.saveThreatData(threat);
    return threat.feedUrl;
  };

  function bundledFeedUrl() {
    try {
      return chrome.runtime.getURL("data/threat-feed.json");
    } catch (err) {
      return "";
    }
  }

  NS.applyFeed = async function applyFeed(feed, source) {
    const threat = await NS.getThreatData();
    const userItems = threat.blacklist.filter((item) => item.source === "user");
    const userHosts = new Set(userItems.map((item) => stripHost(item.host || item)));
    const feedItems = (feed && feed.blacklist ? feed.blacklist : [])
      .map((item) => {
        const host = stripHost(item.host || item);
        if (!host) return null;
        return {
          host: host,
          reason: item.reason || "threat_feed",
          source: "feed",
          at: Date.now()
        };
      })
      .filter(Boolean)
      .filter((item) => !userHosts.has(item.host));

    threat.blacklist = userItems.concat(feedItems);
    threat.extraAllowlist = (feed && feed.allowlist ? feed.allowlist : []).map((item) => {
      if (typeof item === "string") return { name: item, domains: [stripHost(item)] };
      return {
        name: item.name || extraDomainsName(item),
        domains: (item.domains || [item.domain]).filter(Boolean).map(stripHost)
      };
    });
    threat.lastFetchAt = Date.now();
    threat.lastFetchStatus = source || "feed";
    threat.lastFetchError = "";
    await NS.saveThreatData(threat);
    return threat;
  };

  function extraDomainsName(item) {
    if (item && item.domains && item.domains[0]) return item.domains[0];
    return "Listed domain";
  }

  NS.refreshThreatFeed = async function refreshThreatFeed() {
    const threat = await NS.getThreatData();
    const fallback = bundledFeedUrl();
    const targets = [];
    if (threat.feedUrl) targets.push(threat.feedUrl);
    if (fallback) targets.push(fallback);

    let lastError = "No threat-feed URL available.";
    for (let i = 0; i < targets.length; i += 1) {
      const url = targets[i];
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (!response.ok) throw new Error("HTTP " + response.status);
        const feed = await response.json();
        await NS.applyFeed(feed, url === fallback ? "bundled" : "remote");
        return { ok: true, source: url === fallback ? "bundled" : "remote", url: url };
      } catch (err) {
        lastError = (err && err.message) || String(err);
      }
    }

    const failed = await NS.getThreatData();
    failed.lastFetchError = lastError;
    failed.lastFetchStatus = "error";
    await NS.saveThreatData(failed);
    return { ok: false, error: lastError };
  };

  root.NairaShield = NS;
})(typeof self !== "undefined" ? self : window);
