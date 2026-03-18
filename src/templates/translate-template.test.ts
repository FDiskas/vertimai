import { beforeEach, describe, expect, it } from "vitest";

import { translate, setTranslateLanguage } from "./translate-template";

describe("translate", () => {
  beforeEach(() => {
    setTranslateLanguage("en");
  });

  it("grazina paprasta teksta", () => {
    expect(translate.copyUrl).toBe("Copy url to clipboard");
  });

  it("grazina kita paprasta teksta", () => {
    expect(translate.orderSummary).toBe("Order summary");
  });

  it("sukuria funkcija plural reiksmems ir parenka one/other", () => {
    expect(typeof translate.monthMilesPlan).toBe("function");
    expect(translate.monthMilesPlan(1)).toBe(
      "{months} month / {miles} miles plan",
    );
    expect(translate.monthMilesPlan(2)).toBe(
      "{months} months / {miles} miles plan",
    );
  });

  it("leidzia pakeisti kalba ir gauti kitos kalbos verte", () => {
    setTranslateLanguage("lt");

    expect(translate.copyUrl).toBe("Nukopijuoti nuorodą į iškarpinę");
  });

  it("plural laukui be vertimo kitoje kalboje grazina tuscia string", () => {
    setTranslateLanguage("lt");

    expect(typeof translate.monthMilesPlan).toBe("function");
    expect(translate.monthMilesPlan(2)).toBe("");
  });
});
