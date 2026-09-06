(function (root) {
  const NS = root.NairaShield || {};

  NS.BANKS = [
    {
      id: "access",
      name: "Access Bank",
      aliases: ["access bank", "accessbank", "accessbankplc"],
      domains: ["accessbankplc.com"],
      color: "#F26334"
    },
    {
      id: "gtbank",
      name: "GTBank",
      aliases: ["gtbank", "gtb", "guaranty trust", "gtco"],
      domains: ["gtbank.com", "gtco.ng"],
      color: "#E31B23"
    },
    {
      id: "zenith",
      name: "Zenith Bank",
      aliases: ["zenith bank", "zenithbank"],
      domains: ["zenithbank.com"],
      color: "#ED1C24"
    },
    {
      id: "firstbank",
      name: "First Bank",
      aliases: ["first bank", "firstbank", "firstbanknigeria", "first bank of nigeria"],
      domains: ["firstbanknigeria.com"],
      color: "#0033A1"
    },
    {
      id: "uba",
      name: "UBA",
      aliases: ["uba", "united bank for africa", "ubagroup"],
      domains: ["ubagroup.com"],
      color: "#D21F26"
    },
    {
      id: "fidelity",
      name: "Fidelity Bank",
      aliases: ["fidelity bank", "fidelitybank"],
      domains: ["fidelitybank.ng", "fidelitybankplc.com"],
      color: "#7AC143"
    },
    {
      id: "fcmb",
      name: "FCMB",
      aliases: ["fcmb", "first city monument"],
      domains: ["fcmb.com"],
      color: "#8DC63F"
    },
    {
      id: "sterling",
      name: "Sterling Bank",
      aliases: ["sterling bank", "sterlingbank"],
      domains: ["sterling.ng", "sterlingbankng.com"],
      color: "#E30613"
    },
    {
      id: "wema",
      name: "Wema Bank",
      aliases: ["wema bank", "wemabank", "alat"],
      domains: ["wemabank.com", "alat.ng"],
      color: "#7AC142"
    },
    {
      id: "union",
      name: "Union Bank",
      aliases: ["union bank", "unionbank"],
      domains: ["unionbankng.com"],
      color: "#F7941D"
    },
    {
      id: "polaris",
      name: "Polaris Bank",
      aliases: ["polaris bank", "polarisbank"],
      domains: ["polarisbanklimited.com"],
      color: "#6C2C91"
    },
    {
      id: "stanbic",
      name: "Stanbic IBTC",
      aliases: ["stanbic", "stanbic ibtc", "stanbicibtc"],
      domains: ["stanbicibtcbank.com", "stanbicibtc.com"],
      color: "#0033A1"
    },
    {
      id: "ecobank",
      name: "Ecobank",
      aliases: ["ecobank"],
      domains: ["ecobank.com"],
      color: "#0066B3"
    },
    {
      id: "keystone",
      name: "Keystone Bank",
      aliases: ["keystone bank", "keystonebank"],
      domains: ["keystonebankng.com"],
      color: "#00AEEF"
    },
    {
      id: "unity",
      name: "Unity Bank",
      aliases: ["unity bank", "unitybank"],
      domains: ["unitybankng.com", "unitybank.com"],
      color: "#F7941D"
    },
    {
      id: "jaiz",
      name: "Jaiz Bank",
      aliases: ["jaiz bank", "jaizbank"],
      domains: ["jaizbankplc.com"],
      color: "#00A651"
    },
    {
      id: "providus",
      name: "Providus Bank",
      aliases: ["providus bank", "providusbank"],
      domains: ["providusbank.com"],
      color: "#1B4F9C"
    },
    {
      id: "titan",
      name: "Titan Trust Bank",
      aliases: ["titan trust", "titantrust", "titan bank"],
      domains: ["titantrustbank.com"],
      color: "#C5A572"
    },
    {
      id: "globus",
      name: "Globus Bank",
      aliases: ["globus bank", "globusbank"],
      domains: ["globusbank.com"],
      color: "#0B3D91"
    },
    {
      id: "premiumtrust",
      name: "Premium Trust Bank",
      aliases: ["premium trust", "premiumtrust"],
      domains: ["premiumtrustbank.com"],
      color: "#1A1A1A"
    },
    {
      id: "lotus",
      name: "Lotus Bank",
      aliases: ["lotus bank", "lotusbank"],
      domains: ["lotusbank.com"],
      color: "#00A651"
    },
    {
      id: "suntrust",
      name: "SunTrust Bank",
      aliases: ["suntrust", "suntrust bank"],
      domains: ["suntrustng.com"],
      color: "#FDB913"
    },
    {
      id: "optimus",
      name: "Optimus Bank",
      aliases: ["optimus bank", "optimusbank"],
      domains: ["optimusbank.com", "optimusbank.ng"],
      color: "#111111"
    },
    {
      id: "signature",
      name: "Signature Bank",
      aliases: ["signature bank", "signaturebank"],
      domains: ["signaturebank.ng", "signaturebankng.com"],
      color: "#C5A572"
    },
    {
      id: "parallex",
      name: "Parallex Bank",
      aliases: ["parallex bank", "parallexbank"],
      domains: ["parallexbank.com"],
      color: "#E31B23"
    },
    {
      id: "alternative",
      name: "The Alternative Bank",
      aliases: ["alternative bank", "thealternativebank"],
      domains: ["thealternativebank.com", "thealternativebank.ng"],
      color: "#00A651"
    },
    {
      id: "taj",
      name: "TAJBank",
      aliases: ["tajbank", "taj bank"],
      domains: ["tajbank.com"],
      color: "#00A651"
    },
    {
      id: "alphamorgan",
      name: "Alpha Morgan Bank",
      aliases: ["alpha morgan", "alphamorgan"],
      domains: ["alphamorganbank.com"],
      color: "#0B3D91"
    },
    {
      id: "nova",
      name: "Nova Bank",
      aliases: ["nova bank", "novambl", "nova commercial"],
      domains: ["novambl.com"],
      color: "#6C2C91"
    },
    {
      id: "kuda",
      name: "Kuda",
      aliases: ["kuda", "kuda bank"],
      domains: ["kuda.com"],
      color: "#40196D"
    },
    {
      id: "opay",
      name: "OPay",
      aliases: ["opay"],
      domains: ["opayweb.com", "opay.com"],
      color: "#00C48C"
    },
    {
      id: "palmpay",
      name: "PalmPay",
      aliases: ["palmpay", "palm pay"],
      domains: ["palmpay.com"],
      color: "#6C2C91"
    },
    {
      id: "moniepoint",
      name: "Moniepoint",
      aliases: ["moniepoint", "monie point"],
      domains: ["moniepoint.com"],
      color: "#0B6E4F"
    },
    {
      id: "carbon",
      name: "Carbon",
      aliases: ["carbon", "getcarbon"],
      domains: ["getcarbon.co"],
      color: "#00C389"
    },
    {
      id: "fairmoney",
      name: "FairMoney",
      aliases: ["fairmoney", "fair money"],
      domains: ["fairmoney.io"],
      color: "#FF6A00"
    },
    {
      id: "paystack",
      name: "Paystack",
      aliases: ["paystack"],
      domains: ["paystack.com"],
      color: "#00C3F7"
    },
    {
      id: "flutterwave",
      name: "Flutterwave",
      aliases: ["flutterwave"],
      domains: ["flutterwave.com"],
      color: "#F5A623"
    },
    {
      id: "interswitch",
      name: "Interswitch",
      aliases: ["interswitch"],
      domains: ["interswitch.com", "interswitchgroup.com"],
      color: "#0033A1"
    },
    {
      id: "remita",
      name: "Remita",
      aliases: ["remita"],
      domains: ["remita.net"],
      color: "#E31B23"
    },
    {
      id: "cbn",
      name: "Central Bank of Nigeria",
      aliases: ["cbn", "central bank of nigeria"],
      domains: ["cbn.gov.ng"],
      color: "#008751"
    },
    {
      id: "ndic",
      name: "NDIC",
      aliases: ["ndic", "nigeria deposit insurance"],
      domains: ["ndic.gov.ng"],
      color: "#008751"
    },
    {
      id: "nibss",
      name: "NIBSS",
      aliases: ["nibss", "nigeria inter-bank"],
      domains: ["nibss-plc.com.ng"],
      color: "#0033A1"
    },
    {
      id: "nimc",
      name: "NIMC",
      aliases: ["nimc", "national identity"],
      domains: ["nimc.gov.ng"],
      color: "#008751"
    },
    {
      id: "enaira",
      name: "eNaira",
      aliases: ["enaira"],
      domains: ["enaira.gov.ng"],
      color: "#008751"
    }
  ];

  NS.SCAM_PATH_WORDS = [
    "verify-bvn",
    "update-bvn",
    "bvn-update",
    "bvn-verify",
    "validate-bvn",
    "account-restricted",
    "restricted-account",
    "reactivate",
    "re-activate",
    "verify-account",
    "update-account",
    "confirm-account",
    "secure-login",
    "internet-banking",
    "online-banking",
    "web-login",
    "unlock-account",
    "reset-token",
    "kyc-update",
    "update-kyc",
    "nin-verify",
    "verify-nin"
  ];

  NS.SCAM_CONTENT_WORDS = [
    "bvn",
    "nin",
    "otp",
    "nibss",
    "enaira",
    "account blocked",
    "account restricted",
    "verify your bvn",
    "update your bvn",
    "validate your bvn",
    "confirm your account",
    "internet banking",
    "online banking",
    "reset your token",
    "update your kyc",
    "verify your nin",
    "enter your otp",
    "one-time password",
    "account will be closed"
  ];

  NS.RISKY_TLDS = [
    "xyz",
    "top",
    "club",
    "info",
    "online",
    "site",
    "tk",
    "ml",
    "ga",
    "cf",
    "gq",
    "click",
    "loan",
    "win",
    "rest",
    "icu",
    "cfd",
    "shop",
    "live",
    "fun"
  ];

  root.NairaShield = NS;
})(typeof self !== "undefined" ? self : window);
