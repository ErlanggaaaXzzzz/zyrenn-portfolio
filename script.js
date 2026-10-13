const THEME_KEY = "zyrenn-theme";
const ICON_BASE = "https://cdn.jsdelivr.net/npm/simple-icons@11.14.0/icons/";
const THEME_COLORS = { light: "#ece6d8", dark: "#1b1a18" };
const DESKTOP_QUERY = "(min-width: 860px)";
const TOAST_DURATION_MS = 2600;

const SKILLS = [
  { name: "JavaScript", level: 95, icon: "javascript" },
  { name: "Node.js", level: 98, icon: "nodedotjs" },
  { name: "Python", level: 90, icon: "python" },
  { name: "CSS", level: 87, icon: "css3" },
  { name: "HTML", level: 90, icon: "html5" }
];

const root = document.documentElement;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let toastTimer = null;

function readStoredTheme() {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === "dark" || value === "light" ? value : null;
  } catch (error) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (error) {
    showToast("Pilihan tema tidak dapat disimpan di browser ini.", "error");
  }
}

function applyTheme(theme) {
  root.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.setAttribute("aria-label", theme === "dark" ? "Beralih ke mode terang" : "Beralih ke mode gelap");
  }
}

function initTheme() {
  const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
  applyTheme(root.dataset.theme === "dark" ? "dark" : "light");

  const toggle = document.getElementById("theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(next);
      storeTheme(next);
    });
  }

  darkQuery.addEventListener("change", (event) => {
    if (!readStoredTheme()) applyTheme(event.matches ? "dark" : "light");
  });
}

function initIcons() {
  document.querySelectorAll("[data-icon]").forEach((element) => {
    element.style.setProperty("--i", `url("${ICON_BASE}${element.dataset.icon}.svg")`);
  });
}

function isValidSkill(skill) {
  return typeof skill.name === "string" && Number.isFinite(skill.level) && skill.level >= 0 && skill.level <= 100;
}

function createSkillRow(skill) {
  const row = document.createElement("li");
  row.className = "skill panel";

  const icon = document.createElement("i");
  icon.className = "ico skill-icon";
  icon.dataset.icon = skill.icon;
  icon.setAttribute("aria-hidden", "true");

  const name = document.createElement("span");
  name.className = "skill-name";
  name.textContent = skill.name;

  const percent = document.createElement("span");
  percent.className = "skill-pct";
  percent.textContent = `${skill.level}%`;

  const bar = document.createElement("div");
  bar.className = "bar";
  bar.setAttribute("role", "progressbar");
  bar.setAttribute("aria-label", skill.name);
  bar.setAttribute("aria-valuemin", "0");
  bar.setAttribute("aria-valuemax", "100");
  bar.setAttribute("aria-valuenow", String(skill.level));
  const fill = document.createElement("span");
  fill.className = "bar-fill";
  fill.style.setProperty("--w", `${skill.level}%`);
  bar.append(fill);

  row.append(icon, percent, name, bar);
  return row;
}

function renderSkills() {
  const list = document.getElementById("skill-list");
  if (!list) return;
  SKILLS.filter(isValidSkill).forEach((skill) => list.append(createSkillRow(skill)));
}

function revealOnce(elements) {
  if (!("IntersectionObserver" in window) || reducedMotion.matches) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.15 });
  elements.forEach((element) => observer.observe(element));
}

function initReveal() {
  const targets = Array.from(document.querySelectorAll(".reveal"));
  const skillList = document.getElementById("skill-list");
  if (skillList) targets.push(skillList);
  revealOnce(targets);
}

function initMenu() {
  const button = document.getElementById("menu-toggle");
  const nav = document.getElementById("site-nav");
  if (!button || !nav) return;

  const setOpen = (open) => {
    nav.classList.toggle("open", open);
    button.setAttribute("aria-expanded", String(open));
    button.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
  };

  button.addEventListener("click", () => setOpen(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && nav.classList.contains("open")) {
      setOpen(false);
      button.focus();
    }
  });
  window.matchMedia(DESKTOP_QUERY).addEventListener("change", (event) => {
    if (event.matches) setOpen(false);
  });
}

function initActiveNav() {
  const links = Array.from(document.querySelectorAll("#site-nav a"));
  const sections = links.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => {
        const active = link.getAttribute("href") === `#${entry.target.id}`;
        link.classList.toggle("active", active);
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach((section) => observer.observe(section));
}

function showToast(message, type) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("error", type === "error");
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), TOAST_DURATION_MS);
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.warn("Clipboard API gagal, mencoba metode cadangan.", error);
    }
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  area.remove();
  return copied;
}

function initCopyButton() {
  const button = document.getElementById("copy-package");
  if (!button) return;
  button.addEventListener("click", async () => {
    const copied = await copyText(button.dataset.copy);
    if (copied) showToast(`Tersalin: ${button.dataset.copy}`, "success");
    else showToast("Gagal menyalin. Salin nama package secara manual.", "error");
  });
}

function initBannerFallback() {
  const image = document.getElementById("banner-image");
  const frame = document.getElementById("banner-frame");
  if (!image || !frame) return;
  const markBroken = () => frame.classList.add("is-broken");
  image.addEventListener("error", markBroken);
  if (image.complete && image.naturalWidth === 0) markBroken();
}

function initFooterYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}

function init() {
  initTheme();
  renderSkills();
  initIcons();
  initReveal();
  initMenu();
  initActiveNav();
  initCopyButton();
  initBannerFallback();
  initFooterYear();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
