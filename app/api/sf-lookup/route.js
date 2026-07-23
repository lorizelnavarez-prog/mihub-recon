import { lookupCIDByOP } from "@/lib/salesforceLookup";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const op = searchParams.get("op");
  const region = searchParams.get("region") || "APAC";

  if (!op) {
    return Response.json({ ok: false, error: "Provide ?op=OPxxxxxx" }, { status: 400 });
  }

  try {
    const result = await lookupCIDByOP(op, { region });
    return Response.json({ ok: true, ...result });
  } catch (err) {
    return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
  }
}
