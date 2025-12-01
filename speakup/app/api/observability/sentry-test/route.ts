import { NextResponse } from "next/server";
import { captureServerException, captureServerMessage } from "@/lib/observability/sentry";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const errorCode = url.searchParams.get("error");

  if (errorCode === "2") {
    const err = new Error("Sentry test error 2");
    captureServerException(err, { route: "sentry-test" });
    return NextResponse.json({ ok: false, triggered: true });
  }

  captureServerMessage("Sentry heartbeat ping", { route: "sentry-test" });
  return NextResponse.json({ ok: true });
}
