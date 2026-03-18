import type {
  CompletionBadge,
  LanguageCode,
  TranslationMap,
} from "../types/translation";

export interface NormalizedPayload {
  languages: LanguageCode[];
  translations: TranslationMap;
}

export type StructuredTranslationObject = {
  [key: string]: string | StructuredTranslationObject;
};

const languageCodePattern = /^[a-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isStructuredTranslationObject(
  value: unknown,
): value is StructuredTranslationObject {
  if (!isPlainObject(value)) {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }

  return entries.every(
    ([, entryValue]) =>
      typeof entryValue === "string" ||
      isStructuredTranslationObject(entryValue),
  );
}

function countStructuredLeaves(value: StructuredTranslationObject): {
  total: number;
  translated: number;
} {
  let total = 0;
  let translated = 0;

  const visit = (node: StructuredTranslationObject) => {
    for (const nestedValue of Object.values(node)) {
      if (typeof nestedValue === "string") {
        total += 1;
        if (nestedValue.trim()) {
          translated += 1;
        }
        continue;
      }

      visit(nestedValue);
    }
  };

  visit(value);

  return { total, translated };
}

function collectStructuredSearchTokens(
  value: StructuredTranslationObject,
  tokens: string[],
) {
  for (const [nestedKey, nestedValue] of Object.entries(value)) {
    tokens.push(nestedKey.toLowerCase());

    if (typeof nestedValue === "string") {
      tokens.push(nestedValue.toLowerCase());
      continue;
    }

    collectStructuredSearchTokens(nestedValue, tokens);
  }
}

export function parseStructuredTranslationValue(
  value: string,
): StructuredTranslationObject | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (!isStructuredTranslationObject(parsed)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function isTranslatedValue(value: string): boolean {
  const structured = parseStructuredTranslationValue(value);
  if (!structured) {
    return value.trim().length > 0;
  }

  const stats = countStructuredLeaves(structured);
  return stats.total > 0 && stats.translated === stats.total;
}

function hasMissingTranslationValue(value: string): boolean {
  const structured = parseStructuredTranslationValue(value);
  if (!structured) {
    return !value.trim();
  }

  const stats = countStructuredLeaves(structured);
  return stats.total === 0 || stats.translated < stats.total;
}

function isLanguageMapObject(value: unknown): value is Record<string, string> {
  if (!isPlainObject(value)) {
    return false;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return false;
  }

  return entries.every(
    ([key, entryValue]) =>
      languageCodePattern.test(key) && typeof entryValue === "string",
  );
}

export function normalizeTranslationPayload(
  payload: unknown,
): NormalizedPayload {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("JSON formatas neteisingas: tikimasi objekto.");
  }

  const source = payload as Record<string, unknown>;
  const keys = Object.keys(source);
  if (keys.length === 0) {
    return { languages: ["en", "lt"], translations: {} };
  }

  const languages = new Set<LanguageCode>();
  const translations: TranslationMap = {};
  const defaultSourceLanguage: LanguageCode = "en";
  let hasLanguageMapEntries = false;
  let hasDefaultSourceEntries = false;

  const collectEntry = (path: string, entry: unknown) => {
    if (typeof entry === "string") {
      hasDefaultSourceEntries = true;
      languages.add(defaultSourceLanguage);
      translations[path] = {
        [defaultSourceLanguage]: entry,
      };
      return;
    }

    if (isLanguageMapObject(entry)) {
      hasLanguageMapEntries = true;
      translations[path] = {};

      for (const [language, value] of Object.entries(entry)) {
        languages.add(language);
        translations[path][language] = value;
      }

      return;
    }

    if (!isPlainObject(entry)) {
      throw new Error(
        `Raktas "${path}" turi būti tekstas, objektas su kalbomis arba nested objektas.`,
      );
    }

    const nestedEntries = Object.entries(entry);
    if (nestedEntries.length === 0) {
      throw new Error(`Raktas "${path}" negali būti tuščias objektas.`);
    }

    for (const [nestedKey, nestedValue] of nestedEntries) {
      collectEntry(`${path}.${nestedKey}`, nestedValue);
    }
  };

  for (const key of keys) {
    collectEntry(key, source[key]);
  }

  const languageList = Array.from(languages);
  if (
    hasDefaultSourceEntries &&
    !hasLanguageMapEntries &&
    !languageList.includes("lt")
  ) {
    languageList.push("lt");
  }

  for (const key of Object.keys(translations)) {
    for (const language of languageList) {
      translations[key][language] = translations[key][language] ?? "";
    }
  }

  return {
    languages: languageList.length > 0 ? languageList : ["en", "lt"],
    translations,
  };
}

export function addNewTranslationKey(
  current: TranslationMap,
  languages: LanguageCode[],
  key: string,
): TranslationMap {
  const trimmed = key.trim();
  if (!trimmed) {
    throw new Error("Raktas negali būti tuščias.");
  }

  if (current[trimmed]) {
    throw new Error("Toks raktas jau egzistuoja.");
  }

  const next: TranslationMap = {
    ...current,
    [trimmed]: {},
  };

  for (const language of languages) {
    next[trimmed][language] = "";
  }

  return next;
}

export function setTranslationValue(
  current: TranslationMap,
  key: string,
  language: LanguageCode,
  value: string,
): TranslationMap {
  if (!current[key]) {
    return current;
  }

  return {
    ...current,
    [key]: {
      ...current[key],
      [language]: value,
    },
  };
}

export function calculateCompletion(
  translations: TranslationMap,
  language: LanguageCode,
): CompletionBadge {
  const keys = Object.keys(translations);
  const total = keys.length;

  if (total === 0) {
    return { language, percent: 0, translated: 0, total: 0 };
  }

  const translated = keys.reduce((count, key) => {
    const value = translations[key]?.[language] ?? "";
    return isTranslatedValue(value) ? count + 1 : count;
  }, 0);

  return {
    language,
    translated,
    total,
    percent: Math.round((translated / total) * 100),
  };
}

export function serializeTranslations(translations: TranslationMap): string {
  const exportPayload: Record<
    string,
    Record<string, string | StructuredTranslationObject>
  > = {};

  for (const [key, entry] of Object.entries(translations)) {
    exportPayload[key] = {};

    for (const [language, value] of Object.entries(entry)) {
      const parsed = parseStructuredTranslationValue(value);
      if (parsed) {
        exportPayload[key][language] = parsed;
        continue;
      }

      exportPayload[key][language] = value;
    }
  }

  return JSON.stringify(exportPayload, null, 2);
}

export function getFilteredKeys(
  translations: TranslationMap,
  search: string,
  untranslatedOnly: boolean,
  languageFilter?: LanguageCode,
): string[] {
  const query = search.trim().toLowerCase();

  return Object.keys(translations).filter((key) => {
    const entry = translations[key];
    const values = Object.values(entry);
    const searchableValues = values.flatMap((value) => {
      const structured = parseStructuredTranslationValue(value);
      if (!structured) {
        return [value.toLowerCase()];
      }

      const tokens: string[] = [];
      collectStructuredSearchTokens(structured, tokens);
      return tokens;
    });

    const matchSearch =
      !query ||
      key.toLowerCase().includes(query) ||
      searchableValues.some((value) => value.includes(query));

    if (!matchSearch) {
      return false;
    }

    if (!untranslatedOnly) {
      return true;
    }

    if (languageFilter) {
      return hasMissingTranslationValue(entry[languageFilter] ?? "");
    }

    return values.some((value) => hasMissingTranslationValue(value));
  });
}
