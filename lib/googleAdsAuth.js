import { JWT } from "google-auth-library";

const ADWORDS_SCOPE = "https://www.googleapis.com/auth/adwords";

function loadServiceAccount() {
  const raw = process.env.GOOGLE_ADS_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("Missing GOOGLE_ADS_SERVICE_ACCOUNT_KEY");
  let key;
  try {
    key = JSON.parse(raw);
  } catch (e) {
    throw new Error("GOOGLE_ADS_SERVICE_ACCOUNT_KEY is not valid JSON.");
  }
  if (key.private_key && key.private_key.includes("\\n")) {
    key.private_key = key.private_key.replace(/\\n/g, "\n");
  }
  return key;
}

export async function getAccessToken() {
  const key = loadServiceAccount();
  const client = new JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: [ADWORDS_SCOPE],
  });
  const { access_token } = await client.authorize();
  return { accessToken: access_token, serviceAccountEmail: key.client_email };
}