"use strict";

/* ========================================
   SÖĞÜT OTOGAR TAKSİ
   Main JavaScript
======================================== */

const DEFAULT_LANGUAGE = "tr";
const LANGUAGE_STORAGE_KEY = "sogut-taxi-language";

let currentLanguage = DEFAULT_LANGUAGE;

/* ========================================
   LANGUAGE SYSTEM
======================================== */

/**
 * Dil dosyasının adresini main.js konumuna
 * göre belirler.
 */
function getLocaleUrl(language) {
  const scriptElement = document.querySelector('script[src*="main.js"]');

  if (!scriptElement) {
    throw new Error("main.js dosyası bulunamadı.");
  }

  const scriptUrl = new URL(scriptElement.src);
  const localeUrl = new URL(`locales/${language}.json`, scriptUrl);

  return localeUrl;
}

/**
 * JSON dil dosyasını yükler.
 */
async function fetchTranslations(language) {
  const url = getLocaleUrl(language);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Dil dosyası yüklenemedi: ${language}.json`);
  }

  return await response.json();
}

/**
 * HTML içerisindeki çevirileri uygular.
 */
function applyTranslations(dictionary, language) {
  // Normal metinler
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.dataset.i18n;

    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      element.textContent = dictionary[key];
    }
  });

  // HTML içeren çeviriler
  // Yalnızca kendi JSON dosyalarımızdaki güvenilir metinler için kullan.
  document.querySelectorAll("[data-i18n-html]").forEach((element) => {
    const key = element.dataset.i18nHtml;

    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      element.innerHTML = dictionary[key];
    }
  });

  // Erişilebilirlik metinleri
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    const key = element.dataset.i18nAria;

    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      element.setAttribute("aria-label", dictionary[key]);
    }
  });

  // Input placeholder metinleri
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.dataset.i18nPlaceholder;

    if (Object.prototype.hasOwnProperty.call(dictionary, key)) {
      element.setAttribute("placeholder", dictionary[key]);
    }
  });

  // Sayfa başlığı
  const titleElement = document.querySelector("title[data-i18n]");

  if (titleElement) {
    const titleKey = titleElement.dataset.i18n;

    if (Object.prototype.hasOwnProperty.call(dictionary, titleKey)) {
      document.title = dictionary[titleKey];
    }
  }

  // Meta description
  const metaDescription = document.querySelector(
    'meta[name="description"][data-i18n]',
  );

  if (metaDescription) {
    const descriptionKey = metaDescription.dataset.i18n;

    if (Object.prototype.hasOwnProperty.call(dictionary, descriptionKey)) {
      metaDescription.setAttribute("content", dictionary[descriptionKey]);
    }
  }

  // HTML dil bilgisini güncelle
  document.documentElement.lang = language;

  // Dil butonlarının durumunu güncelle
  updateLanguageButtons(language);

  currentLanguage = language;
}

/**
 * Dil butonlarının aktif durumunu günceller.
 */
function updateLanguageButtons(language) {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    const isActive = button.dataset.lang === language;

    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

/**
 * Seçilen dili yükler ve uygular.
 */
async function setLanguage(language) {
  if (!["tr", "en", "ru"].includes(language)) {
    language = DEFAULT_LANGUAGE;
  }

  try {
    const dictionary = await fetchTranslations(language);

    applyTranslations(dictionary, language);

    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch (storageError) {
      console.warn("Dil tercihi kaydedilemedi:", storageError);
    }
  } catch (error) {
    console.error("Dil yükleme hatası:", error);

    // İngilizce dosyası yüklenemezse Türkçeye dön.
    if (language !== DEFAULT_LANGUAGE) {
      try {
        const fallbackDictionary = await fetchTranslations(DEFAULT_LANGUAGE);

        applyTranslations(fallbackDictionary, DEFAULT_LANGUAGE);
      } catch (fallbackError) {
        console.error("Varsayılan dil de yüklenemedi:", fallbackError);
      }
    }
  }
}

/**
 * Daha önce kaydedilmiş dili alır.
 */
function getSavedLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);

    if (["tr", "en", "ru"].includes(savedLanguage)) {
      return savedLanguage;
    }
  } catch (error) {
    console.warn("Kayıtlı dil tercihi okunamadı:", error);
  }

  return DEFAULT_LANGUAGE;
}

/**
 * Dil değiştirme butonlarını çalıştırır.
 */
function initializeLanguageSwitcher() {
  document.querySelectorAll(".lang-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedLanguage = button.dataset.lang;

      if (!selectedLanguage || selectedLanguage === currentLanguage) {
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

  menuToggle.addEventListener("click", toggleMenu);

  // Menüdeki bir bağlantıya tıklanınca menüyü kapat.
  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  // Escape tuşuyla menüyü kapat.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  // Ekran büyüdüğünde mobil menüyü kapat.
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
  const yearElements = document.querySelectorAll("[data-year]");

  yearElements.forEach((element) => {
    element.textContent = new Date().getFullYear();
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
