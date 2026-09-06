(function (root) {
  const NS = root.NairaShield || {};

  const MULTI_TLDS = [
    "com.ng",
    "gov.ng",
    "edu.ng",
    "org.ng",
    "net.ng",
    "mil.ng",
    "name.ng",
    "sch.ng",
    "co.uk"
  ];

  const HOMOGLYPHS = {
    "а": "a",
    "е": "e",
    "о": "o",
    "р": "p",
    "с": "c",
    "у": "y",
    "х": "x",
    "і": "i",
    "ѕ": "s",
    "ԁ": "d",
    "ɡ": "g",
    "ԛ": "q",
    "ѵ": "v",
    "ѡ": "w",
    "һ": "h",
    "ј": "j",
    "ӏ": "l",
    "α": "a",
    "ο": "o",
    "ρ": "p",
    "τ": "t",
    "ν": "v",
    "υ": "u",
    "κ": "k"
  };

  function levenshtein(a, b) {
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    const row = new Array(n + 1);
    for (let j = 0; j <= n; j += 1) row[j] = j;
    for (let i = 1; i <= m; i += 1) {
      let prev = i;
      for (let j = 1; j <= n; j += 1) {
        const val = a[i - 1] === b[j - 1] ? row[j - 1] : Math.min(row[j - 1], prev, row[j]) + 1;
        row[j - 1] = prev;
        prev = val;
      }
      row[n] = prev;
    }
    return row[n];
  }

  function stripWww(host) {
    return String(host || "")
      .toLowerCase()
      .replace(/\.$/, "")
      .replace(/^www\./, "");
  }

  function getRootDomain(host) {
    const clean = stripWww(host);
    const parts = clean.split(".").filter(Boolean);
    if (parts.length <= 2) return clean;
    const last2 = parts.slice(-2).join(".");
    if (MULTI_TLDS.includes(last2)) {
      return parts.slice(-3).join(".");
    }
    return last2;
  }

  function foldHomoglyphs(value) {
    return String(value || "")
      .toLowerCase()
      .split("")
      .map((ch) => HOMOGLYPHS[ch] || ch)
      .join("");
  }

  function punycodeDigit(code) {
    if (code >= 48 && code <= 57) return code - 22;
    if (code >= 97 && code <= 122) return code - 97;
    if (code >= 65 && code <= 90) return code - 65;
    return -1;
  }

  function punycodeAdapt(delta, numPoints, firstTime) {
    let next = firstTime ? Math.floor(delta / 700) : delta >> 1;
    next += Math.floor(next / numPoints);
    let k = 0;
    while (next > 455) {
      next = Math.floor(next / 35);
      k += 36;
    }
    return k + Math.floor((36 * next) / (next + 38));
  }

  function punycodeDecodeLabel(input) {
    const encoded = String(input || "").toLowerCase();
    const output = [];
    let n = 128;
    let i = 0;
    let bias = 72;
    const divider = encoded.lastIndexOf("-");
    if (divider >= 0) {
      for (let j = 0; j < divider; j += 1) {
        const code = encoded.charCodeAt(j);
        if (code > 127) return input;
        output.push(code);
      }
    }
    let index = divider >= 0 ? divider + 1 : 0;
    while (index < encoded.length) {
      const oldI = i;
      let w = 1;
      let k = 36;
      while (index < encoded.length) {
        const digit = punycodeDigit(encoded.charCodeAt(index));
        index += 1;
        if (digit < 0) return input;
        i += digit * w;
        const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
        if (digit < t) break;
        w *= 36 - t;
        k += 36;
      }
      const outLen = output.length + 1;
      bias = punycodeAdapt(i - oldI, outLen, oldI === 0);
      n += Math.floor(i / outLen);
      i %= outLen;
      output.splice(i, 0, n);
      i += 1;
    }
    try {
      return String.fromCodePoint.apply(null, output);
    } catch (err) {
      return input;
    }
  }

  function decodeHostname(host) {
    return stripWww(host)
      .split(".")
      .map((label) => {
        if (label.slice(0, 4) === "xn--") {
          return punycodeDecodeLabel(label.slice(4));
        }
        return label;
      })
      .join(".");
  }

  function extraDomains(item) {
    if (!item) return [];
    if (typeof item === "string") return [stripWww(item)];
    if (Array.isArray(item.domains)) return item.domains.map(stripWww);
    if (item.domain) return [stripWww(item.domain)];
    return [];
  }

  function enabledBanks(settings) {
    const disabled = new Set((settings && settings.disabledBanks) || []);
    return (NS.BANKS || []).filter((bank) => !disabled.has(bank.id));
  }

  function findOfficial(host, settings) {
    const root = getRootDomain(host);
    const fromBanks = enabledBanks(settings).find((bank) =>
      bank.domains.some((domain) => root === domain || host === domain || host.endsWith("." + domain))
    );
    if (fromBanks) return fromBanks;

    const extras = (settings && settings.extraAllowlist) || [];
    for (let i = 0; i < extras.length; i += 1) {
      const item = extras[i];
      const domains = extraDomains(item);
      if (domains.some((domain) => root === domain || host === domain || host.endsWith("." + domain))) {
        return {
          id: item.id || "listed",
          name: item.name || domains[0],
          domains: domains
        };
      }
    }
    return null;
  }

  function aliasMatches(hay, alias) {
    const needle = foldHomoglyphs(alias).replace(/\s+/g, "");
    if (needle.length < 3) return false;
    const compact = foldHomoglyphs(hay).replace(/[.\s_-]/g, "");
    if (needle.length <= 3) {
      const tokens = foldHomoglyphs(hay).split(/[^a-z0-9]+/);
      return tokens.includes(needle) || compact.startsWith(needle);
    }
    return compact.includes(needle);
  }

  function brandHits(text, settings) {
    const hits = [];
    enabledBanks(settings).forEach((bank) => {
      bank.aliases.forEach((alias) => {
        if (aliasMatches(text, alias)) {
          hits.push({ bank, alias });
        }
      });
    });
    return hits;
  }

  function closestDomain(root, settings) {
    let best = null;
    enabledBanks(settings).forEach((bank) => {
      bank.domains.forEach((domain) => {
        const dist = levenshtein(root, domain);
        const maxLen = Math.max(root.length, domain.length);
        if (!best || dist < best.dist) {
          best = { bank, domain, dist, maxLen };
        }
      });
    });
    return best;
  }

  function pathLooksScammy(pathname) {
    const path = foldHomoglyphs(pathname || "").replace(/[_\s]/g, "-");
    return (NS.SCAM_PATH_WORDS || []).some((word) => path.includes(word));
  }

  function riskyTld(host) {
    const parts = stripWww(host).split(".");
    const tld = parts[parts.length - 1];
    return (NS.RISKY_TLDS || []).includes(tld);
  }

  function parseUrl(raw) {
    try {
      return new URL(raw);
    } catch (err) {
      return null;
    }
  }

  function blacklistEntry(host, root, list) {
    const items = list || [];
    for (let i = 0; i < items.length; i += 1) {
      const raw = items[i];
      const listed = stripWww(raw.host || raw);
      if (!listed) continue;
      const listedDecoded = decodeHostname(listed);
      if (
        host === listed ||
        root === listed ||
        host.endsWith("." + listed) ||
        host === listedDecoded ||
        root === listedDecoded ||
        host.endsWith("." + listedDecoded)
      ) {
        return raw.host ? raw : { host: listed };
      }
    }
    return null;
  }

  function uniqueBrands(hits) {
    const unique = [];
    (hits || []).forEach((hit) => {
      if (!unique.some((item) => item.bank.id === hit.bank.id)) {
        unique.push(hit);
      }
    });
    return unique;
  }

  function contentKeywordHits(text) {
    const hay = foldHomoglyphs(text || "");
    return (NS.SCAM_CONTENT_WORDS || []).filter((word) => hay.includes(word));
  }

  function raiseLevel(current, next) {
    const rank = { idle: 0, clear: 1, safe: 2, caution: 3, danger: 4 };
    return (rank[next] || 0) >= (rank[current] || 0) ? next : current;
  }

  NS.analyzeUrl = function analyzeUrl(rawUrl, page, settings) {
    const signals = page || {};
    const opts = Object.assign({}, NS.DEFAULT_SETTINGS || {}, settings || {});
    const strict = opts.sensitivity === "strict";
    const parsed = parseUrl(rawUrl);

    if (!parsed || !/^https?:$/.test(parsed.protocol)) {
      return {
        level: "idle",
        title: "Nothing to check",
        subtitle: "Open a website to scan the link.",
        reasons: [],
        bank: null,
        host: "",
        url: rawUrl || ""
      };
    }

    const asciiHost = stripWww(parsed.hostname);
    const unicodeHost = decodeHostname(asciiHost);
    const host = unicodeHost || asciiHost;
    const root = getRootDomain(host);
    const asciiRoot = getRootDomain(asciiHost);
    const foldedHost = foldHomoglyphs(host);
    const foldedRoot = foldHomoglyphs(root);
    const official = findOfficial(asciiHost, opts) || findOfficial(host, opts);
    const reasons = [];
    let level = "safe";
    let title = "This looks safe";
    let subtitle = "No Nigerian bank impersonation found.";
    let bank = official || null;
    const punycodeUsed = asciiHost.indexOf("xn--") !== -1 || unicodeHost !== asciiHost;

    if (official) {
      bank = official;
      title = "Official " + official.name;
      subtitle = "This domain matches the real " + official.name + " website.";
      if (parsed.protocol === "http:") {
        level = "caution";
        title = "Official, but not encrypted";
        subtitle = official.name + " should be opened over HTTPS.";
        reasons.push("This page is using HTTP instead of a secure HTTPS connection.");
      } else {
        reasons.push("This domain is on NairaShield’s official institution list.");
      }
      return {
        level,
        title,
        subtitle,
        reasons,
        bank,
        host,
        url: parsed.href
      };
    }

    const listed = blacklistEntry(asciiHost, asciiRoot, opts.blacklist) || blacklistEntry(host, root, opts.blacklist);
    if (listed) {
      level = "danger";
      title = "Known phishing address";
      subtitle = "This host is on NairaShield’s blacklist.";
      reasons.push("The address was reported or published as a phishing host.");
      if (listed.reason && listed.reason !== "user_report" && listed.reason !== "threat_feed") {
        reasons.push(String(listed.reason));
      }
    }

    if (punycodeUsed || foldedHost !== host) {
      const lookalike = closestDomain(foldedRoot, opts);
      if (lookalike && lookalike.dist <= 2) {
        level = "danger";
        bank = lookalike.bank;
        title = "Lookalike of " + lookalike.bank.name;
        subtitle = "This address uses disguised characters to mimic a real bank.";
        if (punycodeUsed) {
          reasons.push("The domain uses Punycode/IDN characters (" + asciiHost + ").");
        } else {
          reasons.push("The domain uses lookalike characters.");
        }
        reasons.push("Decoded, it is very close to " + lookalike.domain + ".");
      }
    }

    const near = closestDomain(foldedRoot, opts);
    const typoLimit = strict ? 2 : 1;
    if (near && near.dist > 0 && near.dist <= typoLimit && near.maxLen >= 8) {
      level = "danger";
      bank = near.bank;
      title = "Fake " + near.bank.name + " link";
      subtitle = "This domain is a close misspelling of the official site.";
      reasons.push("“" + root + "” is only " + near.dist + " letter(s) from " + near.domain + ".");
    }

    const hostBrands = uniqueBrands(brandHits(host, opts).concat(brandHits(foldedHost, opts)));
    if (hostBrands.length) {
      bank = hostBrands[0].bank;
      const brandName = bank.name;
      if (riskyTld(host) || pathLooksScammy(parsed.pathname) || parsed.protocol === "http:" || strict) {
        level = "danger";
        title = "Not official " + brandName;
        subtitle = "The address mentions " + brandName + " but is not their real website.";
        reasons.push("The hostname uses the " + brandName + " name on an unofficial domain.");
      } else if (level !== "danger") {
        level = "caution";
        title = "Unofficial " + brandName + " page";
        subtitle = "This is not the official " + brandName + " domain.";
        reasons.push("The hostname mentions " + brandName + " but does not match their official site.");
      }
    }

    const pageText = [signals.title, signals.brandText, signals.bodyText].filter(Boolean).join(" ");
    const titleText = foldHomoglyphs(pageText.replace(/[.-]/g, " "));
    const pageBrands = uniqueBrands(brandHits(titleText, opts));
    const keywordHits = contentKeywordHits(pageText + " " + (parsed.pathname || ""));
    const hasLoginForm = !!(signals.hasLoginForm || signals.hasPassword);
    const hasSensitiveFields = !!signals.hasSensitiveFields;
    const redirectHost = stripWww(signals.redirectHost || "");
    const redirectAway = redirectHost && redirectHost !== asciiHost && redirectHost !== host;

    if (pageBrands.length) {
      const claimed = pageBrands[0].bank;
      bank = bank || claimed;
      if (hasLoginForm || hasSensitiveFields || pathLooksScammy(parsed.pathname) || strict) {
        level = "danger";
        title = "Page pretends to be " + claimed.name;
        subtitle = "The page talks like " + claimed.name + ", but the website is not theirs.";
        reasons.push("The page title or branding mentions " + claimed.name + ".");
        if (hasLoginForm) {
          reasons.push("This page asks for a password or login details on an unofficial domain.");
        }
        if (hasSensitiveFields) {
          reasons.push("The form asks for BVN, NIN, OTP, PIN, or similar banking details.");
        }
      } else if (level === "safe") {
        level = "caution";
        title = "Mentions " + claimed.name;
        subtitle = "The page refers to " + claimed.name + " without using their official domain.";
        reasons.push("Page text mentions " + claimed.name + " on an unrelated website.");
      }
    }

    if ((hasLoginForm || hasSensitiveFields) && keywordHits.length && !pageBrands.length && !hostBrands.length) {
      level = raiseLevel(level, keywordHits.length >= 2 || hasSensitiveFields || strict ? "danger" : "caution");
      if (level === "danger") {
        title = "Typical bank-scam page";
        subtitle = "This unofficial page asks for banking details using common scam wording.";
      } else {
        title = "Suspicious banking form";
        subtitle = "This page asks for sensitive details and uses scam-like wording.";
      }
      reasons.push("Page content includes: " + keywordHits.slice(0, 3).join(", ").toUpperCase() + ".");
    } else if (keywordHits.length && (hasLoginForm || hasSensitiveFields)) {
      reasons.push("Page content includes: " + keywordHits.slice(0, 3).join(", ").toUpperCase() + ".");
    }

    if (pathLooksScammy(parsed.pathname) && (hostBrands.length || pageBrands.length || riskyTld(host))) {
      if (level !== "danger") {
        level = "danger";
        title = "Typical bank-scam link";
        subtitle = "This URL uses the same patterns as fake BVN and login pages.";
      }
      reasons.push("The path looks like a fake account, BVN, or login update page.");
    }

    if (redirectAway && (hostBrands.length || pageBrands.length || keywordHits.length)) {
      level = raiseLevel(level, "danger");
      title = title || "Hidden redirect";
      subtitle = "This page tries to send you to another website.";
      reasons.push("A meta-refresh redirect points to " + redirectHost + ".");
    }

    if (parsed.protocol === "http:" && (hostBrands.length || pageBrands.length) && level === "safe") {
      level = "caution";
      title = "Insecure bank-like page";
      subtitle = "This site mentions a bank and is not using HTTPS.";
      reasons.push("The connection is not encrypted.");
    }

    if (level === "safe" && !official) {
      level = "clear";
      title = "No bank impersonation found";
      subtitle = "This page does not look like a fake Nigerian bank or fintech site.";
      reasons.push("The address does not match a known Nigerian bank lookalike.");
    } else if (!reasons.length) {
      reasons.push("NairaShield flagged this link using local bank-domain checks.");
    }

    const uniqueReasons = [];
    reasons.forEach((reason) => {
      if (reason && uniqueReasons.indexOf(reason) === -1) uniqueReasons.push(reason);
    });

    return {
      level,
      title,
      subtitle,
      reasons: uniqueReasons.slice(0, 5),
      bank,
      host,
      url: parsed.href
    };
  };

  NS.getRootDomain = getRootDomain;
  NS.findOfficial = findOfficial;
  NS.decodeHostname = decodeHostname;

  root.NairaShield = NS;
})(typeof self !== "undefined" ? self : window);
