import React from "react";

const LABELS = { cricket: "CRICKET", football: "FOOTBALL", badminton: "BADMINTON" };

export default function SportTag({ sport }) {
  const key = (sport || "").toLowerCase();
  return <span className={`sb-tag sb-tag--${key}`}>{LABELS[key] || sport}</span>;
}
