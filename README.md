# Translation Studio

A fast, client-side JSON translation editor with AI assistance. Manage multi-language translation files directly in your browser — no server required, no data ever leaves your machine.

## Features

- **Drag-and-drop import** — Upload any JSON translation file
- **Grid editor** — Edit all languages side-by-side in a clean table view
- **Split view** — Compare two languages at once
- **AI translation** — Auto-translate missing values using OpenAI (bring your own key)
- **Search & filter** — Find keys by name or value; show only untranslated entries
- **Language management** — Add or remove languages on the fly with completion percentages
- **Export** — Download a clean, formatted JSON file ready to drop into your project
- **Persistent** — Data is saved in IndexedDB and survives page refreshes
- **Keyboard shortcuts** — `Ctrl+N` to add a key, `Ctrl+Enter` to confirm dialogs

## Getting Started

```bash
pnpm install
pnpm dev
```

Then open [http://localhost:5173](http://localhost:5173).

### Build

```bash
pnpm build
```

### Tests

```bash
pnpm test
```

## Using the App

1. **Upload a file** — Drag a JSON translation file onto the upload zone, or click to browse. Use **Load demo data** to try it without a file.
2. **Edit translations** — Click any cell in the grid to edit. Changes save automatically.
3. **Add keys** — Click **Add key** in the toolbar or press `Ctrl+N`.
4. **Add languages** — Open the language sidebar and type a BCP 47 code (e.g. `fr`, `de`, `pt-BR`).
5. **AI translate** — Click the AI button on any empty cell after setting your OpenAI API key in **Settings**.
6. **Export** — Click **Export** in the toolbar to download the updated JSON file.

## Exported JSON Format

The exported file is a formatted JSON object where each top-level key maps to an object of `languageCode → translation` pairs.

### Basic flat structure

```json
{
  "commonSave": {
    "en": "Save",
    "lt": "Išsaugoti",
    "de": "Speichern"
  },
  "commonCancel": {
    "en": "Cancel",
    "lt": "Atšaukti",
    "de": "Abbrechen"
  }
}
```

### Nested keys (dot notation)

Keys that contain dots are reconstructed as nested objects on export:

```json
{
  "home": {
    "title": {
      "en": "Home",
      "lt": "Pradžia"
    },
    "description": {
      "en": "Welcome to our app",
      "lt": "Sveiki atvykę"
    }
  }
}
```

Inside the editor these appear as flat keys (`home.title`, `home.description`). On export they are serialized back to the nested structure above.

### Plural values

Translation values can be objects with `one` and `other` fields for pluralization:

```json
{
  "itemCount": {
    "en": { "one": "1 item", "other": "{count} items" },
    "lt": { "one": "1 elementas", "other": "{count} elementų" }
  }
}
```

### Language codes

Language codes follow the BCP 47 format: `en`, `lt`, `fr`, `en-US`, `pt-BR`, `zh-Hans`, etc.

### Missing translations

Keys missing a translation for a given language are exported with an empty string `""`. Use the **Untranslated only** filter to find them quickly.

## Using the Exported File in Your Project

The project ships a ready-made TypeScript helper at `src/templates/translate-template.ts` that you can copy alongside your exported JSON file.

### Setup

Copy `translate-template.ts` into your project and point it at your exported file:

```ts
// translate-template.ts (top of file)
import translations from "./your-exported-translations.json";
```

### Basic usage

```ts
import { translate, setTranslateLanguage } from "./translate-template";

// translate is pre-initialized to the default language ("en")
console.log(translate.commonSave); // → "Save"

// Switch to another language at runtime
setTranslateLanguage("lt");
console.log(translate.commonSave); // → "Išsaugoti"
```

The `translate` object is fully typed — your editor will autocomplete every key.

### String interpolation with `withParams`

Use `{placeholder}` syntax in your translation values:

```json
{
  "greeting": {
    "en": "Hello {name}, you have {count} messages",
    "lt": "Sveiki {name}, turite {count} žinučių"
  }
}
```

```ts
import { translate, withParams } from "./translate-template";

const message = withParams(translate.greeting, { name: "Jonas", count: 5 });
// → "Hello Jonas, you have 5 messages"
```

Unknown placeholders are left as-is in the output (e.g. `{missing}` stays `{missing}`).

### Pluralization

When a translation value is a `{ one, other }` object, the key becomes a function that accepts a count:

```json
{
  "itemCount": {
    "en": { "one": "1 item", "other": "{count} items" },
    "lt": { "one": "1 elementas", "other": "{count} elementų" }
  }
}
```

```ts
import { translate, withParams } from "./translate-template";

const label = withParams(translate.itemCount(3), { count: 3 });
// → "3 items"

const single = translate.itemCount(1);
// → "1 item"
```

### Changing the default language

The default language is `"en"`. To change it, update the `DEFAULT_LANGUAGE` constant at the top of `translate-template.ts`:

```ts
const DEFAULT_LANGUAGE = "fr" as const;
```

### Available exports

| Export                         | Type                                                   | Description                                                                                                                               |
| ------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `translate`                    | `Translate`                                            | Mutable object with all translation keys. String keys hold the translated value; plural keys hold a `(count: number) => string` function. |
| `setTranslateLanguage(lang)`   | `(LanguageCode) => void`                               | Switch the active language. Mutates `translate` in place so all existing references update.                                               |
| `withParams(template, params)` | `(string, Record<string, string \| number>) => string` | Replace `{placeholder}` tokens in a translated string.                                                                                    |
| `LanguageCode`                 | type                                                   | Union type of all language codes present in the JSON file.                                                                                |

## AI Translation

Go to **Settings** and enter your OpenAI API key. It is stored in `localStorage` and never sent anywhere except directly to the OpenAI API from your browser.

Once set, an AI button appears on empty translation cells. Clicking it sends the base-language value to OpenAI and fills in the translation.

## Data Storage

| What                   | Where                                      |
| ---------------------- | ------------------------------------------ |
| Translation data       | IndexedDB (`vertimai-db`)                  |
| UI language preference | `localStorage` (`vertimai-ui-locale`)      |
| OpenAI API key         | `localStorage` (`vertimai-openai-api-key`) |

All data is stored locally in your browser. Clearing site data will reset the app.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Zustand** — state management
- **IndexedDB** (`idb`) — persistent storage
- **Radix UI** + **Tailwind CSS** — UI components
- **OpenAI API** — AI translation
- **Vitest** — unit tests

## License

MIT
