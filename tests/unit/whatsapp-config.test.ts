import { describe, expect, it } from "vitest";
import { readWhatsAppGatewayConfig } from "../../src/features/whatsapp/server/config";

const key = "FAKE-ONLY-KEY-AT-LEAST-32-CHARACTERS";
describe("WA-01 server gateway configuration", () => {
  it("allows setup to remain unconfigured without attempting a connection", () => {
    expect(readWhatsAppGatewayConfig({})).toEqual({ state: "not_configured" });
    expect(
      readWhatsAppGatewayConfig({
        WHATSAPP_GATEWAY_URL: "",
        WHATSAPP_GATEWAY_API_KEY: "",
      }),
    ).toEqual({ state: "not_configured" });
  });
  it("accepts HTTPS and local development endpoints", () => {
    for (const url of [
      "https://gateway.example.invalid",
      "http://127.0.0.1:4000",
      "http://localhost:4000",
      "http://[::1]:4000",
    ]) {
      expect(
        readWhatsAppGatewayConfig({
          WHATSAPP_GATEWAY_URL: url,
          WHATSAPP_GATEWAY_API_KEY: key,
        }),
      ).toMatchObject({ state: "configured", apiKey: key });
    }
  });
  it.each([
    { WHATSAPP_GATEWAY_URL: "https://gateway.example.invalid" },
    { WHATSAPP_GATEWAY_API_KEY: key },
    {
      WHATSAPP_GATEWAY_URL: "http://gateway.example.invalid",
      WHATSAPP_GATEWAY_API_KEY: key,
    },
    {
      WHATSAPP_GATEWAY_URL: "http://localhost:4000",
      WHATSAPP_GATEWAY_API_KEY: key,
      NODE_ENV: "production",
    },
    {
      WHATSAPP_GATEWAY_URL: "https://user:private@gateway.example.invalid",
      WHATSAPP_GATEWAY_API_KEY: key,
    },
    {
      WHATSAPP_GATEWAY_URL: "https://gateway.example.invalid/?key=private",
      WHATSAPP_GATEWAY_API_KEY: key,
    },
    {
      WHATSAPP_GATEWAY_URL: "https://gateway.example.invalid/#private",
      WHATSAPP_GATEWAY_API_KEY: key,
    },
    {
      WHATSAPP_GATEWAY_URL: "file:///tmp/session",
      WHATSAPP_GATEWAY_API_KEY: key,
    },
    { WHATSAPP_GATEWAY_URL: "invalid", WHATSAPP_GATEWAY_API_KEY: key },
    {
      WHATSAPP_GATEWAY_URL: "https://gateway.example.invalid",
      WHATSAPP_GATEWAY_API_KEY: "short",
    },
    {
      WHATSAPP_GATEWAY_URL: "https://gateway.example.invalid",
      WHATSAPP_GATEWAY_API_KEY: `${key}\n`,
    },
  ])("rejects unsafe/partial configuration without returning secret values (%#)", (environment) => {
    expect(readWhatsAppGatewayConfig(environment)).toEqual({
      state: "invalid_configuration",
    });
  });
});
