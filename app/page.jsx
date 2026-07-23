"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function handleParse(f) {
    if (!f) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", f);
      const res = await fetch("/api/parse", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || "Parse failed");
      setResult(data);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      handleParse(f);
    }
  }

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "40px 24px" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>MIHub Recon</h1>
      <p style={{ color: "#666", marginTop: 0 }}>
        Phase 1 &amp; 2: upload an MCR report to auto-detect its date range,
        OP number, PL codes, and sections.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${dragOver ? "#2563eb" : "#c7ccd1"}`,
          borderRadius: 12,
          background: dragOver ? "#eff5ff" : "#fff",
          padding: "36px 24px",
          textAlign: "center",
          transition: "all .15s ease",
        }}
      >
        <p style={{ margin: "0 0 12px", color: "#444" }}>
          Drag &amp; drop the MCR .xlsx here, or
        </p>
        <label
          style={{
            display: "inline-block",
            background: "#2563eb",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Choose file
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                handleParse(f);
              }
            }}
          />
        </label>
        {file && (
          <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>{file.name}</p>
        )}
      </div>

      {loading && <p style={{ marginTop: 24 }}>Parsing...</p>}
      {error && (
        <p style={{ marginTop: 24, color: "#b91c1c" }}>Error: {error}</p>
      )}

      {result && (
        <div style={{ marginTop: 32 }}>
          <Card title="Detected metadata">
            <Row k="OP number" v={result.meta.opNumber} />
            <Row k="Report ID" v={result.meta.reportId} />
            <Row k="Start date" v={result.meta.startDate} />
            <Row k="End date" v={result.meta.endDate} />
            <Row k="PL codes" v={(result.meta.plCodes || []).join(", ")} />
          </Card>

          <Card title={`Sections (${result.sections.length})`}>
            {result.sections.map((s, i) => (
              <Row key={i} k={s.label} v={`${s.rows.length} rows`} />
            ))}
          </Card>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", color: "#2563eb" }}>
              Raw JSON
            </summary>
            <pre
              style={{
                background: "#0f172a",
                color: "#e2e8f0",
                padding: 16,
                borderRadius: 8,
                overflow: "auto",
                fontSize: 12,
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </main>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
      }}
    >
      <h2 style={{ fontSize: 15, margin: "0 0 12px", color: "#111" }}>{title}</h2>
      {children}
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "6px 0",
        borderBottom: "1px solid #f1f2f4",
        fontSize: 14,
      }}
    >
      <span style={{ color: "#666" }}>{k}</span>
      <span style={{ fontWeight: 500 }}>{v || "-"}</span>
    </div>
  );
}
