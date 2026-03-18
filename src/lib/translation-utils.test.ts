import { describe, expect, it } from "vitest";
import {
  addNewTranslationKey,
  calculateCompletion,
  getFilteredKeys,
  normalizeTranslationPayload,
  serializeTranslations,
  setTranslationValue,
} from "./translation-utils";

describe("translation utils", () => {
  it("normalizuoja JSON struktura i vidini modeli", () => {
    const normalized = normalizeTranslationPayload({
      hello: { en: "Hello", lt: "Labas" },
      bye: { en: "Bye" },
    });

    expect(normalized.languages).toEqual(["en", "lt"]);
    expect(normalized.translations.bye.lt).toBe("");
  });

  it("normalizuoja plokscia key-value JSON struktura", () => {
    const normalized = normalizeTranslationPayload({
      copyUrl: "Copy url to clipboard",
      cart: "Cart",
    });

    expect(normalized.languages).toEqual(["en", "lt"]);
    expect(normalized.translations.copyUrl.en).toBe("Copy url to clipboard");
    expect(normalized.translations.copyUrl.lt).toBe("");
    expect(normalized.translations.cart.en).toBe("Cart");
    expect(normalized.translations.cart.lt).toBe("");
  });

  it("normalizuoja plural formos objekta kaip nested raktus", () => {
    const normalized = normalizeTranslationPayload({
      financingCalculatorDuration: {
        one: "Duration: {duration} Month",
        other: "Duration: {duration} Months",
      },
      cart: "Cart",
    });

    expect(normalized.languages).toEqual(["en", "lt"]);
    expect(normalized.translations["financingCalculatorDuration.one"].en).toBe(
      "Duration: {duration} Month",
    );
    expect(
      normalized.translations["financingCalculatorDuration.other"].en,
    ).toBe("Duration: {duration} Months");
    expect(normalized.translations["financingCalculatorDuration.one"].lt).toBe(
      "",
    );
  });

  it("normalizuoja nested objekta i taskais atskirtus raktus", () => {
    const normalized = normalizeTranslationPayload({
      reconsider: {
        introReconsiderScreen:
          "Hi {customerFirstName}, this is {managerFirstName} from {dealerName}.",
        continue: "Continue",
      },
    });

    expect(normalized.languages).toEqual(["en", "lt"]);
    expect(normalized.translations["reconsider.introReconsiderScreen"].en).toBe(
      "Hi {customerFirstName}, this is {managerFirstName} from {dealerName}.",
    );
    expect(normalized.translations["reconsider.continue"].en).toBe("Continue");
    expect(normalized.translations["reconsider.continue"].lt).toBe("");
  });

  it("prideda nauja rakta visoms kalboms", () => {
    const next = addNewTranslationKey(
      { greeting: { en: "Hello", lt: "Labas" } },
      ["en", "lt", "de"],
      "new.key",
    );

    expect(next["new.key"]).toEqual({ en: "", lt: "", de: "" });
  });

  it("atnaujina konkretaus langelio verte", () => {
    const next = setTranslationValue(
      { greeting: { en: "Hello", lt: "Labas" } },
      "greeting",
      "lt",
      "Sveiki",
    );

    expect(next.greeting.lt).toBe("Sveiki");
  });

  it("skaiciuoja completion procenta", () => {
    const badge = calculateCompletion(
      {
        a: { en: "One", lt: "" },
        b: { en: "Two", lt: "Du" },
      },
      "lt",
    );

    expect(badge.percent).toBe(50);
    expect(badge.translated).toBe(1);
    expect(badge.total).toBe(2);
  });

  it("skaiciuoja structured JSON kaip neuzpildyta jei truksta bent vieno nested lauko", () => {
    const badge = calculateCompletion(
      {
        monthMilesPlan: {
          en: JSON.stringify({
            one: "{months} month / {miles} miles plan",
            other: "{months} months / {miles} miles plan",
          }),
          lt: JSON.stringify({
            one: "{months} men. / {miles} myliu planas",
            other: "",
          }),
        },
      },
      "lt",
    );

    expect(badge.percent).toBe(0);
    expect(badge.translated).toBe(0);
    expect(badge.total).toBe(1);
  });

  it("filtruoja tik neisverstus ir pagal paieska", () => {
    const keys = getFilteredKeys(
      {
        title: { en: "Hello world", lt: "" },
        footer: { en: "Bye", lt: "Viso" },
      },
      "hello",
      true,
      "lt",
    );

    expect(keys).toEqual(["title"]);
  });

  it("filtruoja structured JSON pagal nested trukstamus laukus", () => {
    const keys = getFilteredKeys(
      {
        monthMilesPlan: {
          en: JSON.stringify({ one: "One", other: "Other" }),
          lt: JSON.stringify({ one: "Vienas", other: "" }),
        },
        footer: {
          en: "Footer",
          lt: "Porašte",
        },
      },
      "",
      true,
      "lt",
    );

    expect(keys).toEqual(["monthMilesPlan"]);
  });

  it("serializuoja atgal i JSON", () => {
    const raw = serializeTranslations({
      hello: { en: "Hello", lt: "Labas" },
    });

    expect(raw).toContain('"hello"');
    expect(raw).toContain('"lt"');
  });

  it("serializuojant nested JSON string, grazina objekta", () => {
    const raw = serializeTranslations({
      paymentPlan: {
        en: JSON.stringify({
          monthly: {
            one: "{months} month",
            other: "{months} months",
          },
        }),
        lt: "",
      },
    });

    const parsed = JSON.parse(raw) as {
      paymentPlan: {
        en: { monthly: { one: string; other: string } };
      };
    };

    expect(parsed.paymentPlan.en).toEqual({
      monthly: {
        one: "{months} month",
        other: "{months} months",
      },
    });
  });
});
