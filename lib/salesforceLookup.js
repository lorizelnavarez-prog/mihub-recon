import { getSheetsAccessToken } from "@/lib/googleAdsAuth";

function sanitizeCID(raw) {
  if (!raw) return { cid: null, valid: false, reason: "empty" };
  const digitsOnly = String(raw).replace(/[,\s-]/g, "");
  if (!/^\d+$/.test(digitsOnly)) {
    return { cid: null, valid: false, reason: `non-numeric value: "${raw}"` };
  }
  if (digitsOnly.length !== 10) {
    return {
      cid: null,
      valid: false,
      reason: `expected 10 digits, got ${digitsOnly.length}: "${raw}"`,
    };
  }
  return { cid: digitsOnly, valid: true, reason: null };
}

function extractOpNumber(text) {
  const m = String(text || "").match(/OP\d+/i);
  return m ? m[0].toUpperCase() : null;
}

async function fetchSheetRows({ sheetId, tabName }) {
  const { accessToken } = await getSheetsAccessToken();
  const range = encodeURIComponent(`${tabName}!A2:E`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  if (!res.ok) {
    const message = data?.error?.message || `Sheets API error (HTTP ${res.status})`;
    throw new Error(message);
  }
  return data.values || [];
}

export async function lookupCIDByOP(opNumber, { region = "APAC" } = {}) {
  const sheetId = process.env[`SF_SHEET_ID_${region}`];
  const tabName = process.env[`SF_TAB_NAME_${region}`];
  if (!sheetId || !tabName) {
    throw new Error(
      `Missing SF_SHEET_ID_${region} or SF_TAB_NAME_${region} environment variable.`
    );
  }

  const rows = await fetchSheetRows({ sheetId, tabName });

  const target = String(opNumber).toUpperCase();
  const matches = [];

  for (const row of rows) {
    const [opportunityName, cidRaw, minStart, maxEnd, placementName] = row;
    const rowOp = extractOpNumber(opportunityName);
    if (rowOp === target) {
      const { cid, valid, reason } = sanitizeCID(cidRaw);
      matches.push({
        opportunityName,
        cidRaw,
        cid,
        valid,
        reason,
        minStart,
        maxEnd,
        placementName,
      });
    }
  }

  const resolvedCID = matches.find((m) => m.valid)?.cid || null;

  return {
    opNumber: target,
    matchCount: matches.length,
    resolvedCID,
    matches,
  };
}
