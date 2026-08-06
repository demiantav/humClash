import type { IncomingMessage, ServerResponse } from "node:http";
import { storeClip, getClip, purgeExpiredClips } from "./clipStore.js";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB

function readBody(req: IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("payload_too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(raw);
}

function publicBase(req: IncomingMessage): string {
  const host = req.headers.host || "localhost:3001";
  const proto = (req.headers["x-forwarded-proto"] as string) || "http";
  return `${proto}://${host}`;
}

export async function handleClipHttp(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<boolean> {
  const url = req.url || "";

  if (req.method === "OPTIONS" && url.startsWith("/clips")) {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return true;
  }

  if (req.method === "POST" && url === "/clips") {
    try {
      purgeExpiredClips();
      const raw = await readBody(req, MAX_BYTES + 1024);
      const body = JSON.parse(raw.toString("utf8")) as {
        roomCode?: string;
        mimeType?: string;
        dataBase64?: string;
      };

      if (!body.roomCode || !body.dataBase64) {
        sendJson(res, 400, { error: "roomCode and dataBase64 required" });
        return true;
      }

      const buffer = Buffer.from(body.dataBase64, "base64");
      if (buffer.length === 0 || buffer.length > MAX_BYTES) {
        sendJson(res, 400, { error: "invalid audio payload" });
        return true;
      }

      const clip = storeClip(body.roomCode, buffer, body.mimeType || "audio/m4a");
      const clipUrl = `${publicBase(req)}/clips/${clip.id}`;
      sendJson(res, 201, { clipId: clip.id, clipUrl });
      return true;
    } catch (err: any) {
      if (err?.message === "payload_too_large") {
        sendJson(res, 413, { error: "payload too large" });
        return true;
      }
      sendJson(res, 400, { error: "bad request" });
      return true;
    }
  }

  const match = url.match(/^\/clips\/([a-f0-9-]{36})$/i);
  if (req.method === "GET" && match) {
    const clip = getClip(match[1]);
    if (!clip) {
      res.writeHead(404);
      res.end();
      return true;
    }
    res.writeHead(200, {
      "Content-Type": clip.mimeType,
      "Content-Length": clip.buffer.length,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "private, max-age=120",
    });
    res.end(clip.buffer);
    return true;
  }

  return false;
}
