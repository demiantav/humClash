export interface AgoraTokenResult {
  token: string;
  appId: string;
}

export function generateAgoraToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber"
): AgoraTokenResult {
  const appId = process.env.AGORA_APP_ID || "temp-app-id";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "temp-cert";

  // Placeholder — real token generation requires agora-access-token package
  // which will be integrated in Phase 4 (Voice Stream)
  const token = `temp-token-${channelName}-${uid}-${role}`;

  return { token, appId };
}
