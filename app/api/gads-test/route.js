import { getAccessToken } from "@/lib/googleAdsAuth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET() {
  const checks = {
    hasServiceAccountKey: Boolean(process.env.GOOGLE_ADS_SERVICE_ACCOUNT_KEY),
    hasDeveloperToken: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN),
    hasLoginCustomerId: Boolean(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
  };

  if (!checks.hasServiceAccountKey) {
    return Response.json(
      { ok: false, step: "env", error: "GOOGLE_ADS_SERVICE_ACCOUNT_KEY not set", checks },
      { status: 400 }
    );
  }

  try {
    const { accessToken, serviceAccountEmail } = await getAccessToken();
    return Response.json({
      ok: true,
      message: "Service account authenticated with Google Ads scope.",
      serviceAccountEmail,
      tokenAcquired: Boolean(accessToken),
      tokenLength: accessToken ? accessToken.length : 0,
      checks,
    });
  } catch (err) {
    return Response.json(
      { ok: false, step: "auth", error: String(err?.message || err), checks },
      { status: 500 }
    );
  }
}
