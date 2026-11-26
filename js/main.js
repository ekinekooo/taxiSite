"use strict";

/* ========================================
   SÖĞÜT OTOGAR TAKSİ
   Main JavaScript + SEO + Language System
======================================== */

const DEFAULT_LANGUAGE = "tr";
const LANGUAGE_STORAGE_KEY = "sogut-taxi-language";
const SUPPORTED_LANGUAGES = ["tr", "en", "ru"];

let currentLanguage = DEFAULT_LANGUAGE;
let languageRequestId = 0;

/* ========================================
   PAGE SEO CONFIGURATION
======================================== */

const PAGE_SEO = {
  "/": {
    title: "home.pageTitle",
    description: "meta.description",
  },

  "/index.html": {
    title: "home.pageTitle",
    description: "meta.description",
  },

  "/hakkimizda.html": {
    title: "about.pageTitle",
    description: "about.description",
  },

  "/hizmetlerimiz.html": {
    title: "services.pageTitle",
    description: "services.description",
  },

  "/bolgeler.html": {
    title: "regions.pageTitle",
    description: "regions.description",
  },

  "/iletisim.html": {
    title: "contact.pageTitle",
    description: "contact.description",
  },
};

/* ========================================
   TRANSLATION HELPERS
======================================== */

function getLocaleUrl(language) {
  const scriptElement = document.querySelector('script[src*="main.js"]');

  if (!scriptElement) {
    throw new Error("main.js dosyası bulunamadı.");
  }

  const scriptUrl = new URL(scriptElement.src);

  return new URL(`locales/${language}.json`, scriptUrl);
}

async function fetchTranslations(language) {
  const response = await fetch(getLocaleUrl(language));

  if (!response.ok) {
    throw new Error(
      `Dil dosyası yüklenemedi: ${language}.json (${response.status})`,
    );
  }

  return await response.json();
}

function getTranslation(dictionary, key) {
  if (!dictionary || !key) {
    return null;
  }

  return Object.prototype.hasOwnProperty.call(dictionary, key)
    ? dictionary[key]
    : null;
}

/* ========================================
   PAGE DETECTION
======================================== */

function getCurrentPageSEO() {
  let pathname = window.location.pathname.toLowerCase();

  if (pathname.length > 1 && pathname.endsWith("/")) {
    pathname = pathname.slice(0, -1);
  }

  return PAGE_SEO[pathname] || null;
}

/* ========================================
   SEO SYSTEM
======================================== */

function updateMetaContent(selector, value) {
  if (!value) return;

  const element = document.querySelector(selector);

  if (element) {
    element.setAttribute("content", value);
  }
}

function updateSEO(dictionary, language) {
  const pageSEO = getCurrentPageSEO();

  if (!pageSEO) {
    console.warn(
      "Bu sayfa için SEO yapılandırması bulunamadı:",
      window.location.pathname,
    );

    document.documentElement.lang = language;
    return;
  }

  const pageTitle = getTranslation(dictionary, pageSEO.title);

  const pageDescription = getTranslation(dictionary, pageSEO.description);

  /* PAGE TITLE */

  if (pageTitle) {
    document.title = pageTitle;
  }

  /* META DESCRIPTION */

  updateMetaContent('meta[name="description"]', pageDescription);

  /* OPEN GRAPH */

  updateMetaContent('meta[property="og:title"]', pageTitle);

  updateMetaContent('meta[property="og:description"]', pageDescription);

  /* TWITTER */

  updateMetaContent('meta[name="twitter:title"]', pageTitle);

  updateMetaContent('meta[name="twitter:description"]', pageDescription);

  /* HTML LANGUAGE */

  document.documentElement.lang = language;

  /* OPEN GRAPH LOCALE */

  const locales = {
    tr: "tr_TR",
    en: "en_US",
    ru: "ru_RU",
  };

  updateMetaContent('meta[property="og:locale"]', locales[language]);
}

/* ========================================
   APPLY TRANSLATIONS
======================================== */

function applyTranslations(dictionary, language) {
  /* NORMAL TEXT */

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const translation = getTranslation(dictionary, element.dataset.i18n);

    if (translation !== null) {
      element.textContent = translation;
    }
  });

  /* HTML TRANSLATIONS */

  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const translation = getTranslation(dictionary, element.dataset.i18nHtml);

    if (translation !== null) {
      element.innerHTML = translation;
    }
  });

  /* META TRANSLATIONS */

  document.querySelectorAll("[data-i18n-meta]").forEach((element) => {
    const translation = getTranslation(dictionary, element.dataset.i18nMeta);

    if (translation !== null) {
      element.setAttribute("content", translation);
    }
  });

  /* ACCESSIBILITY LABELS */

  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const translation = getTranslation(dictionary, element.dataset.i18nAria);

    if (translation !== null) {
      element.setAttribute("aria-label", translation);
    }
  });

  /* PLACEHOLDER TRANSLATIONS */

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const translation = getTranslation(
      dictionary,
      element.dataset.i18nPlaceholder,
    );

    if (translation !== null) {
      element.setAttribute("placeholder", translation);
    }
  });

  /* SEO */

  updateSEO(dictionary, language);

  /* LANGUAGE BUTTONS */

  updateLanguageButtons(language);

  currentLanguage = language;
}

/* ========================================
   LANGUAGE BUTTONS
======================================== */

function updateLanguageButtons(language) {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    const isActive = button.dataset.lang === language;

    button.classList.toggle("active", isActive);

    button.setAttribute("aria-pressed", String(isActive));
  });
}

/* ========================================
   LANGUAGE SWITCHING
======================================== */

async function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    language = DEFAULT_LANGUAGE;
  }

  /* Prevent older requests from overwriting newer choices */

  const requestId = ++languageRequestId;

  try {
    const dictionary = await fetchTranslations(language);

    if (requestId !== languageRequestId) {
      return;
    }

    applyTranslations(dictionary, language);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn("Dil tercihi kaydedilemedi:", error);
    }
  } catch (error) {
    console.error("Dil yükleme hatası:", error);

    /* Ignore outdated requests */

    if (requestId !== languageRequestId) {
      return;
    }

    /* Load Turkish as fallback */

    if (language !== DEFAULT_LANGUAGE) {
      try {
        const fallbackDictionary = await fetchTranslations(DEFAULT_LANGUAGE);

        if (requestId !== languageRequestId) {
          return;
        }

        applyTranslations(fallbackDictionary, DEFAULT_LANGUAGE);

        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, DEFAULT_LANGUAGE);
        } catch (storageError) {
          console.warn("Varsayılan dil tercihi kaydedilemedi:", storageError);
        }
      } catch (fallbackError) {
        console.error("Varsayılan dil yüklenemedi:", fallbackError);
      }
    }
  }
}

/* ========================================
   SAVED LANGUAGE
======================================== */

function getSavedLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn("Dil tercihi okunamadı:", error);
  }

  return DEFAULT_LANGUAGE;
}

/* ========================================
   LANGUAGE SWITCHER
======================================== */

function initializeLanguageSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedLanguage = button.dataset.lang;

      if (!SUPPORTED_LANGUAGES.includes(selectedLanguage)) {
        return;
      }

      if (selectedLanguage === currentLanguage) {
        return;
      }

      await setLanguage(selectedLanguage);
    });
  });
}

/* ========================================
   MOBILE NAVIGATION
======================================== */

function initializeMobileMenu() {
  const menuToggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".navigation");

  if (!menuToggle || !navigation) {
    return;
  }

  function closeMenu() {
    navigation.classList.remove("open");
    menuToggle.classList.remove("active");

    menuToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMenu() {
    const isOpen = navigation.classList.toggle("open");

    menuToggle.classList.toggle("active", isOpen);

    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  /* Toggle button */

  menuToggle.addEventListener("click", toggleMenu);

  /* Close after navigation */

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  /* Close with Escape */

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  /* Close when clicking outside */

  document.addEventListener("click", (event) => {
    const clickedInsideMenu =
      navigation.contains(event.target) || menuToggle.contains(event.target);

    if (!clickedInsideMenu) {
      closeMenu();
    }
  });

  /* Close when switching to desktop */

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      closeMenu();
    }
  });
}

/* ========================================
   FOOTER YEAR
======================================== */

function initializeFooterYear() {
  const currentYear = new Date().getFullYear();

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = currentYear;
  });
}

/* ========================================
   INITIALIZATION
======================================== */

document.addEventListener("DOMContentLoaded", async () => {
  initializeMobileMenu();

  initializeLanguageSwitcher();

  initializeFooterYear();

  const savedLanguage = getSavedLanguage();

  await setLanguage(savedLanguage);
});
