import * as Sentry from "@sentry/nextjs";

type Extra = Record<string, unknown>;

export function captureServerException(error: unknown, extra?: Extra) {
  try {
    Sentry.captureException(error, { extra });
  } catch (err) {
    console.error("Sentry capture failed", err);
  }
}

export function captureServerMessage(message: string, extra?: Extra) {
  try {
    Sentry.captureMessage(message, { extra, level: "error" });
  } catch (err) {
    console.error("Sentry capture failed", err);
  }
}
