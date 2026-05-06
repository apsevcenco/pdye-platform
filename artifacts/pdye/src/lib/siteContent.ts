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
      badge: "Exclusive Network",
      cta1: "Request Access",
      cta2: "Submit Listing",
    },
    expertise: {
      title: "Our Expertise",
      item1_title: "Confidential Brokerage",
      item1_desc: "Discreet matching of sellers and buyers outside public listing platforms.",
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
      desc: "Enter your vessel specifications and our AI analyses current market data across global listing platforms — providing an independent price estimate with 5 real market comparables. No name, flag, or location required.",
      feature1: "No registration required",
      feature2: "Results in 30–60 sec",
      feature3: "5 market comparables",
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
      desc: "PDYE connects yacht owners with a global network of qualified buyers — entirely off-market. No public listings. No unsolicited calls. Only discreet, structured transactions.",
      stat1_val: "€2.4B+",
      stat1_label: "Assets Transacted",
      stat2_val: "48h",
      stat2_label: "Avg Valuation Time",
      stat3_val: "100%",
      stat3_label: "Confidential",
    },
    benefits: {
      tag: "Why Choose PDYE",
      title: "The Off-Market Advantage",
      item1_title: "Full Confidentiality",
      item1_desc: "Your vessel is listed off-market. Buyer identity, price, and ownership remain strictly private throughout the process.",
      item2_title: "Global Qualified Buyers",
      item2_desc: "Access our curated network of UHNW individuals, family offices, and qualified private buyers actively seeking distressed assets.",
      item3_title: "Fair Valuation",
      item3_desc: "Our AI-assisted market analysis benchmarks your vessel against 10,000+ comparable sales to establish the strongest position.",
      item4_title: "Secure Transaction",
      item4_desc: "NDA-protected introductions, escrow management, and full legal documentation handled by our maritime experts.",
    },
    process: {
      tag: "The Process",
      title: "Simple. Discreet. Effective.",
      step1: "Submit your vessel details confidentially",
      step2: "Receive a free market valuation within 48 hours",
      step3: "We match your listing to qualified buyers",
      step4: "Close at the best achievable price, off-market",
    },
    form: {
      tag: "Confidential Submission",
      title: "List Your Vessel",
      desc: "All submissions are protected by NDA. Our team will respond within 48 hours.",
      submit_btn: "Submit Confidentially",
      disclaimer: "Protected by NDA · All enquiries handled with absolute discretion",
      success_title: "Submission Received",
      success_desc: "Our acquisitions team will review your vessel details and contact you within 48 hours with a confidential market assessment.",
    },
  },
  brokers: {
    hero: {
      tag: "Broker Partnership",
      title: "Partner With <span class=\"text-primary\">PDYE</span><br />as a Broker",
      desc: "Join our exclusive broker network and gain access to off-market listings, motivated sellers, and qualified buyers — with full commission protection at every step.",
    },
    benefits: {
      title: "Why Brokers Partner with PDYE",
      subtitle: "Private deal flow that doesn't appear on public listing platforms",
      item1_title: "Co-Brokerage Network",
      item1_desc: "Partner on closed listings with full commission protection. We work under formal co-brokerage agreements — your client relationships remain yours.",
      item2_title: "Off-Market Buyer Access",
      item2_desc: "Tap into our verified pool of motivated buyers who cannot be found through public channels. Discretion guaranteed at every stage.",
      item3_title: "Qualified Deal Flow",
      item3_desc: "Access to motivated sellers with urgent timelines — distressed assets, estate sales, forced disposals, and pre-bankruptcy listings.",
      item4_title: "Legal & Documentation",
      item4_desc: "Full support with MOU, purchase agreements, flag state transfer, and escrow coordination through our maritime legal partners.",
    },
    process: {
      title: "How It Works",
      step1: "Submit your broker application",
      step2: "Profile review within 48 hours",
      step3: "Access broker portal and deal pipeline",
      step4: "Submit and co-broker listings confidentially",
    },
    form: {
      tag: "Apply for Partnership",
      title: "Broker Application",
      desc: "We review every application personally. Response within 48 hours.",
      submit_btn: "Submit Partnership Application",
      disclaimer: "All information is kept strictly confidential.",
      success_title: "Application Received",
      success_desc: "Our partnerships team will review your profile and contact you within 48 hours to discuss co-brokerage terms and portal access.",
    },
  },
  buyers: {
    hero: {
      tag: "Private Buyer Membership",
      title: "Access <span class=\"text-primary\">Off-Market</span><br />Yacht Acquisitions",
      desc: "PDYE connects qualified private buyers with motivated sellers and distressed yacht assets — exclusively, privately, and at significant discounts to market value.",
      badge1: "UHNW Individuals",
      badge2: "Family Offices",
      badge3: "Fund Managers",
      badge4: "Asset Managers",
    },
    stats: {
      stat1_val: "€2.4B+",
      stat1_label: "Transactions Facilitated",
      stat2_val: "18–34%",
      stat2_label: "Average Discount to Market",
      stat3_val: "48h",
      stat3_label: "Deal Introduction Time",
      stat4_val: "100%",
      stat4_label: "Confidential Process",
    },
    benefits: {
      title: "Why Private Buyers Choose PDYE",
      subtitle: "Institutional-grade deal flow in the private yacht market",
      item1_title: "Off-Market Deal Flow",
      item1_desc: "First access to distressed and motivated-seller yachts before they reach the open market. Average discount: 18–34% below market value.",
      item2_title: "Private Deal Room",
      item2_desc: "Exclusive access to our secure deal room with full financial documentation, surveys, and valuation reports under NDA.",
      item3_title: "Global Network",
      item3_desc: "Sourcing from Mediterranean, Caribbean, and Asia-Pacific markets. Active relationships with 200+ distressed asset handlers.",
      item4_title: "Curated Introductions",
      item4_desc: "We only match qualified investors with relevant opportunities. No noise — only deals that match your stated parameters.",
    },
    form: {
      tag: "Apply for Membership",
      title: "Private Buyer Application",
      desc: "Submit your profile. Our team reviews each application within 48 hours.",
      submit_btn: "Submit Application",
      disclaimer: "All information is kept strictly confidential under NDA.",
      success_title: "Application Received",
      success_desc: "Our team will review your profile and reach out within 48 hours to discuss next steps and set up your private access.",
    },
  },
  access: {
    investor: {
      tag: "Private Buyer Relations",
      heading: "Private Buyer<br />Access",
      sub: "Gain access to distressed and off-market yacht deals up to 60% below market value.",
      note: "Membership is limited and subject to approval.",
      stat1_num: "€2.4B+",
      stat1_label: "Transactions facilitated",
      stat2_num: "18–34%",
      stat2_label: "Average discount to market",
      stat3_num: "48h",
      stat3_label: "Deal introduction time",
    },
    broker: {
      tag: "Broker Partnership",
      heading: "Partner as a<br />Broker",
      sub: "Access off-market listings, motivated sellers, and qualified buyers with full commission protection.",
      note: "Profile reviewed within 48 hours of submission.",
      stat1_num: "200+",
      stat1_label: "Active broker partners",
      stat2_num: "100%",
      stat2_label: "Commission protection",
      stat3_num: "72h",
      stat3_label: "Average deal introduction",
    },
    owner: {
      tag: "Owner Services",
      heading: "Sell Your Vessel<br />Confidentially",
      sub: "List off-market and reach our curated network of UHNW buyers — without public exposure.",
      note: "Free market valuation within 48 hours.",
      stat1_num: "60%",
      stat1_label: "Below market value deals",
      stat2_num: "€500M+",
      stat2_label: "In managed inventory",
      stat3_num: "72h",
      stat3_label: "Average response time",
    },
    common: {
      success_title: "Request Submitted",
      success_desc: "Your application has been received. Our team will contact you within 48–72 hours.",
      success_link: "Submit another request",
      disclaimer: "All information is kept strictly confidential in accordance with our privacy policy.",
      submit_btn: "Request Access",
    },
  },
  valuation: {
    hero: {
      tag: "AI Market Valuation",
      title: "Estimate Your Yacht's Value",
      desc: "Enter your vessel specifications and our AI will analyse current global market data to provide an independent price estimate — no name, flag or location required.",
    },
    form: {
      submit_btn: "Get AI Valuation",
      loading_text: "Analysing Global Market...",
      loading_desc: "Searching and verifying real listings on YachtWorld, RightBoat, Boat24, Apollo Duck and more — visiting individual pages to check specs and refining queries as the AI learns more about this segment. Please wait 2–3 minutes.",
      result_label: "Market Value Estimate",
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
      desc: "The premier private marketplace for distressed and off-market Mediterranean yacht opportunities. Confidential brokerage for qualified private buyers.",
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
