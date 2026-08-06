// lib/act-articles.ts
// Plain-language reference content for the EU AI Act (Regulation (EU) 2024/1689),
// powering the in-app "AI Act Guide" knowledge centre. Written for a non-legal
// audience — deliberately not a substitute for legal advice.
//
// Dates reflect the Digital Omnibus on AI amendments (agreed by the Council and
// Parliament in June 2026), which pushed the Annex III high-risk deadline from
// 2 August 2026 to 2 December 2027, and the Annex I embedded high-risk deadline
// to 2 August 2028. All other dates below are unchanged by that omnibus.

export type ArticleCategory =
  | "foundational"
  | "prohibited"
  | "highRisk"
  | "transparency"
  | "gpai"
  | "governance";

export const CATEGORY_META: Record<ArticleCategory, { label: string; color: string; blurb: string }> = {
  foundational: {
    label: "Foundational Obligations",
    color: "#60A5FA",
    blurb: "Baseline duties that apply to nearly everyone, regardless of what kind of AI you use.",
  },
  prohibited: {
    label: "Prohibited Practices",
    color: "#F87171",
    blurb: "A short list of AI uses banned outright as an unacceptable risk.",
  },
  highRisk: {
    label: "High-Risk AI Systems",
    color: "#A78BFA",
    blurb: "The Act's strictest tier — AI used in areas like employment, credit, and education.",
  },
  transparency: {
    label: "Transparency & Disclosure",
    color: "#FBBF24",
    blurb: "Rules about telling people when they're dealing with AI, or with AI-generated content.",
  },
  gpai: {
    label: "General-Purpose AI Models",
    color: "#22D3EE",
    blurb: "A separate track for companies that build the underlying models other AI tools run on.",
  },
  governance: {
    label: "Governance & Enforcement",
    color: "#94A3B8",
    blurb: "How the Act is supervised, and what happens if an organisation doesn't comply.",
  },
};

export interface ActArticle {
  id: string;
  number: string;
  category: ArticleCategory;
  title: string;
  status: "in-force" | "extended";
  effectiveDate: string;
  summary: string;
  whoItAppliesTo: string;
  keyRequirements: string[];
  relatedDocSlug?: string;
}

export const ACT_ARTICLES: ActArticle[] = [
  {
    id: "scope-purpose",
    number: "Articles 1–2",
    category: "foundational",
    title: "Scope & Purpose",
    status: "in-force",
    effectiveDate: "In force since 1 August 2024",
    summary:
      "Defines what the Act covers — AI systems placed on the market or used within the EU — and its underlying goal of trustworthy AI that protects health, safety, and fundamental rights.",
    whoItAppliesTo:
      "Any organisation that develops, sells, or uses AI systems affecting people in the EU, including non-EU companies whose AI output reaches EU users.",
    keyRequirements: [
      "Applies to providers, deployers, importers, and distributors of AI systems",
      "Reaches organisations based outside the EU if their AI's output is used inside it",
      "Excludes AI used purely for military, national security, or personal non-professional purposes",
    ],
  },
  {
    id: "ai-literacy",
    number: "Article 4",
    category: "foundational",
    title: "AI Literacy",
    status: "in-force",
    effectiveDate: "In force since 2 February 2025",
    summary:
      "Organisations must ensure staff — and anyone else operating AI on their behalf — understand, at a level appropriate to their role, how the AI systems they use actually work, including the risks and limitations.",
    whoItAppliesTo:
      "Every provider and deployer of AI systems. This is one of the few obligations that applies no matter how the AI is classified.",
    keyRequirements: [
      "Provide AI literacy training appropriate to each person's role and technical background",
      "Cover how the specific tools in use work, their risks, and their limitations",
      "Keep records showing training was actually completed",
    ],
    relatedDocSlug: "training-records",
  },
  {
    id: "prohibited-practices",
    number: "Article 5",
    category: "prohibited",
    title: "Prohibited AI Practices",
    status: "in-force",
    effectiveDate: "In force since 2 February 2025",
    summary:
      "Bans a short list of AI uses considered unacceptable risk — manipulative or deceptive AI, social scoring, and most real-time remote biometric identification in public by law enforcement, among others.",
    whoItAppliesTo: "All organisations, with no exceptions based on company size.",
    keyRequirements: [
      "No subliminal, manipulative, or deceptive AI techniques that materially distort behaviour and cause harm",
      "No AI that exploits vulnerabilities related to age, disability, or socioeconomic situation",
      "No social scoring of individuals by public or private actors",
      "No untargeted scraping of facial images to build recognition databases",
      "No emotion-recognition AI in workplaces or education settings (narrow safety/medical exceptions apply)",
    ],
    relatedDocSlug: "acceptable-use-policy",
  },
  {
    id: "high-risk-classification",
    number: "Articles 6–7",
    category: "highRisk",
    title: "Classifying High-Risk AI Systems",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027 (extended from 2 August 2026)",
    summary:
      "Defines which AI systems count as \"high-risk\" — primarily those listed in Annex III, covering employment, credit scoring, education, law enforcement, and access to essential services — triggering the Act's strictest requirements.",
    whoItAppliesTo:
      "Providers and deployers of AI used in employment, credit/insurance, education, law enforcement, migration, or essential public/private services.",
    keyRequirements: [
      "Check whether any AI system in use falls under an Annex III category",
      "Systems performing a narrow procedural task, or that don't materially influence a decision's outcome, may qualify for an exemption — but this must be documented",
      "The 2027 deadline moved the compliance date, not the underlying requirements",
    ],
    relatedDocSlug: "ai-system-register",
  },
  {
    id: "risk-management",
    number: "Article 9",
    category: "highRisk",
    title: "Risk Management System",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027",
    summary:
      "High-risk AI systems need a continuous risk-management process across their whole lifecycle — identifying, evaluating, and mitigating foreseeable risks to health, safety, and fundamental rights.",
    whoItAppliesTo: "Primarily providers of high-risk AI systems; deployers benefit from but don't have to build this process.",
    keyRequirements: [
      "Identify and analyse known and reasonably foreseeable risks",
      "Estimate risks arising from both intended use and foreseeable misuse",
      "Adopt mitigation measures and test before and after the system is placed on the market",
    ],
  },
  {
    id: "data-governance",
    number: "Article 10",
    category: "highRisk",
    title: "Data & Data Governance",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027",
    summary:
      "Training, validation, and testing data for high-risk AI systems must be relevant, sufficiently representative, and checked for errors and bias as far as possible.",
    whoItAppliesTo: "Providers of high-risk AI systems.",
    keyRequirements: [
      "Apply data governance and management practices appropriate to the system's purpose",
      "Examine data for biases likely to affect health, safety, or fundamental rights",
      "Identify data gaps and address them before deployment",
    ],
  },
  {
    id: "technical-docs-logging",
    number: "Articles 11–12",
    category: "highRisk",
    title: "Technical Documentation & Record-Keeping",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027",
    summary:
      "High-risk systems need documentation proving how they were built and tested, plus automatic event logging so their operation can be traced after deployment.",
    whoItAppliesTo: "Providers (documentation) and deployers (must retain the logs the system generates, where under their control).",
    keyRequirements: [
      "Maintain technical documentation before the system is placed on the market",
      "Enable automatic event logging over the system's lifetime",
      "Retain logs for a period appropriate to the system's intended purpose",
    ],
  },
  {
    id: "transparency-to-deployers",
    number: "Article 13",
    category: "highRisk",
    title: "Transparency to Deployers",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027",
    summary:
      "Providers must give deployers clear instructions covering the system's capabilities, limitations, and the human oversight measures needed to use it safely.",
    whoItAppliesTo: "Providers of high-risk AI systems, for the benefit of the deployers who buy or license them.",
    keyRequirements: [
      "Instructions must be in a form deployers can reasonably interpret and apply",
      "Must disclose the system's intended purpose, known limitations, and expected performance",
    ],
  },
  {
    id: "human-oversight",
    number: "Article 14",
    category: "highRisk",
    title: "Human Oversight",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027",
    summary:
      "High-risk AI systems must be designed so a human can effectively oversee them — understanding outputs, spotting anomalies, and being able to intervene or stop the system entirely.",
    whoItAppliesTo: "Providers (must design for oversight) and deployers (must actually assign and train the overseeing humans).",
    keyRequirements: [
      "Assign people with the competence, training, and authority to oversee the system",
      "Ensure overseers can decline to use, or can override or reverse, the system's output",
      "Include a mechanism to stop the system where feasible",
    ],
    relatedDocSlug: "oversight-procedure",
  },
  {
    id: "deployer-obligations",
    number: "Article 26",
    category: "highRisk",
    title: "Obligations of Deployers",
    status: "extended",
    effectiveDate: "Applies from 2 December 2027",
    summary:
      "Sets out what organisations using — rather than building — a high-risk AI system must do, separate from and in addition to the provider's obligations. This is the article most relevant to most Regulaton customers.",
    whoItAppliesTo: "Any organisation deploying a high-risk AI system.",
    keyRequirements: [
      "Use the system according to the provider's instructions",
      "Assign human oversight to trained, competent people",
      "Monitor the system's operation and report serious incidents to the provider and, where relevant, authorities",
      "Keep the system's automatically generated logs for at least six months, unless other law requires longer",
    ],
  },
  {
    id: "transparency-disclosure",
    number: "Article 50",
    category: "transparency",
    title: "Transparency for Certain AI Systems",
    status: "in-force",
    effectiveDate: "In force since 2 August 2026",
    summary:
      "Requires clear disclosure when people are interacting with AI rather than a human, and labelling of AI-generated or manipulated audio, image, video, or text content (\"deepfakes\").",
    whoItAppliesTo: "Any organisation deploying chatbots, emotion-recognition or biometric categorisation systems, or generating and publishing synthetic media.",
    keyRequirements: [
      "Inform users they're interacting with an AI system, unless it's obvious from context",
      "Disclose the use of emotion-recognition or biometric-categorisation systems to the people subjected to them",
      "Label AI-generated or manipulated content, in a machine-readable format where technically feasible",
      "A grace period for machine-readable marking of legacy content runs to 2 December 2026",
    ],
  },
  {
    id: "gpai-models",
    number: "Articles 51–56",
    category: "gpai",
    title: "General-Purpose AI Models",
    status: "in-force",
    effectiveDate: "In force since 2 August 2025",
    summary:
      "A separate set of obligations for companies that build general-purpose AI models — the large models many other AI tools are built on. Not typically relevant if you only use tools built by someone else.",
    whoItAppliesTo: "Providers of general-purpose AI models. Most Regulaton customers are deployers of tools built on these models, not the model providers themselves.",
    keyRequirements: [
      "Maintain technical documentation and provide information to downstream providers",
      "Publish a summary of the content used to train the model",
      "Models classified as posing \"systemic risk\" face additional evaluation, incident-reporting, and cybersecurity obligations",
    ],
  },
  {
    id: "sandboxes",
    number: "Article 57",
    category: "governance",
    title: "AI Regulatory Sandboxes",
    status: "in-force",
    effectiveDate: "Member states establishing sandboxes on a rolling basis",
    summary:
      "Each EU member state must set up at least one AI regulatory sandbox — a supervised environment for developing and testing innovative AI systems before they go to market.",
    whoItAppliesTo: "Optional, particularly useful for startups and SMEs developing novel high-risk AI systems.",
    keyRequirements: [
      "Provides supervised access to develop and test AI systems before market entry",
      "Priority access given to SMEs and startups",
      "Participation doesn't exempt a system from the Act's requirements once it reaches market",
    ],
  },
  {
    id: "penalties",
    number: "Article 99",
    category: "governance",
    title: "Penalties",
    status: "in-force",
    effectiveDate: "National enforcement frameworks required since 2 August 2025",
    summary:
      "Sets the maximum fines national authorities can impose for non-compliance, tiered by the severity of the violation.",
    whoItAppliesTo: "Any organisation found in breach of the Act.",
    keyRequirements: [
      "Up to €35 million or 7% of global annual turnover for prohibited AI practices",
      "Up to €15 million or 3% of global annual turnover for most other breaches, including high-risk system requirements",
      "Up to €7.5 million or 1% of global annual turnover for supplying incorrect information to authorities",
      "Lower caps apply to SMEs and startups, using whichever figure is lower",
    ],
  },
];
