/** Evidence used on the landing page and the Evidence page. Paraphrased; limits kept visible. */
export interface EvidenceItem {
  id: string;
  who: string;
  figure: string;
  figureLabel: string;
  summary: string;
  source: string;
  url?: string;
  kind: "Company report" | "Trade press" | "Vendor case study" | "Academic study" | "News report";
  limits: string;
}

export const evidence: EvidenceItem[] = [
  {
    id: "sdp",
    who: "Sime Darby Property",
    figure: "31,288 t",
    figureLabel: "waste diverted in FY2025, a 69% diversion rate",
    summary:
      "SDP reports 69% waste diversion and 31,288 tonnes diverted in FY2025, and lists circularity as a material matter. Its Sustainability Report 2025 counts 27 active townships.",
    source: "SDP AGM presentation, 10 June 2026; SDP Sustainability Report 2025",
    kind: "Company report",
    limits: "Group-level totals. They say nothing about usable surplus at site level, which we have not validated with SDP.",
  },
  {
    id: "gs",
    who: "GS Engineering & Construction, Korea",
    figure: "75 sites",
    figureLabel: "sharing surplus in one in-house exchange, over 2,000 transactions",
    summary:
      "GS E&C built an internal exchange because new sites bought from scratch while finishing sites paid to dispose of usable items. It reports over 2,000 transactions across 75 sites.",
    source: "Herald Corporation (biz.heraldcorp.com, article 10894611)",
    url: "https://biz.heraldcorp.com/article/10894611",
    kind: "News report",
    limits: "Construction materials were only about 6% of transactions; site supplies and safety equipment dominated. Overseas context.",
  },
  {
    id: "persimmon",
    who: "Persimmon, United Kingdom",
    figure: "43%",
    figureLabel: "saving on one trial project that reused surplus topsoil",
    summary: "Persimmon runs a group-wide materials exchange that lets teams list needs early. One trial project reported a 43% saving by reusing surplus topsoil.",
    source: "The Construction Index, January 2026",
    url: "https://www.theconstructionindex.co.uk",
    kind: "Trade press",
    limits: "A single project, reported by the vendor and trade press. Not independently verified.",
  },
  {
    id: "haehre",
    who: "Haehre Entreprenor, Norway",
    figure: "In-house app",
    figureLabel: "for sharing surplus between its own sites",
    summary: "A Norwegian contractor built an in-house app so its sites can see and claim each other's surplus stock.",
    source: "Appfarm case study (appfarm.io/case-studies/stock-management-surplus-material)",
    url: "https://appfarm.io/case-studies/stock-management-surplus-material",
    kind: "Vendor case study",
    limits: "Written by the software vendor. No independent figures on savings.",
  },
  {
    id: "zainon",
    who: "Zainon and colleagues, University of Malaya",
    figure: "60 practitioners",
    figureLabel: "in Peninsular Malaysia ranked over-ordering a highly important cause of waste",
    summary:
      "A survey of 60 practitioners ranked over-ordering and design changes as highly important causes of construction waste, and environmental impact as the least important reason behind waste decisions.",
    source: "University of Malaya eprints (eprints.um.edu.my/43383)",
    url: "https://eprints.um.edu.my/43383",
    kind: "Academic study",
    limits: "A small survey of perceptions, not measured site quantities.",
  },
];

export const differentiation = {
  intro: "Surplus exchanges already exist, and some let teams list needs early.",
  points: [
    "Existing tools include Nexus ReGen, Excess Materials Exchange, and the in-house exchanges at GS E&C, Persimmon and Haehre above.",
    "Some of them, such as Persimmon's, already let teams post needs before surplus appears.",
    "We did not find one that forecasts a site's surplus from ordered versus planned quantities and advises a buyer to order less. We only checked a few, so one may exist.",
    "The prototype's forecast runs on simulated data. Its real value depends on SDP's ordering data, which a pilot would have to confirm.",
  ],
};

export const evidenceLimits = [
  "Most of the evidence comes from outside Malaysia.",
  "Some sources are written by vendors or trade press.",
  "We have no SDP site-level surplus data.",
  "Who owns surplus, SDP or the contractor, is unknown.",
];
