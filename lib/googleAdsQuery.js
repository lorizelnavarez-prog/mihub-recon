import { getAccessToken } from "@/lib/googleAdsAuth";

const API_VERSION = "v21";

const GAQL = `
  SELECT
    metrics.impressions,
    metrics.video_views,
    metrics.clicks,
    metrics.ctr,
    metrics.video_quartile_p25_rate,
    metrics.video_quartile_p50_rate,
    metrics.video_quartile_p75_rate,
    metrics.video_quartile_p100_rate,
    metrics.cost_micros
  FROM campaign
  WHERE segments.date BETWEEN '{startDate}' AND '{endDate}'
`;

function buildQuery(startDate, endDate) {
  return GAQL.replace("{startDate}", startDate).replace("{endDate}", endDate);
}

export async function fetchGoogleAdsMetrics({ customerId, startDate, endDate }) {
  if (!customerId) throw new Error("customerId is required");
  if (!startDate || !endDate) throw new Error("startDate and endDate are required");

  const { accessToken } = await getAccessToken();
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID;
  const cleanCustomerId = String(customerId).replace(/-/g, "");

  const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${cleanCustomerId}/googleAds:search`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "developer-token": developerToken,
      "login-customer-id": loginCustomerId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: buildQuery(startDate, endDate) }),
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      data?.error?.message || `Google Ads API error (HTTP ${res.status})`;
    const details = data?.error?.details || null;
    throw new Error(`${message}${details ? " | " + JSON.stringify(details) : ""}`);
  }

  return aggregate(data.results || []);
}

function aggregate(rows) {
  const totals = {
    impressions: 0,
    views: 0,
    clicks: 0,
    costMicros: 0,
    _p25: 0,
    _p50: 0,
    _p75: 0,
    _p100: 0,
  };

  for (const row of rows) {
    const m = row.metrics || {};
    const impressions = Number(m.impressions || 0);
    totals.impressions += impressions;
    totals.views += Number(m.videoViews || 0);
    totals.clicks += Number(m.clicks || 0);
    totals.costMicros += Number(m.costMicros || 0);
    totals._p25 += Number(m.videoQuartileP25Rate || 0) * impressions;
    totals._p50 += Number(m.videoQuartileP50Rate || 0) * impressions;
    totals._p75 += Number(m.videoQuartileP75Rate || 0) * impressions;
    totals._p100 += Number(m.videoQuartileP100Rate || 0) * impressions;
  }

  const imp = totals.impressions || 1;
  return {
    impressions: totals.impressions,
    views: totals.views,
    viewRate: totals.impressions ? totals.views / totals.impressions : 0,
    clicks: totals.clicks,
    ctr: totals.impressions ? totals.clicks / totals.impressions : 0,
    videoQuartile25: totals._p25 / imp,
    videoQuartile50: totals._p50 / imp,
    videoQuartile75: totals._p75 / imp,
    videoQuartile100: totals._p100 / imp,
    spend: totals.costMicros / 1_000_000,
    rowCount: rows.length,
  };
}
