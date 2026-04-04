import { TRPCError } from "@trpc/server";
import { ENV } from "./env";

export type SMSPayload = {
  phoneNumber: string;
  message: string;
};

const PHONE_MAX_LENGTH = 20;
const MESSAGE_MAX_LENGTH = 160;

const trimValue = (value: string): string => value.trim();
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const buildEndpointUrl = (baseUrl: string | undefined): string => {
  if (!baseUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "SMS service URL is not configured.",
    });
  }
  const normalizedBase = baseUrl.endsWith("/")
    ? baseUrl
    : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendSMS",
    normalizedBase
  ).toString();
};

const validatePayload = (input: SMSPayload): SMSPayload => {
  if (!isNonEmptyString(input.phoneNumber)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Phone number is required.",
    });
  }
  if (!isNonEmptyString(input.message)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "SMS message is required.",
    });
  }

  const phoneNumber = trimValue(input.phoneNumber);
  const message = trimValue(input.message);

  if (phoneNumber.length > PHONE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Phone number must be at most ${PHONE_MAX_LENGTH} characters.`,
    });
  }

  if (message.length > MESSAGE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `SMS message must be at most ${MESSAGE_MAX_LENGTH} characters. Current length: ${message.length}`,
    });
  }

  return { phoneNumber, message };
};

/**
 * Sends an SMS notification through the Manus SMS Service.
 * Returns `{ success: true }` if the request was accepted, `{ success: false }` when the upstream service
 * cannot be reached. Validation errors bubble up as TRPC errors so callers can fix the payload.
 */
export async function sendSMS(
  payload: SMSPayload
): Promise<{ success: boolean }> {
  const { phoneNumber, message } = validatePayload(payload);

  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "SMS service API key is not configured.",
    });
  }

  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1",
      },
      body: JSON.stringify({ phoneNumber, message }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[SMS] Failed to send SMS to ${phoneNumber} (${response.status} ${response.statusText})${
          detail ? `: ${detail}` : ""
        }`
      );
      return { success: false };
    }

    return { success: true };
  } catch (error) {
    console.warn(`[SMS] Error calling SMS service for ${phoneNumber}:`, error);
    return { success: false };
  }
}
