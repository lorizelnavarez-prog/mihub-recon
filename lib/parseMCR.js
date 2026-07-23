// MCR parser: turns a MIHub/MCR .xlsx export into structured JSON.
// Input contract locked against the Lenovo Aura Q2'26 sample.

import * as XLSX from "xlsx";

const MONTHS = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

// "27-May-2026" -> ISO "2026-05-27"
function parseDmonY(s) {
  if (!s) return null;
  const m = String(s).trim().match(/(\d{1,2})[-/\s]([A-Za-z]{3})[A-Za-z]*[-/\s](\d{4})/);
  if (!m) return null;
  const [, d, mon, y] = m;
  const mi = MONTHS[mon.toLowerCase()];
  if (mi === undefined) return null;
  return `${y}-${String(mi + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function isBlank(row) {
  return !row || row.every((c) => c === null || c === undefined || String(c).trim() === "");
}

// Rows arrive with a leading empty column A. The label anchor is index 1.
// Trim only trailing empties so column positions stay aligned with the header.
function trimTrailing(row) {
  const r = [...row];
  while (r.length && (r[r.length - 1] === null || r[r.length - 1] === undefined || String(r[r.length - 1]).trim() === "")) {
    r.pop();
  }
  return r;
}

// Group consecutive non-blank rows into blocks separated by blank rows.
// First row of a block is its header; the rest are data rows.
function splitBlocks(rows) {
  const blocks = [];
  let cur = [];
  for (const row of rows) {
    if (isBlank(row)) {
      if (cur.length) blocks.push(cur);
      cur = [];
    } else {
      cur.push(trimTrailing(row));
    }
  }
  if (cur.length) blocks.push(cur);
  return blocks;
}

// Turn a data block (header + rows) into { label, columns, rows: [{col: val}] }.
function blockToSection(block) {
  const header = block[0].slice(1); // drop leading empty col A
  const label = header[0];
  const columns = header;
  const rows = block.slice(1).map((r) => {
    const cells = r.slice(1);
    const obj = {};
    columns.forEach((col, i) => { obj[col] = cells[i] ?? null; });
    return obj;
  });
  return { label, columns, rows };
}

export function parseMCR(fileBuffer) {
  const wb = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = wb.SheetNames.includes("Overall performance")
    ? "Overall performance"
    : wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: true, defval: null });

  // --- metadata (label in col B, value in col C) ---
  const meta = {};
  for (const row of rows) {
    const label = row[1] ? String(row[1]).trim() : "";
    const value = row[2] ?? null;
    if (/report name/i.test(label)) meta.reportName = value;
    else if (/date\/time generated/i.test(label)) meta.generatedAt = value;
    else if (/date range/i.test(label)) meta.dateRangeRaw = value;
  }

  // report ID, OP number, date range
  const reportIdMatch = meta.reportName && String(meta.reportName).match(/ID:\s*(\d+)/);
  meta.reportId = reportIdMatch ? reportIdMatch[1] : null;

  const opMatch = meta.reportName && String(meta.reportName).match(/OP\d+/i);
  meta.opNumber = opMatch ? opMatch[0].toUpperCase() : null;

  if (meta.dateRangeRaw) {
    const parts = String(meta.dateRangeRaw).split(" - ");
    meta.startDate = parseDmonY(parts[0]);
    meta.endDate = parseDmonY(parts[1]);
  }

  // --- sections: everything from the first tabular block onward ---
  // Skip the metadata rows (they are 2-3 cells wide with a label ending in ":").
  const dataRows = rows.filter((r) => {
    const label = r[1] ? String(r[1]).trim() : "";
    const isMetaLabel = /:$/.test(label) && r[3] == null;
    return !isMetaLabel;
  });

  const blocks = splitBlocks(dataRows).filter((b) => b.length >= 1 && b[0].length > 2);
  const sections = blocks.map(blockToSection).filter((s) => s.label);

  // PL codes from the Placement section, if present
  const placement = sections.find((s) => /placement/i.test(s.label));
  meta.plCodes = placement
    ? placement.rows
        .map((r) => {
          const name = String(r[placement.columns[0]] || "");
          const m = name.match(/PL\d+/i);
          return m ? m[0].toUpperCase() : null;
        })
        .filter(Boolean)
    : [];

  return { sheetName, meta, sections };
}
