import { useCallback, useState } from "react";

interface TranslateParams {
  text: string;
  targetLanguage: string;
  sourceLanguage?: string;
  apiKey: string;
}

interface UseOpenAITranslateResult {
  isTranslating: boolean;
  error: string | null;
  translate: (params: TranslateParams) => Promise<string>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTranslatedText(data: unknown): string | null {
  if (!isRecord(data)) {
    return null;
  }

  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    for (const outputItem of data.output) {
      if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
        continue;
      }

      for (const contentItem of outputItem.content) {
        if (!isRecord(contentItem)) {
          continue;
        }

        if (
          (contentItem.type === "output_text" || contentItem.type === "text") &&
          typeof contentItem.text === "string" &&
          contentItem.text.trim()
        ) {
          return contentItem.text.trim();
        }
      }
    }
  }

  if (Array.isArray(data.choices)) {
    const firstChoice = data.choices[0];
    if (isRecord(firstChoice) && isRecord(firstChoice.message)) {
      const content = firstChoice.message.content;

      if (typeof content === "string" && content.trim()) {
        return content.trim();
      }

      if (Array.isArray(content)) {
        for (const part of content) {
          if (!isRecord(part)) {
            continue;
          }

          if (typeof part.text === "string" && part.text.trim()) {
            return part.text.trim();
          }
        }
      }
    }
  }

  return null;
}

export function useOpenAITranslate(): UseOpenAITranslateResult {
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const translate = useCallback(
    async ({
      text,
      targetLanguage,
      sourceLanguage,
      apiKey,
    }: TranslateParams) => {
      if (!apiKey.trim()) {
        throw new Error("Please enter OPENAI_API_KEY in settings first.");
      }

      if (!text.trim()) {
        return "";
      }

      setIsTranslating(true);
      setError(null);

      try {
        const response = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            input: [
              {
                role: "system",
                content:
                  "You are a professional software localization translator. Return only translated text without explanations.",
              },
              {
                role: "user",
                content: `Translate this text from ${sourceLanguage ?? "auto"} to ${targetLanguage}: ${text}`,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(
            "OpenAI request failed. Check your API key or quota.",
          );
        }

        const data = (await response.json()) as unknown;
        const translated = extractTranslatedText(data);

        if (!translated) {
          throw new Error("OpenAI did not return translated text.");
        }

        return translated;
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Translation failed.";
        setError(message);
        throw new Error(message);
      } finally {
        setIsTranslating(false);
      }
    },
    [],
  );

  return { isTranslating, error, translate };
}
