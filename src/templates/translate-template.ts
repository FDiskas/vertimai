import translations from "../locales/en.json";
import allTranslations from "../mocks/exported.json";

type SourceTranslations = typeof allTranslations;
type TranslationsType = typeof translations;
type Key = keyof TranslationsType;
export type LanguageCode = keyof SourceTranslations[Key];
type PluralValue = { one: string; other: string };
type PluralKeys = {
  [K in keyof TranslationsType]: TranslationsType[K] extends PluralValue
    ? K
    : never;
}[Key];
type Translate = Omit<TranslationsType, PluralKeys> &
  Record<PluralKeys, (count: number) => string>;

const DEFAULT_LANGUAGE = "en" as const;

function isPlural(value: unknown): value is PluralValue {
  return Boolean(
    value &&
    typeof value === "object" &&
    "one" in value &&
    "other" in value &&
    typeof value.one === "string" &&
    typeof value.other === "string",
  );
}

function createTranslationHelper(language: LanguageCode): Translate {
  const result = { ...translations } as unknown as Record<
    Key,
    string | ((count: number) => string)
  >;

  for (const key of Object.keys(allTranslations) as Key[]) {
    const baseValue = allTranslations[key]?.[DEFAULT_LANGUAGE];
    const value = allTranslations[key]?.[language];

    if (isPlural(baseValue)) {
      result[key] = (count: number) => {
        if (!isPlural(value)) {
          return "";
        }

        return count === 1 ? value.one : value.other;
      };
      continue;
    }

    result[key] = typeof value === "string" ? value : "";
  }

  return result as Translate;
}

export const translate = createTranslationHelper(DEFAULT_LANGUAGE);

export function setTranslateLanguage(language: LanguageCode): void {
  Object.assign(translate, createTranslationHelper(language));
}
