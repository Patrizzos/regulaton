// components/documents/BlockRenderer.tsx
// Renders the block-based document content as clean HTML.
// Matches the Block types defined in lib/compliance/generator.ts

import React from "react";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "divider" }
  | { type: "signature"; label: string; date: string }
  | { type: "note"; text: string };

function Heading({ level, text }: { level: 1 | 2 | 3; text: string }) {
  const sizes = { 1: 26, 2: 19, 3: 15 };
  const margins = { 1: "32px 0 12px", 2: "28px 0 10px", 3: "20px 0 8px" };
  return (
    <div style={{
      fontFamily: "IBM Plex Serif, Georgia, serif",
      fontSize: sizes[level],
      fontWeight: level === 1 ? 600 : 500,
      color: "var(--text-primary)",
      margin: margins[level],
      letterSpacing: "-0.01em",
      lineHeight: 1.3,
      borderBottom: level === 1 ? "2px solid var(--border)" : "none",
      paddingBottom: level === 1 ? 12 : 0,
    }}>
      {text}
    </div>
  );
}

function Paragraph({ text }: { text: string }) {
  return (
    <p style={{
      fontSize: 14,
      color: "var(--text-secondary)",
      lineHeight: 1.75,
      margin: "0 0 14px",
    }}>
      {text}
    </p>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul style={{ margin: "0 0 16px", paddingLeft: 20 }}>
      {items.map((item, i) => (
        <li key={i} style={{
          fontSize: 14,
          color: "var(--text-secondary)",
          lineHeight: 1.7,
          marginBottom: 6,
          paddingLeft: 4,
        }}>
          {item}
        </li>
      ))}
    </ul>
  );
}

function DocTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div style={{ overflowX: "auto", margin: "0 0 20px" }}>
      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: 13,
      }}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} style={{
                padding: "9px 14px",
                background: "var(--bg-subtle)",
                color: "var(--text-secondary)",
                fontWeight: 600,
                textAlign: "left",
                borderBottom: "2px solid var(--border)",
                whiteSpace: "nowrap",
                fontFamily: "IBM Plex Mono, monospace",
                fontSize: 11,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ background: ri % 2 === 0 ? "var(--bg-card)" : "var(--bg-subtle)" }}>
              {row.map((cell, ci) => (
                <td key={ci} style={{
                  padding: "10px 14px",
                  color: "var(--text-secondary)",
                  borderBottom: "1px solid var(--border)",
                  verticalAlign: "top",
                  lineHeight: 1.5,
                }}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Divider() {
  return (
    <hr style={{
      border: "none",
      borderTop: "1px solid var(--border)",
      margin: "24px 0",
    }} />
  );
}

function Note({ text }: { text: string }) {
  return (
    <div style={{
      background: "var(--info-bg)",
      border: "1px solid var(--info-border)",
      borderLeft: "4px solid var(--info)",
      borderRadius: "0 8px 8px 0",
      padding: "12px 16px",
      margin: "0 0 20px",
      fontSize: 13,
      color: "var(--info)",
      lineHeight: 1.6,
    }}>
      {text}
    </div>
  );
}

function Signature({ label, date }: { label: string; date: string }) {
  return (
    <div style={{
      margin: "32px 0 0",
      padding: "20px 24px",
      border: "1px solid var(--border)",
      borderRadius: 10,
      background: "var(--bg-subtle)",
    }}>
      <div style={{
        fontSize: 11,
        fontFamily: "IBM Plex Mono, monospace",
        color: "var(--text-muted)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 16,
      }}>
        Authorised by
      </div>

      {/* Signature line */}
      <div style={{
        borderBottom: "1.5px solid var(--border-strong)",
        width: 280,
        marginBottom: 8,
        height: 36,
      }} />

      <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Date: {date}
      </div>
    </div>
  );
}

export function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div style={{ maxWidth: 720 }}>
      {blocks.map((block, i) => {
        switch (block.type) {
          case "heading":
            return <Heading key={i} level={block.level} text={block.text} />;
          case "paragraph":
            return <Paragraph key={i} text={block.text} />;
          case "list":
            return <List key={i} items={block.items} />;
          case "table":
            return <DocTable key={i} headers={block.headers} rows={block.rows} />;
          case "divider":
            return <Divider key={i} />;
          case "note":
            return <Note key={i} text={block.text} />;
          case "signature":
            return <Signature key={i} label={block.label} date={block.date} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
