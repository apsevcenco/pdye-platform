export interface PageContent {
  heading: string;
  subheading: string;
}

export interface HeroContent {
  title: string;
  subtitle: string;
  titleFont: string;
  titleSize: string;
}

export interface CustomFont {
  name: string;
  family: string;
}

export const DEFAULT_FONT_OPTIONS = [
  { label: "Gilroy (Display)", value: "'Gilroy', sans-serif" },
  { label: "DM Sans (Body)", value: "'DM Sans', sans-serif" },
];

export const SIZE_OPTIONS = [
  { label: "Small", value: "text-3xl md:text-4xl" },
  { label: "Medium", value: "text-4xl md:text-5xl" },
  { label: "Large", value: "text-5xl md:text-6xl" },
  { label: "Extra Large", value: "text-6xl md:text-7xl" },
  { label: "Huge", value: "text-7xl md:text-8xl" },
];

export const PAGE_DEFAULTS: Record<string, PageContent> = {
  yachts: {
    heading: "Available Inventory",
    subheading: "A curated selection of off-market and distressed vessels currently available through our confidential network.",
  },
  access: {
    heading: "Request Access",
    subheading: "Our private buyer network is by application only. Complete the form below to be considered for membership.",
  },
  brokers: {
    heading: "Submit Off-Market Asset",
    subheading: "Introduce a distressed or off-market vessel to our qualified private buyer network. Strict confidentiality guaranteed.",
  },
  dealroom: {
    heading: "Deal Room",
    subheading: "Secure workspace for active transactions. Access due diligence documents, financials, and legal instruments.",
  },
};

export const HERO_DEFAULTS: HeroContent = {
  title: "Private Access To Off-Market Yachts",
  subtitle: "Confidential brokerage connecting qualified private buyers with distressed and off-market Mediterranean yacht opportunities.",
  titleFont: "'Gilroy', sans-serif",
  titleSize: "text-4xl sm:text-6xl md:text-7xl lg:text-8xl",
};

export function getCustomFonts(): CustomFont[] {
  try {
    return JSON.parse(localStorage.getItem("custom_fonts") || "[]");
  } catch {
    return [];
  }
}

export function saveCustomFonts(fonts: CustomFont[]) {
  localStorage.setItem("custom_fonts", JSON.stringify(fonts));
}

export function getAllFontOptions() {
  const custom = getCustomFonts().map(f => ({ label: `${f.name} (Custom)`, value: f.family }));
  return [...DEFAULT_FONT_OPTIONS, ...custom];
}

export function injectGoogleFont(name: string) {
  const id = `gfont-${name.replace(/\s+/g, "-").toLowerCase()}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  const encoded = name.replace(/\s+/g, "+");
  link.href = `https://fonts.googleapis.com/css2?family=${encoded}:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap`;
  document.head.appendChild(link);
}

export function loadAllCustomFonts() {
  getCustomFonts().forEach(f => injectGoogleFont(f.name));
}

export function getHeroContent(): HeroContent {
  return {
    title: localStorage.getItem("heroTitle") || HERO_DEFAULTS.title,
    subtitle: localStorage.getItem("heroSubtitle") || HERO_DEFAULTS.subtitle,
    titleFont: localStorage.getItem("heroTitleFont") || HERO_DEFAULTS.titleFont,
    titleSize: localStorage.getItem("heroTitleSize") || HERO_DEFAULTS.titleSize,
  };
}

export function saveHeroContent(content: HeroContent) {
  localStorage.setItem("heroTitle", content.title);
  localStorage.setItem("heroSubtitle", content.subtitle);
  localStorage.setItem("heroTitleFont", content.titleFont);
  localStorage.setItem("heroTitleSize", content.titleSize);
}

export function getPageContent(page: string): PageContent {
  const defaults = PAGE_DEFAULTS[page] || { heading: "", subheading: "" };
  return {
    heading: localStorage.getItem(`page_${page}_heading`) || defaults.heading,
    subheading: localStorage.getItem(`page_${page}_subheading`) || defaults.subheading,
  };
}

export function savePageContent(page: string, content: PageContent) {
  localStorage.setItem(`page_${page}_heading`, content.heading);
  localStorage.setItem(`page_${page}_subheading`, content.subheading);
}
