export interface SiteTextBlock {
  key: string;
  label: string;
  type: "input" | "textarea";
  rows?: number;
}

export interface SiteSection {
  id: string;
  label: string;
  fields: SiteTextBlock[];
}

export interface SitePage {
  id: string;
  label: string;
  sections: SiteSection[];
}

export const SITE_PAGES: SitePage[] = [
  {
    id: "home",
    label: "Home",
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "badge", label: "Badge Text", type: "input" },
          { key: "cta1", label: "CTA Button 1", type: "input" },
          { key: "cta2", label: "CTA Button 2", type: "input" },
        ],
      },
      {
        id: "expertise",
        label: "Expertise Section",
        fields: [
          { key: "title", label: "Section Title", type: "input" },
          { key: "item1_title", label: "Card 1 — Title", type: "input" },
          { key: "item1_desc", label: "Card 1 — Description", type: "textarea", rows: 2 },
          { key: "item2_title", label: "Card 2 — Title", type: "input" },
          { key: "item2_desc", label: "Card 2 — Description", type: "textarea", rows: 2 },
          { key: "item3_title", label: "Card 3 — Title", type: "input" },
          { key: "item3_desc", label: "Card 3 — Description", type: "textarea", rows: 2 },
          { key: "item4_title", label: "Card 4 — Title", type: "input" },
          { key: "item4_desc", label: "Card 4 — Description", type: "textarea", rows: 2 },
        ],
      },
      {
        id: "valuation_cta",
        label: "Valuation CTA Block",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 3 },
          { key: "feature1", label: "Feature 1", type: "input" },
          { key: "feature2", label: "Feature 2", type: "input" },
          { key: "feature3", label: "Feature 3", type: "input" },
          { key: "button", label: "Button Text", type: "input" },
        ],
      },
      {
        id: "featured",
        label: "Featured Opportunities",
        fields: [
          { key: "title", label: "Section Title", type: "input" },
          { key: "link", label: "Link Text", type: "input" },
        ],
      },
    ],
  },
  {
    id: "owners",
    label: "Boat Owners",
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title (HTML allowed)", type: "input" },
          { key: "title_accent", label: "Title Accent Word", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 3 },
          { key: "stat1_val", label: "Stat 1 — Value", type: "input" },
          { key: "stat1_label", label: "Stat 1 — Label", type: "input" },
          { key: "stat2_val", label: "Stat 2 — Value", type: "input" },
          { key: "stat2_label", label: "Stat 2 — Label", type: "input" },
          { key: "stat3_val", label: "Stat 3 — Value", type: "input" },
          { key: "stat3_label", label: "Stat 3 — Label", type: "input" },
        ],
      },
      {
        id: "benefits",
        label: "Benefits Section",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Section Title", type: "input" },
          { key: "item1_title", label: "Benefit 1 — Title", type: "input" },
          { key: "item1_desc", label: "Benefit 1 — Description", type: "textarea", rows: 2 },
          { key: "item2_title", label: "Benefit 2 — Title", type: "input" },
          { key: "item2_desc", label: "Benefit 2 — Description", type: "textarea", rows: 2 },
          { key: "item3_title", label: "Benefit 3 — Title", type: "input" },
          { key: "item3_desc", label: "Benefit 3 — Description", type: "textarea", rows: 2 },
          { key: "item4_title", label: "Benefit 4 — Title", type: "input" },
          { key: "item4_desc", label: "Benefit 4 — Description", type: "textarea", rows: 2 },
        ],
      },
      {
        id: "process",
        label: "Process Section",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title", type: "input" },
          { key: "step1", label: "Step 1", type: "input" },
          { key: "step2", label: "Step 2", type: "input" },
          { key: "step3", label: "Step 3", type: "input" },
          { key: "step4", label: "Step 4", type: "input" },
        ],
      },
      {
        id: "form",
        label: "Submission Form",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title", type: "input" },
          { key: "desc", label: "Description", type: "input" },
          { key: "submit_btn", label: "Submit Button", type: "input" },
          { key: "disclaimer", label: "Disclaimer", type: "input" },
          { key: "success_title", label: "Success Title", type: "input" },
          { key: "success_desc", label: "Success Description", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  {
    id: "brokers",
    label: "Brokers",
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title (HTML)", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 3 },
        ],
      },
      {
        id: "benefits",
        label: "Benefits Section",
        fields: [
          { key: "title", label: "Section Title", type: "input" },
          { key: "subtitle", label: "Subtitle", type: "input" },
          { key: "item1_title", label: "Benefit 1 — Title", type: "input" },
          { key: "item1_desc", label: "Benefit 1 — Description", type: "textarea", rows: 2 },
          { key: "item2_title", label: "Benefit 2 — Title", type: "input" },
          { key: "item2_desc", label: "Benefit 2 — Description", type: "textarea", rows: 2 },
          { key: "item3_title", label: "Benefit 3 — Title", type: "input" },
          { key: "item3_desc", label: "Benefit 3 — Description", type: "textarea", rows: 2 },
          { key: "item4_title", label: "Benefit 4 — Title", type: "input" },
          { key: "item4_desc", label: "Benefit 4 — Description", type: "textarea", rows: 2 },
        ],
      },
      {
        id: "process",
        label: "Process Section",
        fields: [
          { key: "title", label: "Title", type: "input" },
          { key: "step1", label: "Step 1", type: "input" },
          { key: "step2", label: "Step 2", type: "input" },
          { key: "step3", label: "Step 3", type: "input" },
          { key: "step4", label: "Step 4", type: "input" },
        ],
      },
      {
        id: "form",
        label: "Application Form",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title", type: "input" },
          { key: "desc", label: "Description", type: "input" },
          { key: "submit_btn", label: "Submit Button", type: "input" },
          { key: "disclaimer", label: "Disclaimer", type: "input" },
          { key: "success_title", label: "Success Title", type: "input" },
          { key: "success_desc", label: "Success Description", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  {
    id: "buyers",
    label: "Private Buyers",
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title (HTML)", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 3 },
          { key: "badge1", label: "Badge 1", type: "input" },
          { key: "badge2", label: "Badge 2", type: "input" },
          { key: "badge3", label: "Badge 3", type: "input" },
          { key: "badge4", label: "Badge 4", type: "input" },
        ],
      },
      {
        id: "stats",
        label: "Stats Bar",
        fields: [
          { key: "stat1_val", label: "Stat 1 — Value", type: "input" },
          { key: "stat1_label", label: "Stat 1 — Label", type: "input" },
          { key: "stat2_val", label: "Stat 2 — Value", type: "input" },
          { key: "stat2_label", label: "Stat 2 — Label", type: "input" },
          { key: "stat3_val", label: "Stat 3 — Value", type: "input" },
          { key: "stat3_label", label: "Stat 3 — Label", type: "input" },
          { key: "stat4_val", label: "Stat 4 — Value", type: "input" },
          { key: "stat4_label", label: "Stat 4 — Label", type: "input" },
        ],
      },
      {
        id: "benefits",
        label: "Benefits Section",
        fields: [
          { key: "title", label: "Section Title", type: "input" },
          { key: "subtitle", label: "Subtitle", type: "input" },
          { key: "item1_title", label: "Benefit 1 — Title", type: "input" },
          { key: "item1_desc", label: "Benefit 1 — Description", type: "textarea", rows: 2 },
          { key: "item2_title", label: "Benefit 2 — Title", type: "input" },
          { key: "item2_desc", label: "Benefit 2 — Description", type: "textarea", rows: 2 },
          { key: "item3_title", label: "Benefit 3 — Title", type: "input" },
          { key: "item3_desc", label: "Benefit 3 — Description", type: "textarea", rows: 2 },
          { key: "item4_title", label: "Benefit 4 — Title", type: "input" },
          { key: "item4_desc", label: "Benefit 4 — Description", type: "textarea", rows: 2 },
        ],
      },
      {
        id: "form",
        label: "Application Form",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title", type: "input" },
          { key: "desc", label: "Description", type: "input" },
          { key: "submit_btn", label: "Submit Button", type: "input" },
          { key: "disclaimer", label: "Disclaimer", type: "input" },
          { key: "success_title", label: "Success Title", type: "input" },
          { key: "success_desc", label: "Success Description", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
  {
    id: "access",
    label: "Request Access",
    sections: [
      {
        id: "investor",
        label: "Private Buyer Tab",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "heading", label: "Heading (HTML)", type: "input" },
          { key: "sub", label: "Subtitle", type: "textarea", rows: 2 },
          { key: "note", label: "Note", type: "input" },
          { key: "stat1_num", label: "Stat 1 — Value", type: "input" },
          { key: "stat1_label", label: "Stat 1 — Label", type: "input" },
          { key: "stat2_num", label: "Stat 2 — Value", type: "input" },
          { key: "stat2_label", label: "Stat 2 — Label", type: "input" },
          { key: "stat3_num", label: "Stat 3 — Value", type: "input" },
          { key: "stat3_label", label: "Stat 3 — Label", type: "input" },
        ],
      },
      {
        id: "broker",
        label: "Broker Tab",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "heading", label: "Heading (HTML)", type: "input" },
          { key: "sub", label: "Subtitle", type: "textarea", rows: 2 },
          { key: "note", label: "Note", type: "input" },
          { key: "stat1_num", label: "Stat 1 — Value", type: "input" },
          { key: "stat1_label", label: "Stat 1 — Label", type: "input" },
          { key: "stat2_num", label: "Stat 2 — Value", type: "input" },
          { key: "stat2_label", label: "Stat 2 — Label", type: "input" },
          { key: "stat3_num", label: "Stat 3 — Value", type: "input" },
          { key: "stat3_label", label: "Stat 3 — Label", type: "input" },
        ],
      },
      {
        id: "owner",
        label: "Yacht Owner Tab",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "heading", label: "Heading (HTML)", type: "input" },
          { key: "sub", label: "Subtitle", type: "textarea", rows: 2 },
          { key: "note", label: "Note", type: "input" },
          { key: "stat1_num", label: "Stat 1 — Value", type: "input" },
          { key: "stat1_label", label: "Stat 1 — Label", type: "input" },
          { key: "stat2_num", label: "Stat 2 — Value", type: "input" },
          { key: "stat2_label", label: "Stat 2 — Label", type: "input" },
          { key: "stat3_num", label: "Stat 3 — Value", type: "input" },
          { key: "stat3_label", label: "Stat 3 — Label", type: "input" },
        ],
      },
      {
        id: "common",
        label: "Common Texts",
        fields: [
          { key: "success_title", label: "Success Title", type: "input" },
          { key: "success_desc", label: "Success Description", type: "textarea", rows: 2 },
          { key: "success_link", label: "Submit Another Link Text", type: "input" },
          { key: "disclaimer", label: "Disclaimer", type: "input" },
          { key: "submit_btn", label: "Submit Button", type: "input" },
        ],
      },
    ],
  },
  {
    id: "valuation",
    label: "Valuation",
    sections: [
      {
        id: "hero",
        label: "Hero Section",
        fields: [
          { key: "tag", label: "Tag", type: "input" },
          { key: "title", label: "Title", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 3 },
        ],
      },
      {
        id: "form",
        label: "Form & Results",
        fields: [
          { key: "submit_btn", label: "Submit Button", type: "input" },
          { key: "loading_text", label: "Loading Text", type: "input" },
          { key: "loading_desc", label: "Loading Description", type: "textarea", rows: 2 },
          { key: "result_label", label: "Result Label", type: "input" },
          { key: "comparables_title", label: "Comparables Title", type: "input" },
          { key: "new_btn", label: "New Valuation Button", type: "input" },
        ],
      },
    ],
  },
  {
    id: "yachts",
    label: "Yachts Catalog",
    sections: [
      {
        id: "header",
        label: "Page Header",
        fields: [
          { key: "heading", label: "Heading", type: "input" },
          { key: "subheading", label: "Subtitle", type: "textarea", rows: 2 },
        ],
      },
      {
        id: "filters",
        label: "Filter Labels",
        fields: [
          { key: "all", label: "All Filter", type: "input" },
          { key: "motor", label: "Motor Yachts Filter", type: "input" },
          { key: "sailing", label: "Sailing Yachts Filter", type: "input" },
          { key: "distressed", label: "Distressed Deals Filter", type: "input" },
        ],
      },
      {
        id: "confidentiality",
        label: "Confidentiality Notice",
        fields: [
          { key: "text", label: "Notice Text", type: "textarea", rows: 2 },
        ],
      },
      {
        id: "cta",
        label: "CTA Section",
        fields: [
          { key: "title", label: "Title", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 2 },
          { key: "button", label: "Button Text", type: "input" },
        ],
      },
    ],
  },
  {
    id: "footer",
    label: "Footer",
    sections: [
      {
        id: "brand",
        label: "Brand",
        fields: [
          { key: "name", label: "Brand Name", type: "input" },
          { key: "desc", label: "Description", type: "textarea", rows: 3 },
        ],
      },
      {
        id: "contact",
        label: "Contact Us Block",
        fields: [
          { key: "tag", label: "Eyebrow / Tag", type: "input" },
          { key: "title", label: "Block Title", type: "input" },
          { key: "intro", label: "Intro Text", type: "textarea", rows: 2 },
          { key: "email", label: "Email", type: "input" },
          { key: "phone", label: "Phone", type: "input" },
          { key: "whatsapp", label: "WhatsApp (number or full URL)", type: "input" },
          { key: "address", label: "Address", type: "textarea", rows: 2 },
          { key: "hours", label: "Office Hours", type: "input" },
        ],
      },
      {
        id: "legal",
        label: "Legal / Bottom Bar",
        fields: [
          { key: "copyright", label: "Copyright Text", type: "input" },
          { key: "privacy", label: "Privacy Policy Link", type: "input" },
          { key: "terms", label: "Terms of Service Link", type: "input" },
          { key: "confidentiality", label: "Confidentiality Agreement Link", type: "input" },
        ],
      },
    ],
  },
  {
    id: "dealroom",
    label: "Deal Room",
    sections: [
      {
        id: "header",
        label: "Page Header",
        fields: [
          { key: "heading", label: "Heading", type: "input" },
          { key: "subheading", label: "Subtitle", type: "textarea", rows: 2 },
        ],
      },
    ],
  },
];

export const SITE_DEFAULTS: Record<string, Record<string, Record<string, string>>> = {
  home: {
    hero: {
      badge: "By Invitation",
      cta1: "Request Access",
      cta2: "Submit a Vessel",
    },
    expertise: {
      title: "Our Expertise",
      item1_title: "Off-Market Workspace",
      item1_desc: "A confidential workspace where owners, brokers and private buyers transact outside public listing platforms. Identities masked, NDA-protected, success fee only.",
      item2_title: "Private Buyer Network",
      item2_desc: "Vetted database of UHNW individuals and syndicates ready to deploy capital.",
      item3_title: "Deal Structuring",
      item3_desc: "Complex transaction management including leasing, tax, and registration.",
      item4_title: "Asset Recovery",
      item4_desc: "Working with institutions on rapid disposition of marine assets.",
    },
    valuation_cta: {
      tag: "Free AI Tool",
      title: "Estimate Your Yacht's Value",
      desc: "Independent AI valuation with a reasoned breakdown, based on current market data. The more vessel details you provide, the more precise the estimate.",
      feature1: "No registration required",
      feature2: "Reasoned, source-aware estimate",
      feature3: "Accuracy grows with detail",
      button: "Get Free Valuation",
    },
    featured: {
      title: "Featured Opportunities",
      link: "View All Inventory",
    },
  },
  owners: {
    hero: {
      tag: "Owner Services",
      title: "Sell Your Vessel.",
      title_accent: "Privately.",
      desc: "PDYE connects yacht owners with a curated network of qualified buyers — entirely off-market. No public listings. No unsolicited calls. Only discreet, structured introductions.",
      stat1_val: "Off-Market by Default",
      stat1_label: "Your vessel is never published or syndicated.",
      stat2_val: "Independent Valuation",
      stat2_label: "AI-assisted estimate before any commitment.",
      stat3_val: "Two-Stage NDA",
      stat3_label: "Buyer identity is masked until both sides sign.",
    },
    benefits: {
      tag: "Why Choose PDYE",
      title: "The Off-Market Advantage",
      item1_title: "Full Confidentiality",
      item1_desc: "Your vessel is listed off-market. Vessel name, ownership and price remain masked inside the platform until both sides have signed an NDA.",
      item2_title: "Curated Buyer Network",
      item2_desc: "Reach private buyers, family offices and distressed-asset specialists already cleared for our deal rooms. Each is admitted by application only.",
      item3_title: "Independent Valuation",
      item3_desc: "Our AI-assisted analysis benchmarks your vessel against current global market data and returns an independent estimate with a reasoned breakdown — used as the basis for negotiation.",
      item4_title: "Success Fee Only",
      item4_desc: "No upfront listing fee and no exclusivity. The Success Fee Agreement is signed before any buyer introduction and applies only when your vessel is sold through PDYE. Specialist legal counsel and escrow are arranged through trusted partners on a per-deal basis.",
    },
    process: {
      tag: "The Process",
      title: "Simple. Discreet. Effective.",
      step1: "Submit your vessel details confidentially",
      step2: "Receive a free, independent valuation",
      step3: "We introduce your listing to matched buyers under NDA",
      step4: "Close discreetly, off-market",
    },
    form: {
      tag: "Confidential Submission",
      title: "List Your Vessel",
      desc: "All submissions are treated as confidential. We respond personally to every enquiry.",
      submit_btn: "Submit Confidentially",
      disclaimer: "All enquiries handled with absolute discretion. No fees apply until your vessel is sold through the platform.",
      success_title: "Submission Received",
      success_desc: "We will review your vessel details and respond personally with a confidential market assessment.",
    },
  },
  brokers: {
    hero: {
      tag: "A Tool For Brokers",
      title: "An Off-Market Workspace<br />For <span class=\"text-primary\">Brokers</span>",
      desc: "PDYE is not your competitor and not your partner. It is a confidential workspace you can use to source, list and close off-market yachts — on your own clients, on your own terms. You only pay when a deal closes through the platform.",
    },
    benefits: {
      title: "Why Brokers Use PDYE",
      subtitle: "A neutral, off-market tool — not a brokerage, not a competitor",
      item1_title: "Not a Competitor",
      item1_desc: "PDYE does not represent buyers or sellers itself. We do not list publicly, we do not solicit your clients and we do not interfere in your relationships. The platform is infrastructure — you remain the broker.",
      item2_title: "Off-Market Inventory & Demand",
      item2_desc: "Use the platform to publish your distressed and off-market listings, or to source for your buyers. Inventory and demand stay inside the network — never on public listing platforms.",
      item3_title: "Identity Masking & NDA",
      item3_desc: "Vessel and counterparty identities are masked until both sides sign the deal-specific NDA inside the Deal Room. Your client only meets the other side once the paperwork protects them — and you.",
      item4_title: "Success Fee Only",
      item4_desc: "No subscription, no listing fee, no exclusivity. A Success Fee Agreement is signed inside the platform before any introduction is made and applies only when a deal closes through PDYE. Terms are transparent and agreed in writing up front.",
    },
    process: {
      title: "How It Works",
      step1: "Submit your broker profile",
      step2: "Sign the Success Fee Agreement inside the platform",
      step3: "Publish off-market listings or browse matched demand",
      step4: "Close inside the Deal Room — fee applies only on completion",
    },
    form: {
      tag: "Get Access",
      title: "Broker Access",
      desc: "Submit your profile to receive workspace access. Every application is reviewed personally.",
      submit_btn: "Request Broker Access",
      disclaimer: "All information is kept strictly confidential. No fees apply until a deal closes through the platform.",
      success_title: "Application Received",
      success_desc: "We will review your profile and respond personally with the Success Fee Agreement and access details.",
    },
  },
  buyers: {
    hero: {
      tag: "Private Buyer Membership",
      title: "Access <span class=\"text-primary\">Off-Market</span><br />Yacht Acquisitions",
      desc: "PDYE connects qualified private buyers with motivated sellers and distressed yacht assets — exclusively, privately, and outside public listing channels.",
      badge1: "UHNW Individuals",
      badge2: "Family Offices",
      badge3: "Fund Managers",
      badge4: "Asset Managers",
    },
    stats: {
      stat1_val: "Off-Market Only",
      stat1_label: "Listings never reach public platforms.",
      stat2_val: "Pre-Vetted Sellers",
      stat2_label: "Motivated owners, distressed asset handlers.",
      stat3_val: "Two-Stage NDA",
      stat3_label: "Identities revealed only after signed agreements.",
      stat4_val: "Independent Valuation",
      stat4_label: "AI-assisted estimate provided on every opportunity.",
    },
    benefits: {
      title: "Why Private Buyers Choose PDYE",
      subtitle: "A disciplined process for sourcing yachts off-market",
      item1_title: "Off-Market First Look",
      item1_desc: "First access to distressed and motivated-seller yachts — typically before they reach the open market, if they reach it at all.",
      item2_title: "Private Deal Room",
      item2_desc: "A private Deal Room for every opportunity, holding financial documentation, surveys and valuation reports — all behind a deal-specific NDA, with seller and vessel identity masked until you sign.",
      item3_title: "Direct Sourcing Network",
      item3_desc: "Direct relationships with banks, restructuring teams, family offices and brokers handling distressed marine assets in the Mediterranean and beyond.",
      item4_title: "Success Fee Only",
      item4_desc: "No membership fee and no exclusivity. The Success Fee Agreement is signed before any introduction and applies only when you close on a yacht through PDYE. Every match is curated — only opportunities matching your stated parameters reach you.",
    },
    form: {
      tag: "Apply for Membership",
      title: "Private Buyer Application",
      desc: "Submit your profile. Every application is reviewed personally.",
      submit_btn: "Submit Application",
      disclaimer: "All information is kept strictly confidential under NDA. No fees apply until you close on a yacht through the platform.",
      success_title: "Application Received",
      success_desc: "We will review your profile and reach out personally to discuss next steps and set up your private access.",
    },
  },
  access: {
    investor: {
      tag: "Private Buyer Relations",
      heading: "Private Buyer<br />Access",
      sub: "Gain access to distressed and off-market yacht opportunities, sourced privately and reviewed individually.",
      note: "Membership is limited and subject to approval.",
      stat1_num: "Off-Market First Look",
      stat1_label: "Before public listings, if at all.",
      stat2_num: "NDA-Protected Deal Room",
      stat2_label: "Identities masked until both sides sign.",
      stat3_num: "Success Fee Only",
      stat3_label: "No membership fee — paid only when you close through PDYE.",
    },
    broker: {
      tag: "Broker Access",
      heading: "A Tool For<br />Brokers",
      sub: "A neutral off-market workspace — not a brokerage, not a competitor. You only pay when a deal closes through the platform.",
      note: "Every profile is reviewed personally.",
      stat1_num: "Not a Competitor",
      stat1_label: "We do not represent buyers or sellers ourselves.",
      stat2_num: "Success Fee Only",
      stat2_label: "No subscription, no listing fee, no exclusivity.",
      stat3_num: "Identity Masking & NDA",
      stat3_label: "Counterparties revealed only after signing inside the Deal Room.",
    },
    owner: {
      tag: "Owner Services",
      heading: "Sell Your Vessel<br />Confidentially",
      sub: "List off-market and reach our curated network of private buyers — without public exposure.",
      note: "Free, independent AI valuation included.",
      stat1_num: "Off-Market by Default",
      stat1_label: "Never published, never syndicated.",
      stat2_num: "Success Fee Only",
      stat2_label: "No upfront listing fee — paid only when your vessel is sold through PDYE.",
      stat3_num: "NDA on First Contact",
      stat3_label: "Buyer identity revealed only after signing.",
    },
    common: {
      success_title: "Request Submitted",
      success_desc: "Your application has been received. We will contact you personally to confirm next steps.",
      success_link: "Submit another request",
      disclaimer: "All information is kept strictly confidential in accordance with our privacy policy.",
      submit_btn: "Request Access",
    },
  },
  valuation: {
    hero: {
      tag: "AI Market Valuation",
      title: "Estimate Your Yacht's Value",
      desc: "Independent AI valuation based on current market data, with a reasoned breakdown. The more vessel details you provide, the more precise the estimate.",
    },
    form: {
      submit_btn: "Get AI Valuation",
      loading_text: "Analysing Global Market…",
      loading_desc: "Cross-checking your vessel against current market data and refining the estimate as more details are matched. Accuracy depends on how completely the form was filled in — the more parameters provided, the tighter the result. This typically takes a couple of minutes.",
      result_label: "Independent Market Estimate",
      comparables_title: "Market Comparables",
      new_btn: "New Valuation",
    },
  },
  yachts: {
    header: {
      heading: "Inventory / Off-Market Listings",
      subheading: "A curated selection of off-market and distressed vessels currently available through our confidential network.",
    },
    filters: {
      all: "All",
      motor: "Motor Yachts",
      sailing: "Sailing Yachts",
      distressed: "Distressed Deals",
    },
    confidentiality: {
      text: "All listings are confidential. Request full details to unlock pricing, location and specifications.",
    },
    cta: {
      title: "Seeking something specific?",
      desc: "Our team can source assets matching your exact acquisition parameters.",
      button: "Contact Us",
    },
  },
  footer: {
    brand: {
      name: "PDYE",
      desc: "Where the rarest yachts change hands quietly. A confidential workspace for owners, brokers and private buyers operating outside public listing platforms — discreet by design, paid only on success.",
    },
    contact: {
      tag: "Contact",
      title: "Contact Us",
      intro: "For confidential enquiries, broker introductions, or to discuss a specific opportunity, reach out through any of the channels below. All correspondence is treated as private.",
      email: "contact@pdye.com",
      phone: "+33 1 00 00 00 00",
      whatsapp: "+33 6 00 00 00 00",
      address: "Port Hercule, 98000 Monaco",
      hours: "Mon – Fri · 09:00 – 19:00 CET",
    },
    legal: {
      copyright: "Private Distressed Yacht Exchange. All rights reserved.",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      confidentiality: "Confidentiality Agreement",
    },
  },
  dealroom: {
    header: {
      heading: "Deal Room",
      subheading: "Secure workspace for active transactions. Access due diligence documents, financials, and legal instruments.",
    },
  },
};

const STORAGE_PREFIX = "site_";

export function getSiteText(pageId: string, sectionId: string, fieldKey: string): string {
  const storageKey = `${STORAGE_PREFIX}${pageId}_${sectionId}_${fieldKey}`;
  const stored = localStorage.getItem(storageKey);
  if (stored !== null) return stored;
  return SITE_DEFAULTS[pageId]?.[sectionId]?.[fieldKey] || "";
}

export function setSiteText(pageId: string, sectionId: string, fieldKey: string, value: string): void {
  const storageKey = `${STORAGE_PREFIX}${pageId}_${sectionId}_${fieldKey}`;
  localStorage.setItem(storageKey, value);
}

export function resetSiteSection(pageId: string, sectionId: string): Record<string, string> {
  const defaults = SITE_DEFAULTS[pageId]?.[sectionId] || {};
  Object.keys(defaults).forEach(key => {
    const storageKey = `${STORAGE_PREFIX}${pageId}_${sectionId}_${key}`;
    localStorage.removeItem(storageKey);
  });
  return { ...defaults };
}

export function getSiteSectionData(pageId: string, sectionId: string): Record<string, string> {
  const defaults = SITE_DEFAULTS[pageId]?.[sectionId] || {};
  const result: Record<string, string> = {};
  Object.keys(defaults).forEach(key => {
    result[key] = getSiteText(pageId, sectionId, key);
  });
  return result;
}

export function saveSiteSection(pageId: string, sectionId: string, data: Record<string, string>): void {
  Object.entries(data).forEach(([key, value]) => {
    setSiteText(pageId, sectionId, key, value);
  });
}

export function useSiteSection(pageId: string, sectionId: string): Record<string, string> {
  return getSiteSectionData(pageId, sectionId);
}
