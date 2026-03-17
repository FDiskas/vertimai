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

  it("normalizuoja plural formos objekta kaip vienos kalbos reiksme", () => {
    const normalized = normalizeTranslationPayload({
      financingCalculatorDuration: {
        one: "Duration: {duration} Month",
        other: "Duration: {duration} Months",
      },
      cart: "Cart",
    });

    expect(normalized.languages).toEqual(["en", "lt"]);
    expect(normalized.translations.financingCalculatorDuration.en).toBe(
      JSON.stringify({
        one: "Duration: {duration} Month",
        other: "Duration: {duration} Months",
      }),
    );
    expect(normalized.translations.financingCalculatorDuration.lt).toBe("");
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

  it("serializuoja atgal i JSON", () => {
    const raw = serializeTranslations({
      hello: { en: "Hello", lt: "Labas" },
    });

    expect(raw).toContain('"hello"');
    expect(raw).toContain('"lt"');
  });
});
