export type LanguageCode = string;

export type TranslationEntry = Record<LanguageCode, string>;

export type TranslationMap = Record<string, TranslationEntry>;

export interface PersistedTranslationData {
  fileName: string;
  languages: LanguageCode[];
  baseLanguage: LanguageCode;
  translations: TranslationMap;
  updatedAt: string;
}

export interface CompletionBadge {
  language: LanguageCode;
  percent: number;
  translated: number;
  total: number;
}
