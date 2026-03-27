import { beforeEach, describe, expect, it } from "vitest";

import { translate, setTranslateLanguage, withParams } from "./translate-template";

describe("translate", () => {
  beforeEach(() => {
    setTranslateLanguage("en");
  });

  it("return simple text", () => {
    expect(translate.commonAdd).toBe("Add");
  });

  it("return another simple text", () => {
    expect(translate.appTitle).toBe("Translation Studio");
  });

  it("allows changing the language and getting the value in another language", () => {
    setTranslateLanguage("lt");

    expect(translate.commonAdd).toBe("Pridėti");
  });

  it("returns an empty string for a non-existing key", () => {
    setTranslateLanguage("lt");

    expect((translate as Record<string, string>).nonExistingKey).toBeUndefined();
  });

  it("replaces known params and keeps missing ones in the template", () => {
    const result = withParams("Hello {name}, id: {id}, missing: {missing}", {
      name: "Jon",
      id: 42,
    });

    expect(result).toBe("Hello Jon, id: 42, missing: {missing}");
  });
});
