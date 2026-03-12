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

export const FONT_OPTIONS = [
  { label: "Gilroy (Display)", value: "font-display" },
  { label: "DM Sans (Body)", value: "font-sans" },
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
    subheading: "Our investor network is by application only. Complete the form below to be considered for membership.",
  },
  private: {
    heading: "Private Deals",
    subheading: "Level 1 confidential inventory. Available exclusively to pre-screened members under active NDA.",
  },
  brokers: {
    heading: "Submit Off-Market Asset",
    subheading: "Introduce a distressed or off-market vessel to our qualified investor network. Strict confidentiality guaranteed.",
  },
  dealroom: {
    heading: "Deal Room",
    subheading: "Secure workspace for active transactions. Access due diligence documents, financials, and legal instruments.",
  },
};

export const HERO_DEFAULTS: HeroContent = {
  title: "Private Access To Off-Market Yachts",
  subtitle: "Confidential brokerage connecting qualified investors with distressed and off-market Mediterranean yacht opportunities.",
  titleFont: "font-display",
  titleSize: "text-7xl md:text-8xl",
};

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
