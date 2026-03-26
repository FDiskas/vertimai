export const enUiMessages = {
  "common.add": "Add",
  "common.cancel": "Cancel",
  "common.clear": "Clear",
  "common.delete": "Delete",
  "common.done": "Done",
  "common.error": "Error",
  "common.export": "Export",
  "common.reset": "Reset",
  "common.save": "Save",
  "common.settings": "Settings",

  "app.loading": "Loading...",
  "app.title": "Translation Studio",
  "app.subtitle": "Fast client-side JSON translation editor with AI assistance",
  "app.quickExport": "Quick Export",
  "app.metric.translationKeys": "Translation keys",
  "app.metric.shownAfterFilter": "Shown after filter",
  "app.metric.untranslated": "Untranslated ({language})",
  "app.scrollToTop": "Scroll to top",
  "app.toast.keyAdded": 'Key "{key}" added successfully.',
  "app.toast.keyDeleted": 'Key "{key}" deleted.',
  "app.toast.addKeyFailed": "Failed to add key",
  "app.toast.deleteKeyFailed": "Failed to delete key",
  "app.toast.clearAllDone": "All data has been cleared.",
  "app.toast.keyEmpty": "Key cannot be empty.",

  "dialog.addKey.title": "Add new key",
  "dialog.addKey.description":
    "Enter a new translation key (for example, home.title).",
  "dialog.addKey.placeholder": "home.title",
  "dialog.deleteKey.title": "Delete key?",
  "dialog.deleteKey.confirmWithKey":
    'Are you sure you want to delete key "{key}"?',
  "dialog.deleteKey.confirmGeneric":
    "Are you sure you want to delete this key?",
  "dialog.clearAll.title": "Clear all data?",
  "dialog.clearAll.description":
    "This will remove all imported translations, your API key, and IndexedDB data.",

  "sidebar.title": "Languages",
  "sidebar.description": "Select two languages for split view mode.",
  "sidebar.left": "Left",
  "sidebar.right": "Right",
  "sidebar.addLanguage": "Add language",
  "sidebar.addLanguagePlaceholder": "for example, de or fr",
  "sidebar.baseLanguageCannotBeRemoved": "Base language cannot be removed",
  "sidebar.removeLanguage": "Remove {language}",

  "toolbar.workingFile": "Working file",
  "toolbar.showing": "Showing {visible} / {total}",
  "toolbar.searchPlaceholder": "Search by key or value...",
  "toolbar.clearSearch": "Clear search",
  "toolbar.untranslatedOnly": "Untranslated only",
  "toolbar.addNewKey": "Add New Key",

  "upload.title": "Upload a translations JSON file",
  "upload.description": "Drag and drop or choose a file manually.",
  "upload.button": "Upload",

  "settings.apiKeyDescription":
    "OPENAI_API_KEY from https://platform.openai.com/api-keys",
  "settings.apiKeyLabel": "OPENAI_API_KEY",
  "settings.hiddenHint":
    "The field is hidden as a password; the key is only visible to you locally.",
  "settings.configured": "Configured",
  "settings.missing": "Missing",

  "grid.exampleTitle": "lib/translate.ts",
  "grid.exampleDescription": "Example of how to use the translations JSON file",
  "grid.filteredInfo": "The table only shows active filtered results.",
  "grid.mainLanguage": "Main language:",
  "grid.original": "Original ({language})",
  "grid.translation": "Translation ({language})",
  "grid.translationKeyAria": "Translation key {key}",
  "grid.copyKey": "Copy key",
  "grid.deleteKey": "Delete key",
  "grid.progressFields": "{filled}/{total} fields",
  "grid.progressMissing": "Missing translation",
  "grid.progressChars": "{count} chars",
  "grid.aiTranslate": "AI Translate",
  "grid.translating": "Translating...",

  "openai.error.missingApiKey":
    "Please enter OPENAI_API_KEY in settings first.",
  "openai.error.requestFailed":
    "OpenAI request failed. Check your API key or quota.",
  "openai.error.noTranslatedText": "OpenAI did not return translated text.",
  "openai.error.translationFailed": "Translation failed.",
} as const;
