import { parseMCR } from "@/lib/parseMCR";

// Fluid compute lets Hobby go up to 300s; Google Ads pulls (later phase) can be slow.
export const maxDuration = 300;
export const runtime = "nodejs";

export async function POST(request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!file || typeof file.arrayBuffer !== "function") {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseMCR(buffer);
    return Response.json(parsed);
  } catch (err) {
    return Response.json(
      { error: "Failed to parse file.", detail: String(err?.message || err) },
      { status: 500 }
    );
  }
}
