// prisma/seed-ai-tools.ts
// Pre-classified library of ~65 common AI tools used by EU SMBs.
// This is the core value of Regulaton — businesses don't have to research this.
// Risk levels follow EU AI Act risk-based classification.
//
// Key rules:
//   MINIMAL    → no obligations beyond Article 4 AI literacy
//   LIMITED    → transparency: must disclose AI interaction to users
//   HIGH       → Annex III: risk management, logging, human oversight, conformity assessment
//   UNACCEPTABLE → banned in EU (social scoring, real-time biometric surveillance, etc.)
//
// Most SMB deployer tools fall into MINIMAL or LIMITED.
// RECRUITING and CREDIT tools are the main HIGH risk traps for SMBs.

import { PrismaClient, ToolCategory, RiskLevel } from "@prisma/client";

const prisma = new PrismaClient();

const AI_TOOLS = [
  // ─── Writing & Content ──────────────────────────────────────────────────
  {
    name: "ChatGPT",
    providerCompany: "OpenAI",
    category: ToolCategory.WRITING_CONTENT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "Limited risk as a general-purpose AI assistant. When deployed in chatbot/customer-facing mode, transparency obligations apply — users must know they're interacting with AI.",
    complianceNotes:
      "Disclose AI use in any customer-facing context. Document in AI system register. Train staff not to enter personal data. Check OpenAI's EU AI Act compliance statement.",
    vendorActStatement: true,
    vendorStatementUrl: "https://openai.com/policies/eu-ai-act",
    websiteUrl: "https://chatgpt.com",
    logoSlug: "openai",
  },
  {
    name: "Claude (Anthropic)",
    providerCompany: "Anthropic",
    category: ToolCategory.WRITING_CONTENT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "General-purpose AI assistant. Limited risk for internal use. Transparency required in customer-facing deployments.",
    complianceNotes:
      "Same obligations as ChatGPT. Anthropic has published EU AI Act documentation. Add to AI system register with usage description.",
    vendorActStatement: true,
    vendorStatementUrl: "https://anthropic.com",
    websiteUrl: "https://claude.ai",
    logoSlug: "anthropic",
  },
  {
    name: "Gemini",
    providerCompany: "Google",
    category: ToolCategory.WRITING_CONTENT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "General-purpose AI with transparency obligations in customer-facing use.",
    complianceNotes:
      "Google has published AI Act compliance positions. Register in AI system register. Ensure staff training covers limitations of AI-generated content.",
    vendorActStatement: true,
    websiteUrl: "https://gemini.google.com",
    logoSlug: "google",
  },
  {
    name: "Microsoft Copilot",
    providerCompany: "Microsoft",
    category: ToolCategory.WRITING_CONTENT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "Embedded AI across Microsoft 365. Limited risk in most use cases.",
    complianceNotes:
      "Microsoft has published extensive EU AI Act documentation. If used in Teams/email for customer communication, ensure AI disclosure. Particularly useful for Article 4 compliance — Microsoft offers AI literacy resources.",
    vendorActStatement: true,
    vendorStatementUrl: "https://aka.ms/euaiact",
    websiteUrl: "https://copilot.microsoft.com",
    logoSlug: "microsoft",
  },
  {
    name: "Grammarly",
    providerCompany: "Grammarly",
    category: ToolCategory.WRITING_CONTENT,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "Writing assistance tool. No significant impact on people's rights or safety. No interaction with end users as an AI system.",
    complianceNotes:
      "Minimal obligations. Add to AI system register. Remind staff not to paste sensitive client data into the tool.",
    vendorActStatement: false,
    websiteUrl: "https://grammarly.com",
    logoSlug: "grammarly",
  },
  {
    name: "Jasper",
    providerCompany: "Jasper AI",
    category: ToolCategory.WRITING_CONTENT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI content generation. If used for content published to customers, synthetic content disclosure obligations may apply.",
    complianceNotes:
      "If generating marketing copy or articles, consider synthetic content transparency requirements. Document in register.",
    vendorActStatement: false,
    websiteUrl: "https://jasper.ai",
    logoSlug: "jasper",
  },
  {
    name: "Notion AI",
    providerCompany: "Notion",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "Internal productivity tool. No customer-facing AI interaction.",
    complianceNotes:
      "Minimal obligations. Add to register. Ensure data governance policy covers what company information can be entered.",
    vendorActStatement: false,
    websiteUrl: "https://notion.so",
    logoSlug: "notion",
  },

  // ─── Image & Video Generation ────────────────────────────────────────────
  {
    name: "DALL-E (via ChatGPT/API)",
    providerCompany: "OpenAI",
    category: ToolCategory.IMAGE_VIDEO_GEN,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "Generates synthetic visual content. EU AI Act requires disclosure when synthetic media could be mistaken for real.",
    complianceNotes:
      "Label AI-generated images when used in public content. Do not use to generate deepfakes or misleading content about real people.",
    vendorActStatement: true,
    websiteUrl: "https://openai.com/dall-e",
    logoSlug: "openai",
  },
  {
    name: "Midjourney",
    providerCompany: "Midjourney",
    category: ToolCategory.IMAGE_VIDEO_GEN,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI image generation. Synthetic media transparency obligations apply.",
    complianceNotes:
      "Disclose AI-generated images in marketing/communications. Avoid generating images that could be mistaken for real photographs of people.",
    vendorActStatement: false,
    websiteUrl: "https://midjourney.com",
    logoSlug: "midjourney",
  },
  {
    name: "Synthesia",
    providerCompany: "Synthesia",
    category: ToolCategory.IMAGE_VIDEO_GEN,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI video with synthetic human presenters. Deepfake-adjacent technology with transparency obligations.",
    complianceNotes:
      "Must disclose that videos feature AI-generated avatars, not real people. Synthesia has published AI Act guidance for customers.",
    vendorActStatement: true,
    websiteUrl: "https://synthesia.io",
    logoSlug: "synthesia",
  },
  {
    name: "Runway",
    providerCompany: "Runway AI",
    category: ToolCategory.IMAGE_VIDEO_GEN,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI video generation. Synthetic media transparency obligations.",
    complianceNotes:
      "Label AI-generated video content in public-facing contexts.",
    vendorActStatement: false,
    websiteUrl: "https://runwayml.com",
    logoSlug: "runway",
  },

  // ─── Customer Support ────────────────────────────────────────────────────
  {
    name: "Intercom Fin (AI Agent)",
    providerCompany: "Intercom",
    category: ToolCategory.CUSTOMER_SUPPORT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "Customer-facing AI chatbot. Transparency obligations: customers must be informed they're interacting with AI, not a human.",
    complianceNotes:
      "Clearly disclose AI chatbot status at start of every conversation. Provide easy escalation to human agent. Document in AI system register with oversight procedure.",
    vendorActStatement: false,
    websiteUrl: "https://intercom.com",
    logoSlug: "intercom",
  },
  {
    name: "Zendesk AI",
    providerCompany: "Zendesk",
    category: ToolCategory.CUSTOMER_SUPPORT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI-assisted customer service. Transparency obligations for customer-facing AI.",
    complianceNotes:
      "Disclose AI involvement when AI drafts responses sent to customers. Document escalation paths. Zendesk has published AI Act guidance.",
    vendorActStatement: true,
    websiteUrl: "https://zendesk.com",
    logoSlug: "zendesk",
  },
  {
    name: "Freshdesk Freddy AI",
    providerCompany: "Freshworks",
    category: ToolCategory.CUSTOMER_SUPPORT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI customer support assistant. Transparency obligations apply.",
    complianceNotes:
      "Same as Zendesk. Disclose AI in customer interactions. Document in register.",
    vendorActStatement: false,
    websiteUrl: "https://freshdesk.com",
    logoSlug: "freshworks",
  },
  {
    name: "Tidio",
    providerCompany: "Tidio",
    category: ToolCategory.CUSTOMER_SUPPORT,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI live chat and chatbot platform for customer support.",
    complianceNotes:
      "Disclose AI chatbot status. Ensure human handoff is available. Common in SME e-commerce.",
    vendorActStatement: false,
    websiteUrl: "https://tidio.com",
    logoSlug: "tidio",
  },

  // ─── Recruiting & HR — HIGH RISK ────────────────────────────────────────
  // Annex III, Article 4(a): AI for employment, worker management, or
  // access to self-employment — explicitly HIGH RISK
  {
    name: "HireVue",
    providerCompany: "HireVue",
    category: ToolCategory.RECRUITING_HR,
    defaultRiskLevel: RiskLevel.HIGH,
    riskRationale:
      "Video interview AI assessment. Explicitly listed in Annex III as HIGH RISK — AI used in employment context to assess, screen or rank job candidates.",
    complianceNotes:
      "Requires: documented risk management system, human oversight with override capability, logging of AI decisions, technical documentation, conformity assessment. Do not use as sole decision-maker. Inform candidates AI is being used. Review every AI ranking with a human before acting.",
    vendorActStatement: true,
    websiteUrl: "https://hirevue.com",
    logoSlug: "hirevue",
  },
  {
    name: "Workable AI",
    providerCompany: "Workable",
    category: ToolCategory.RECRUITING_HR,
    defaultRiskLevel: RiskLevel.HIGH,
    riskRationale:
      "AI-assisted candidate screening and ranking. HIGH RISK under Annex III for employment AI.",
    complianceNotes:
      "Requires full Annex III compliance package. Workable has published EU AI Act guidance. Assign an accountable person. Never use AI ranking as final decision without human review.",
    vendorActStatement: true,
    websiteUrl: "https://workable.com",
    logoSlug: "workable",
  },
  {
    name: "LinkedIn Recruiter (AI features)",
    providerCompany: "LinkedIn / Microsoft",
    category: ToolCategory.RECRUITING_HR,
    defaultRiskLevel: RiskLevel.HIGH,
    riskRationale:
      "AI candidate matching and ranking in a hiring context. HIGH RISK under Annex III.",
    complianceNotes:
      "When using AI candidate recommendations to make hiring decisions, full Annex III obligations apply to your organization as deployer. Document your oversight process. Do not treat AI match scores as definitive.",
    vendorActStatement: true,
    websiteUrl: "https://linkedin.com/talent",
    logoSlug: "linkedin",
  },
  {
    name: "Greenhouse",
    providerCompany: "Greenhouse",
    category: ToolCategory.RECRUITING_HR,
    defaultRiskLevel: RiskLevel.HIGH,
    riskRationale:
      "ATS with AI screening features. If AI is used to rank or shortlist candidates, this is HIGH RISK under Annex III.",
    complianceNotes:
      "Confirm which Greenhouse AI features you're using. Pure ATS use without AI ranking = MINIMAL. AI screening/scoring = HIGH. Document accordingly and assign accountable person.",
    vendorActStatement: false,
    websiteUrl: "https://greenhouse.com",
    logoSlug: "greenhouse",
  },
  {
    name: "Personio AI",
    providerCompany: "Personio",
    category: ToolCategory.RECRUITING_HR,
    defaultRiskLevel: RiskLevel.HIGH,
    riskRationale:
      "HR platform with AI features for recruiting and employee management. HIGH RISK for any AI used in employment decisions.",
    complianceNotes:
      "Very common in German/EU SMEs. Audit which Personio AI features you use. HR analytics and AI-assisted performance reviews may trigger Annex III. Document and assign accountable person.",
    vendorActStatement: true,
    websiteUrl: "https://personio.com",
    logoSlug: "personio",
  },

  // ─── Finance & Accounting ─────────────────────────────────────────────────
  {
    name: "Stripe Radar",
    providerCompany: "Stripe",
    category: ToolCategory.FINANCE_ACCOUNTING,
    defaultRiskLevel: RiskLevel.HIGH,
    riskRationale:
      "AI fraud detection that blocks or flags transactions. Potentially HIGH RISK under Annex III for creditworthiness/access to financial services if decisions significantly affect customers.",
    complianceNotes:
      "Review whether Stripe Radar's blocking decisions significantly impact your EU customers' ability to access services. If so, you need human review capability for disputed blocks and to document oversight.",
    vendorActStatement: true,
    websiteUrl: "https://stripe.com/radar",
    logoSlug: "stripe",
  },
  {
    name: "QuickBooks AI",
    providerCompany: "Intuit",
    category: ToolCategory.FINANCE_ACCOUNTING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "Internal accounting AI for categorisation, forecasting. No significant impact on third-party rights.",
    complianceNotes:
      "Minimal obligations. Add to register. Standard data governance around financial data applies.",
    vendorActStatement: false,
    websiteUrl: "https://quickbooks.intuit.com",
    logoSlug: "intuit",
  },
  {
    name: "Xero AI",
    providerCompany: "Xero",
    category: ToolCategory.FINANCE_ACCOUNTING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "Internal accounting automation. Low risk — decisions made by the accountant, not the AI.",
    complianceNotes:
      "Minimal obligations. Register it. Check Xero's data processing agreements for GDPR alignment.",
    vendorActStatement: false,
    websiteUrl: "https://xero.com",
    logoSlug: "xero",
  },

  // ─── Coding & Development ─────────────────────────────────────────────────
  {
    name: "GitHub Copilot",
    providerCompany: "GitHub / Microsoft",
    category: ToolCategory.CODING_DEVELOPMENT,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI coding assistant for developers. No direct impact on end users' rights. Output reviewed by developer before deployment.",
    complianceNotes:
      "Minimal obligations. Add to register. Ensure developers understand AI-generated code must be reviewed — AI literacy obligation applies.",
    vendorActStatement: true,
    websiteUrl: "https://github.com/features/copilot",
    logoSlug: "github",
  },
  {
    name: "Cursor",
    providerCompany: "Anysphere",
    category: ToolCategory.CODING_DEVELOPMENT,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI-assisted code editor. Same as Copilot — developer reviews output.",
    complianceNotes:
      "Minimal obligations. Policy on what code/data can be sent to AI for completion is good practice.",
    vendorActStatement: false,
    websiteUrl: "https://cursor.sh",
    logoSlug: "cursor",
  },
  {
    name: "Tabnine",
    providerCompany: "Tabnine",
    category: ToolCategory.CODING_DEVELOPMENT,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI code completion. Can run on-premises for sensitive environments.",
    complianceNotes:
      "Minimal obligations. Good option for orgs that need on-prem AI for data sensitivity reasons.",
    vendorActStatement: false,
    websiteUrl: "https://tabnine.com",
    logoSlug: "tabnine",
  },

  // ─── CRM & Marketing ──────────────────────────────────────────────────────
  {
    name: "HubSpot AI",
    providerCompany: "HubSpot",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI content generation, email optimisation, chatbot. Customer-facing chatbot triggers transparency obligations.",
    complianceNotes:
      "If using HubSpot's AI chatbot on your website: disclose it to users. AI content generation for internal drafts: minimal. Document chatbot in register as LIMITED risk.",
    vendorActStatement: true,
    websiteUrl: "https://hubspot.com",
    logoSlug: "hubspot",
  },
  {
    name: "Salesforce Einstein",
    providerCompany: "Salesforce",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI for CRM — lead scoring, opportunity forecasting, content generation. Internal use = MINIMAL. Customer-facing = LIMITED.",
    complianceNotes:
      "Salesforce has published EU AI Act guidance. If Einstein is used for lead scoring that affects whether people receive sales calls, document oversight procedure. Human must review and act on scores.",
    vendorActStatement: true,
    websiteUrl: "https://salesforce.com/einstein",
    logoSlug: "salesforce",
  },
  {
    name: "Klaviyo AI",
    providerCompany: "Klaviyo",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI for email marketing optimisation. Internal marketing tool — low risk.",
    complianceNotes:
      "Minimal obligations. Standard email marketing GDPR obligations already apply. Register the AI feature.",
    vendorActStatement: false,
    websiteUrl: "https://klaviyo.com",
    logoSlug: "klaviyo",
  },

  // ─── Productivity ─────────────────────────────────────────────────────────
  {
    name: "Zoom AI Companion",
    providerCompany: "Zoom",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI that records, transcribes, and summarises meetings. Affects third parties (meeting participants) — transparency required.",
    complianceNotes:
      "Inform all meeting participants that AI is recording and transcribing. This is both an AI Act transparency obligation and a GDPR requirement. Provide opt-out or clear notice. Zoom has published AI Act guidance.",
    vendorActStatement: true,
    websiteUrl: "https://zoom.us",
    logoSlug: "zoom",
  },
  {
    name: "Slack AI",
    providerCompany: "Slack / Salesforce",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI summarisation of internal Slack conversations. Internal tool, no customer-facing AI interaction.",
    complianceNotes:
      "Minimal obligations. Internal use only. Ensure your acceptable use policy covers what business data can be processed by AI.",
    vendorActStatement: false,
    websiteUrl: "https://slack.com",
    logoSlug: "slack",
  },
  {
    name: "Google Workspace AI (Gemini)",
    providerCompany: "Google",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI embedded in Google Docs, Gmail, Sheets. Primarily internal productivity use.",
    complianceNotes:
      "Minimal for internal use. If using in customer-facing email (Gmail AI-written responses), consider transparency. Google has published AI Act documentation.",
    vendorActStatement: true,
    websiteUrl: "https://workspace.google.com",
    logoSlug: "google",
  },
  {
    name: "Otter.ai",
    providerCompany: "Otter.ai",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI transcription of meetings. Affects meeting participants who may not know they're being transcribed.",
    complianceNotes:
      "Always inform meeting participants that Otter.ai is recording and transcribing. Same as Zoom AI Companion — this is a GDPR + AI Act transparency obligation.",
    vendorActStatement: false,
    websiteUrl: "https://otter.ai",
    logoSlug: "otter",
  },

  // ─── Data Analytics ────────────────────────────────────────────────────────
  {
    name: "Hotjar AI",
    providerCompany: "Hotjar",
    category: ToolCategory.DATA_ANALYTICS,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI analysis of user behaviour on websites. Used internally to improve product.",
    complianceNotes:
      "Minimal AI Act obligations. Standard GDPR cookie consent and privacy policy requirements already apply.",
    vendorActStatement: false,
    websiteUrl: "https://hotjar.com",
    logoSlug: "hotjar",
  },
  {
    name: "Amplitude AI",
    providerCompany: "Amplitude",
    category: ToolCategory.DATA_ANALYTICS,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "Product analytics with AI insights. Internal analytical tool.",
    complianceNotes:
      "Minimal obligations. Add to register.",
    vendorActStatement: false,
    websiteUrl: "https://amplitude.com",
    logoSlug: "amplitude",
  },
  {
    name: "Tableau AI (Salesforce Einstein)",
    providerCompany: "Salesforce / Tableau",
    category: ToolCategory.DATA_ANALYTICS,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "Business intelligence with AI. Internal decision support.",
    complianceNotes:
      "Minimal for standard BI use. If AI is used to make automated decisions about people (customers, employees), reassess risk level.",
    vendorActStatement: true,
    websiteUrl: "https://tableau.com",
    logoSlug: "tableau",
  },

  // ─── Research ─────────────────────────────────────────────────────────────
  {
    name: "Perplexity AI",
    providerCompany: "Perplexity",
    category: ToolCategory.RESEARCH,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI search and research assistant. Internal use for research. No customer-facing AI.",
    complianceNotes:
      "Minimal obligations. Do not input confidential client data. Train staff on limitations of AI-generated research.",
    vendorActStatement: false,
    websiteUrl: "https://perplexity.ai",
    logoSlug: "perplexity",
  },
  {
    name: "Elicit",
    providerCompany: "Ought",
    category: ToolCategory.RESEARCH,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI research assistant for literature review. Academic/professional research tool.",
    complianceNotes:
      "Minimal obligations. Add to register.",
    vendorActStatement: false,
    websiteUrl: "https://elicit.org",
    logoSlug: "elicit",
  },

  // ─── Legal ────────────────────────────────────────────────────────────────
  {
    name: "Harvey AI",
    providerCompany: "Harvey",
    category: ToolCategory.LEGAL,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI for legal work. Human lawyer must review all AI output before it's used or sent to clients. AI assists but doesn't decide.",
    complianceNotes:
      "Ensure all AI-generated legal documents are reviewed by a qualified lawyer before use. Never use Harvey output directly without human review. AI literacy obligation applies to all legal staff using it.",
    vendorActStatement: false,
    websiteUrl: "https://harvey.ai",
    logoSlug: "harvey",
  },
  {
    name: "Ironclad AI",
    providerCompany: "Ironclad",
    category: ToolCategory.LEGAL,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI contract management. Human reviews all contract changes.",
    complianceNotes:
      "Minimal obligations. Standard contract and legal review processes must remain in place.",
    vendorActStatement: false,
    websiteUrl: "https://ironcladapp.com",
    logoSlug: "ironclad",
  },

  // ─── Translation ──────────────────────────────────────────────────────────
  {
    name: "DeepL",
    providerCompany: "DeepL",
    category: ToolCategory.TRANSLATION,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI translation tool. No significant impact on rights or safety. Human reviews translations.",
    complianceNotes:
      "Minimal obligations. Do not translate confidential documents containing personal data through DeepL unless using their enterprise (data privacy) plan. DeepL is EU-based — GDPR aligned.",
    vendorActStatement: false,
    websiteUrl: "https://deepl.com",
    logoSlug: "deepl",
  },
  {
    name: "Google Translate",
    providerCompany: "Google",
    category: ToolCategory.TRANSLATION,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI translation. Minimal risk in business context.",
    complianceNotes:
      "Minimal obligations. Caution: Google Translate free tier does not offer data processing agreements. Do not use for personal data translation. Use DeepL Pro or Google Translate enterprise instead.",
    vendorActStatement: false,
    websiteUrl: "https://translate.google.com",
    logoSlug: "google",
  },

  // ─── Voice & Audio ────────────────────────────────────────────────────────
  {
    name: "ElevenLabs",
    providerCompany: "ElevenLabs",
    category: ToolCategory.VOICE_AUDIO,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI voice synthesis and cloning. Synthetic media transparency obligations. Risk of misuse for deepfake audio.",
    complianceNotes:
      "Label any AI-generated audio/voice content used publicly. Do not use to clone voices without explicit consent from the voice's owner. Do not use to create misleading content.",
    vendorActStatement: false,
    websiteUrl: "https://elevenlabs.io",
    logoSlug: "elevenlabs",
  },
  {
    name: "Fireflies.ai",
    providerCompany: "Fireflies",
    category: ToolCategory.VOICE_AUDIO,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI meeting transcription and note-taking. Affects all meeting participants.",
    complianceNotes:
      "Inform all participants before recording. Same obligations as Otter.ai. Check Fireflies' data processing agreement for EU compliance.",
    vendorActStatement: false,
    websiteUrl: "https://fireflies.ai",
    logoSlug: "fireflies",
  },

  // ─── Marketing Automation ─────────────────────────────────────────────────
  {
    name: "Mailchimp AI",
    providerCompany: "Intuit / Mailchimp",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI email content generation and send-time optimisation. Internal marketing tool.",
    complianceNotes:
      "Minimal AI Act obligations. Standard email marketing GDPR requirements (consent, unsubscribe) already apply.",
    vendorActStatement: false,
    websiteUrl: "https://mailchimp.com",
    logoSlug: "mailchimp",
  },
  {
    name: "ActiveCampaign AI",
    providerCompany: "ActiveCampaign",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI-powered marketing automation. Internal use for email and CRM.",
    complianceNotes:
      "Minimal obligations. Add to register.",
    vendorActStatement: false,
    websiteUrl: "https://activecampaign.com",
    logoSlug: "activecampaign",
  },

  // ─── Design ───────────────────────────────────────────────────────────────
  {
    name: "Adobe Firefly",
    providerCompany: "Adobe",
    category: ToolCategory.IMAGE_VIDEO_GEN,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI image generation. Synthetic media transparency obligations apply.",
    complianceNotes:
      "Adobe Firefly is trained on licensed content — generally lower IP risk. Still disclose AI-generated visuals in public-facing content. Adobe has published AI Act guidance.",
    vendorActStatement: true,
    websiteUrl: "https://firefly.adobe.com",
    logoSlug: "adobe",
  },
  {
    name: "Canva AI (Magic Studio)",
    providerCompany: "Canva",
    category: ToolCategory.IMAGE_VIDEO_GEN,
    defaultRiskLevel: RiskLevel.LIMITED,
    riskRationale:
      "AI design and image generation tools embedded in Canva.",
    complianceNotes:
      "Label AI-generated content when used publicly. Canva has published AI ethics documentation.",
    vendorActStatement: false,
    websiteUrl: "https://canva.com",
    logoSlug: "canva",
  },

  // ─── Project Management ───────────────────────────────────────────────────
  {
    name: "Linear AI",
    providerCompany: "Linear",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI for issue triage and project management. Internal tool.",
    complianceNotes:
      "Minimal obligations. Add to register.",
    vendorActStatement: false,
    websiteUrl: "https://linear.app",
    logoSlug: "linear",
  },
  {
    name: "Asana AI",
    providerCompany: "Asana",
    category: ToolCategory.PRODUCTIVITY,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI project management assistant. Internal productivity tool.",
    complianceNotes:
      "Minimal obligations. Register it.",
    vendorActStatement: false,
    websiteUrl: "https://asana.com",
    logoSlug: "asana",
  },

  // ─── Customer Feedback ────────────────────────────────────────────────────
  {
    name: "Typeform AI",
    providerCompany: "Typeform",
    category: ToolCategory.DATA_ANALYTICS,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI analysis of survey responses. Internal analytics.",
    complianceNotes:
      "Minimal obligations. GDPR consent requirements for survey data still apply.",
    vendorActStatement: false,
    websiteUrl: "https://typeform.com",
    logoSlug: "typeform",
  },

  // ─── SEO & Content ────────────────────────────────────────────────────────
  {
    name: "Surfer SEO AI",
    providerCompany: "Surfer",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI content optimisation tool. Internal SEO tool.",
    complianceNotes:
      "Minimal obligations. Add to register.",
    vendorActStatement: false,
    websiteUrl: "https://surferseo.com",
    logoSlug: "surfer",
  },
  {
    name: "Semrush AI",
    providerCompany: "Semrush",
    category: ToolCategory.MARKETING,
    defaultRiskLevel: RiskLevel.MINIMAL,
    riskRationale:
      "AI-powered SEO and marketing analytics. Internal tool.",
    complianceNotes:
      "Minimal obligations. Add to register.",
    vendorActStatement: false,
    websiteUrl: "https://semrush.com",
    logoSlug: "semrush",
  },
];

export async function seedAITools() {
  console.log("Seeding AI tools library...");

  let created = 0;
  let skipped = 0;

  for (const tool of AI_TOOLS) {
    const existing = await prisma.aIToolLibrary.findUnique({
      where: { name: tool.name },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.aIToolLibrary.create({ data: tool });
    created++;
  }

  console.log(`✓ AI Tools: ${created} created, ${skipped} already existed`);
}

// Run directly: npx ts-node prisma/seed-ai-tools.ts
if (require.main === module) {
  seedAITools()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
