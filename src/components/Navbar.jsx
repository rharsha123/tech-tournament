import React, { useState } from "react";
import { Trophy, Menu, X } from "lucide-react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "#matches", label: "Matches" },
  { href: "#standings", label: "Standings" },
  { href: "#stats", label: "Stats & Awards" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav
      className="sb-hairline"
      style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--ink)" }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", minWidth: 0 }}>
          <div style={{ background: "var(--signal)", color: "var(--signal-ink)", padding: 8, borderRadius: "var(--radius-sm)", display: "flex" }}>
            <Trophy size={20} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="sb-display" style={{ fontSize: 19, color: "var(--chalk)", lineHeight: 1 }}>TECH TOURNAMENT</div>
            <div style={{ fontSize: 10, letterSpacing: "0.08em", color: "var(--chalk-dim)", marginTop: 2 }}>Cricket · Football · Badminton</div>
          </div>
        </a>

        <div style={{ display: "none", gap: 28, fontSize: 14, fontWeight: 600 }} className="sb-nav-desktop">
          {LINKS.map((l) => (
            <a key={l.label} href={l.href} style={{ color: "var(--chalk-dim)", textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Menu"
          className="sb-nav-toggle"
          style={{ background: "transparent", border: "none", color: "var(--chalk)", padding: 8, cursor: "pointer" }}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {isOpen && (
        <div className="sb-hairline" style={{ padding: "8px 20px 16px" }}>
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setIsOpen(false)}
              style={{ display: "block", padding: "10px 4px", color: "var(--chalk)", textDecoration: "none", fontWeight: 600 }}
            >
              {l.label}
            </a>
          ))}
        </div>
      )}

      <style>{`
        @media (min-width: 768px) {
          .sb-nav-desktop { display: flex !important; }
          .sb-nav-toggle { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
