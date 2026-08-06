const SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || "http://localhost:3001";

export interface ClipUploadResult {
  clipId: string;
  clipUrl: string;
}

export async function uploadClipBase64(
  roomCode: string,
  dataBase64: string,
  mimeType = "audio/m4a",
): Promise<ClipUploadResult> {
  const res = await fetch(`${SERVER_URL}/clips`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ roomCode, mimeType, dataBase64 }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`upload_failed_${res.status}:${text}`);
  }

  return (await res.json()) as ClipUploadResult;
}

export async function uriToBase64(uri: string): Promise<string> {
  const res = await fetch(uri);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("file_read_failed"));
    reader.readAsDataURL(blob);
  });
}
