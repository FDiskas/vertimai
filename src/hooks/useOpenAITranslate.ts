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
        throw new Error("Pirmiausia įveskite OPENAI_API_KEY nustatymuose.");
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
            "OpenAI užklausa nepavyko. Patikrinkite API raktą ar kvotą.",
          );
        }

        const data = (await response.json()) as { output_text?: string };
        const translated = data.output_text?.trim();

        if (!translated) {
          throw new Error("OpenAI negrąžino vertimo teksto.");
        }

        return translated;
      } catch (requestError) {
        const message =
          requestError instanceof Error
            ? requestError.message
            : "Vertimas nepavyko.";
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
