import { fetchGoogleAdsMetrics } from "@/lib/googleAdsQuery";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const customerId = searchParams.get("customerId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!customerId || !startDate || !endDate) {
    return Response.json(
      {
        ok: false,
        error: "Provide customerId, startDate (YYYY-MM-DD), and endDate (YYYY-MM-DD) as query params.",
      },
      { status: 400 }
    );
  }

  try {
    const metrics = await fetchGoogleAdsMetrics({ customerId, startDate, endDate });
    return Response.json({ ok: true, customerId, startDate, endDate, metrics });
  } catch (err) {
    return Response.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}
