import { describe, expect, it } from "vitest";
import {
  formatWhatsAppDate,
  formatWhatsAppTime,
  renderWhatsAppMessage,
  toWhatsAppNumber,
  WHATSAPP_KINDS,
  WHATSAPP_TEMPLATE_INFO,
  whatsappTemplateInput,
} from "../../src/features/whatsapp/templates";

describe("WhatsApp templates (D-37, provider Pesan Whatsapp)", () => {
  it("has the provider's four messages with fixed recipients", () => {
    expect(WHATSAPP_KINDS).toEqual([
      "TRX_SENDER",
      "TRX_RECEIVER",
      "SHIPMENT_STATUS",
      "DELIVERY_SHEET",
    ]);
    expect(
      WHATSAPP_KINDS.map((k) => WHATSAPP_TEMPLATE_INFO[k].recipient),
    ).toEqual(["sender", "receiver", "sender", "receiver"]);
  });

  it("fills variables, keeps unknown ones and turns literal \\n into newlines", () => {
    const text = renderWhatsAppMessage(
      "Dear {namaPengirim},\\nAWB {awb} oleh {diterima} {tidakAda}",
      { namaPengirim: "Budi", awb: "AWB-1", diterima: null },
    );
    expect(text).toBe("Dear Budi,\nAWB AWB-1 oleh - {tidakAda}");
  });

  it("renders every default without leftover variables", () => {
    for (const kind of WHATSAPP_KINDS) {
      const info = WHATSAPP_TEMPLATE_INFO[kind];
      const values = Object.fromEntries(info.variables.map((v) => [v, "x"]));
      expect(renderWhatsAppMessage(info.defaultMessage, values)).not.toMatch(
        /\{[A-Za-z]+\}/,
      );
    }
  });

  it("normalizes Indonesian numbers to E.164", () => {
    expect(toWhatsAppNumber("0812-3456-7890")).toBe("+6281234567890");
    expect(toWhatsAppNumber("812 3456 7890")).toBe("+6281234567890");
    expect(toWhatsAppNumber("+62 812 3456 7890")).toBe("+6281234567890");
    expect(toWhatsAppNumber("6281234567890, 0219999")).toBe("+6281234567890");
    expect(toWhatsAppNumber("021")).toBeNull();
    expect(toWhatsAppNumber(null)).toBeNull();
  });

  it("formats dates and times in Asia/Jakarta", () => {
    const at = new Date("2026-11-23T20:30:00.000Z");
    expect(formatWhatsAppDate(at)).toBe("24-11-2026");
    expect(formatWhatsAppTime(at)).toBe("03:30");
  });

  it("validates the editable message", () => {
    expect(
      whatsappTemplateInput.safeParse({
        kind: "TRX_SENDER",
        message: " ",
        isEnabled: true,
      }).success,
    ).toBe(false);
    expect(
      whatsappTemplateInput.safeParse({
        kind: "OTHER",
        message: "x",
        isEnabled: true,
      }).success,
    ).toBe(false);
  });
});
