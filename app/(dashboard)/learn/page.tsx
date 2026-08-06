// app/(dashboard)/learn/page.tsx

import { ACT_ARTICLES, CATEGORY_META, ArticleCategory } from "@/lib/act-articles";
import { ArticleCard } from "@/components/learn/ArticleCard";

const CATEGORY_ORDER: ArticleCategory[] = [
  "foundational", "prohibited", "highRisk", "transparency", "gpai", "governance",
];

export default function LearnPage() {
  const byCategory = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    meta: CATEGORY_META[cat],
    articles: ACT_ARTICLES.filter((a) => a.category === cat),
  }));

  return (
    <div style={{ maxWidth: 860, width: "100%", fontFamily: "Inter, sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: "IBM Plex Mono, monospace", fontSize: 11,
          letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
        }}>
          Knowledge Centre
        </div>
        <h1 style={{
          fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 28,
          fontWeight: 600, color: "var(--text-primary)", margin: "0 0 8px", letterSpacing: "-0.02em",
        }}>
          AI Act Guide
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0, maxWidth: 620, lineHeight: 1.6 }}>
          A plain-language breakdown of the EU AI Act (Regulation (EU) 2024/1689) — what each
          part of the law actually requires, who it applies to, and when it takes effect.
          Click any article to expand it.
        </p>
      </div>

      {/* Jump nav */}
      <div className="flex flex-wrap" style={{ gap: 8, marginBottom: 28 }}>
        {byCategory.map(({ category, meta }) => (
          <a
            key={category}
            href={`#cat-${category}`}
            className="link-hover"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
              background: "var(--bg-card)", border: "1px solid var(--border)",
              color: "var(--text-secondary)", textDecoration: "none",
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
            {meta.label}
          </a>
        ))}
      </div>

      {/* Sections */}
      <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
        {byCategory.map(({ category, meta, articles }) => (
          <section key={category} id={`cat-${category}`} style={{ scrollMarginTop: 24 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                <h2 style={{
                  fontFamily: "IBM Plex Serif, Georgia, serif", fontSize: 18, fontWeight: 600,
                  color: "var(--text-primary)", margin: 0,
                }}>
                  {meta.label}
                </h2>
              </div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                {meta.blurb}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div style={{
        marginTop: 32, padding: "14px 18px", background: "var(--info-bg)",
        border: "1px solid var(--info-border)", borderRadius: 10, fontSize: 13,
        color: "var(--info)", lineHeight: 1.6,
      }}>
        <strong>Not legal advice.</strong> This guide is a plain-language summary to help you
        understand your obligations at a glance. For decisions with legal consequences, consult
        the official regulation text or qualified legal counsel.
      </div>
    </div>
  );
}
