// Real — wraps POST /api/translate, which itself proxies eGov AI Core's translator (see
// backend/src/services/egovApi.service.ts's translateText). Used to auto-fill a Tagalog
// field from whatever's typed into its English counterpart while authoring
// fields/benefits/groups (see hooks/useAutoTranslate.ts).
import { apiFetch } from "@/lib/api";

export interface Translation {
  original_prompt: string;
  source_lang: string;
  target_lang: string;
  translate_from: { code: string; label: string };
  translated_prompt: string;
  transliterated_prompt: string;
}

export async function translateText(prompt: string, token: string, sourceLang = "en", targetLang = "fil"): Promise<Translation> {
  return apiFetch<Translation>("/api/translate", {
    method: "POST",
    token,
    body: JSON.stringify({ prompt, sourceLang, targetLang }),
  });
}
