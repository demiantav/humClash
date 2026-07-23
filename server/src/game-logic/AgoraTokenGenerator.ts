import agoraToken from "agora-access-token";

const { RtcRole, RtcTokenBuilder } = agoraToken;

export interface AgoraTokenResult {
  token: string;
  appId: string;
}

export function generateAgoraToken(
  channelName: string,
  uid: number,
  role: "publisher" | "subscriber",
): AgoraTokenResult {
  const appId = process.env.AGORA_APP_ID || "";
  const appCertificate = process.env.AGORA_APP_CERTIFICATE || "";

  if (!appId || !appCertificate) {
    console.warn("[agora] Missing APP_ID or APP_CERTIFICATE — using placeholder token");
    return {
      token: `placeholder-${channelName}-${uid}-${role}`,
      appId: appId || "missing-app-id",
    };
  }

  const roleValue = role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
  const expireTime = Math.floor(Date.now() / 1000) + 3600;

  const token = RtcTokenBuilder.buildTokenWithUid(
    appId,
    appCertificate,
    channelName,
    uid,
    roleValue,
    expireTime,
  );

  return { token, appId };
}
