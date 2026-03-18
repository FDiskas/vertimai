import { create } from "zustand";
import {
  addNewTranslationKey,
  calculateCompletion,
  getFilteredKeys,
  normalizeTranslationPayload,
  serializeTranslations,
  setTranslationValue,
} from "../lib/translation-utils";
import {
  clearPersistedData,
  loadPersistedData,
  savePersistedData,
} from "../lib/storage";
import type {
  CompletionBadge,
  LanguageCode,
  TranslationMap,
} from "../types/translation";

const API_KEY_STORAGE_KEY = "vertimai-openai-api-key";

interface TranslationState {
  fileName: string;
  translations: TranslationMap;
  languages: LanguageCode[];
  baseLanguage: LanguageCode;
  selectedLanguages: [LanguageCode, LanguageCode];
  search: string;
  untranslatedOnly: boolean;
  apiKey: string;
  isReady: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  importFile: (fileName: string, rawJson: string) => Promise<void>;
  updateTranslation: (
    key: string,
    language: LanguageCode,
    value: string,
  ) => Promise<void>;
  addKey: (key: string) => Promise<void>;
  removeKey: (key: string) => Promise<void>;
  addLanguage: (language: LanguageCode) => Promise<void>;
  removeLanguage: (language: LanguageCode) => Promise<void>;
  setSearch: (value: string) => void;
  setUntranslatedOnly: (value: boolean) => void;
  setSelectedLanguages: (left: LanguageCode, right: LanguageCode) => void;
  setApiKey: (value: string) => void;
  exportJson: () => string;
  getCompletion: (language: LanguageCode) => CompletionBadge;
  getVisibleKeys: () => string[];
  clearAll: () => Promise<void>;
}

async function persistSnapshot(
  fileName: string,
  translations: TranslationMap,
  languages: LanguageCode[],
  baseLanguage: LanguageCode,
) {
  await savePersistedData({
    fileName,
    translations,
    languages,
    baseLanguage,
    updatedAt: new Date().toISOString(),
  });
}

function getInitialApiKey() {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? "";
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  fileName: "translations.json",
  translations: {},
  languages: ["en", "lt"],
  baseLanguage: "en",
  selectedLanguages: ["en", "lt"],
  search: "",
  untranslatedOnly: false,
  apiKey: getInitialApiKey(),
  isReady: false,
  error: null,

  initialize: async () => {
    try {
      const persisted = await loadPersistedData();
      if (!persisted) {
        set({ isReady: true });
        return;
      }

      const first = persisted.languages[0] ?? "en";
      const second = persisted.languages[1] ?? first;

      set({
        fileName: persisted.fileName,
        translations: persisted.translations,
        languages: persisted.languages,
        baseLanguage: persisted.baseLanguage,
        selectedLanguages: [first, second],
        isReady: true,
      });
    } catch {
      set({
        error: "Nepavyko perskaityti duomenų iš IndexedDB.",
        isReady: true,
      });
    }
  },

  importFile: async (fileName, rawJson) => {
    try {
      const parsed = JSON.parse(rawJson);
      const normalized = normalizeTranslationPayload(parsed);
      const baseLanguage = normalized.languages.includes("en")
        ? "en"
        : normalized.languages[0];
      const secondLanguage =
        normalized.languages.find((language) => language !== baseLanguage) ??
        baseLanguage;

      set({
        fileName,
        translations: normalized.translations,
        languages: normalized.languages,
        baseLanguage,
        selectedLanguages: [baseLanguage, secondLanguage],
        error: null,
      });

      await persistSnapshot(
        fileName,
        normalized.translations,
        normalized.languages,
        baseLanguage,
      );
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Nepavyko įkelti failo.",
      });
    }
  },

  updateTranslation: async (key, language, value) => {
    const state = get();
    const next = setTranslationValue(state.translations, key, language, value);
    set({ translations: next, error: null });
    await persistSnapshot(
      state.fileName,
      next,
      state.languages,
      state.baseLanguage,
    );
  },

  addKey: async (key) => {
    const state = get();

    try {
      const next = addNewTranslationKey(
        state.translations,
        state.languages,
        key,
      );
      set({ translations: next, error: null });
      await persistSnapshot(
        state.fileName,
        next,
        state.languages,
        state.baseLanguage,
      );
    } catch (error) {
      set({
        error:
          error instanceof Error ? error.message : "Nepavyko pridėti rakto.",
      });
    }
  },

  removeKey: async (key) => {
    const state = get();

    if (!state.translations[key]) {
      set({ error: "Toks raktas nerastas." });
      return;
    }

    const { [key]: _removed, ...nextTranslations } = state.translations;

    set({
      translations: nextTranslations,
      error: null,
    });

    await persistSnapshot(
      state.fileName,
      nextTranslations,
      state.languages,
      state.baseLanguage,
    );
  },

  addLanguage: async (language) => {
    const state = get();
    const normalized = language.trim().toLowerCase();

    if (!normalized) {
      set({ error: "Kalbos kodas negali būti tuščias." });
      return;
    }

    if (!/^[a-z]{2,3}(?:[-_][a-z0-9]{2,8})*$/.test(normalized)) {
      set({ error: "Neteisingas kalbos kodas. Pvz: lt, en, en-us." });
      return;
    }

    if (state.languages.includes(normalized)) {
      set({ error: "Tokia kalba jau pridėta." });
      return;
    }

    const nextLanguages = [...state.languages, normalized];
    const nextTranslations: TranslationMap = {};

    for (const [key, entry] of Object.entries(state.translations)) {
      nextTranslations[key] = {
        ...entry,
        [normalized]: entry[normalized] ?? "",
      };
    }

    set({
      languages: nextLanguages,
      translations: nextTranslations,
      error: null,
    });

    await persistSnapshot(
      state.fileName,
      nextTranslations,
      nextLanguages,
      state.baseLanguage,
    );
  },

  removeLanguage: async (language) => {
    const state = get();

    if (!state.languages.includes(language)) {
      set({ error: "Tokios kalbos sąraše nėra." });
      return;
    }

    if (language === state.baseLanguage) {
      set({ error: "Bazinės kalbos ištrinti negalima." });
      return;
    }

    if (state.languages.length <= 2) {
      set({ error: "Turi likti bent dvi kalbos split view režimui." });
      return;
    }

    const nextLanguages = state.languages.filter((item) => item !== language);
    const nextTranslations: TranslationMap = {};

    for (const [key, entry] of Object.entries(state.translations)) {
      const { [language]: _removed, ...rest } = entry;
      nextTranslations[key] = rest;
    }

    const [left, right] = state.selectedLanguages;
    const nextLeft = nextLanguages.includes(left) ? left : state.baseLanguage;
    const nextRight =
      nextLanguages.includes(right) && right !== nextLeft
        ? right
        : (nextLanguages.find((item) => item !== nextLeft) ?? nextLeft);

    set({
      languages: nextLanguages,
      translations: nextTranslations,
      selectedLanguages: [nextLeft, nextRight],
      error: null,
    });

    await persistSnapshot(
      state.fileName,
      nextTranslations,
      nextLanguages,
      state.baseLanguage,
    );
  },

  setSearch: (value) => {
    set({ search: value });
  },

  setUntranslatedOnly: (value) => {
    set({ untranslatedOnly: value });
  },

  setSelectedLanguages: (left, right) => {
    const state = get();
    const fallback = state.languages[0] ?? "en";

    set({
      selectedLanguages: [
        state.languages.includes(left) ? left : fallback,
        state.languages.includes(right) ? right : fallback,
      ],
    });
  },

  setApiKey: (value) => {
    localStorage.setItem(API_KEY_STORAGE_KEY, value);
    set({ apiKey: value });
  },

  exportJson: () => {
    return serializeTranslations(get().translations);
  },

  getCompletion: (language) => {
    return calculateCompletion(get().translations, language);
  },

  getVisibleKeys: () => {
    const state = get();
    const focusLanguage = state.untranslatedOnly
      ? state.selectedLanguages[1]
      : undefined;
    return getFilteredKeys(
      state.translations,
      state.search,
      state.untranslatedOnly,
      focusLanguage,
    );
  },

  clearAll: async () => {
    await clearPersistedData();
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    set({
      fileName: "translations.json",
      translations: {},
      languages: ["en", "lt"],
      baseLanguage: "en",
      selectedLanguages: ["en", "lt"],
      search: "",
      untranslatedOnly: false,
      apiKey: "",
      error: null,
    });
  },
}));
