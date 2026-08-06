"use client";
// components/learn/ArticleCard.tsx

import { useState, useEffect } from "react";
import Link from "next/link";
import { ActArticle, CATEGORY_META } from "@/lib/act-articles";
import { DOC_META, TYPE_FROM_SLUG } from "@/lib/documents";

interface Props {
  article: ActArticle;
  defaultOpen?: boolean;
}

export function ArticleCard({ article, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (window.location.hash === `#${article.id}`) setOpen(true);
  }, [article.id]);
  const meta = CATEGORY_META[article.category];
  const relatedDoc = article.relatedDocSlug ? DOC_META[TYPE_FROM_SLUG[article.relatedDocSlug]] : null;

  return (
    <div
      id={article.id}
      className="card-hover"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        borderLeft: `4px solid ${meta.color}`,
        padding: "18px 22px",
        scrollMarginTop: 90,
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          gap: 16, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
          }}>
            <span style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase", color: meta.color,
            }}>
              {article.number}
            </span>
            {article.status === "extended" && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "1px 8px", borderRadius: 20,
                background: "var(--warning-bg)", color: "var(--warning)", border: "1px solid var(--warning-border)",
                fontFamily: "IBM Plex Mono, monospace", letterSpacing: "0.02em",
              }}>
                DEADLINE EXTENDED
              </span>
            )}
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>
            {article.title}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
            {article.effectiveDate}
          </div>
        </div>
        <span style={{
          fontSize: 16, color: "var(--text-muted)", flexShrink: 0, marginTop: 2,
          transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s",
        }}>
          ⌄
        </span>
      </button>

      {!open && (
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "10px 0 0", lineHeight: 1.55 }}>
          {article.summary}
        </p>
      )}

      {open && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: "0 0 14px", lineHeight: 1.6 }}>
            {article.summary}
          </p>

          <div style={{ marginBottom: 14 }}>
            <div style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 6,
            }}>
              Who it applies to
            </div>
            <p style={{ fontSize: 13.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {article.whoItAppliesTo}
            </p>
          </div>

          <div style={{ marginBottom: relatedDoc ? 14 : 0 }}>
            <div style={{
              fontFamily: "IBM Plex Mono, monospace", fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: 8,
            }}>
              Key requirements
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 6 }}>
              {article.keyRequirements.map((req, i) => (
                <li key={i} style={{ fontSize: 13.5, color: "var(--text-secondary)", lineHeight: 1.55 }}>
                  {req}
                </li>
              ))}
            </ul>
          </div>

          {relatedDoc && (
            <Link
              href={`/documents/${article.relatedDocSlug}`}
              className="link-hover"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5,
                fontWeight: 600, color: relatedDoc.accentColor, textDecoration: "none",
              }}
            >
              Regulaton handles this with your {relatedDoc.title} →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
