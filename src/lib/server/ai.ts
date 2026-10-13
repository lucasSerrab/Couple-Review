import { ApiError } from "./http";
import { clampNota } from "../format";

type Provider = "openai" | "gemini";

function provider(): Provider {
  const forced = process.env.AI_PROVIDER;
  if (forced === "openai" && process.env.OPENAI_API_KEY) return "openai";
  if (forced === "gemini" && process.env.GEMINI_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  throw new ApiError(503, "Nenhuma chave de IA configurada.");
}

/** "audio/webm;codecs=opus" -> "audio/webm" */
export function mimeBase(mime: string): string {
  return (mime.split(";")[0] || "audio/webm").trim().toLowerCase();
}

export function extensaoDoAudio(mime: string): string {
  const m = mimeBase(mime);
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "m4a";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("wav")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  return "webm";
}

export async function transcrever(audio: ArrayBuffer, mime: string): Promise<string> {
  const texto = provider() === "openai" ? await transcreverOpenAI(audio, mime) : await transcreverGemini(audio, mime);
  const limpo = texto.trim();
  if (!limpo) throw new ApiError(422, "Não consegui ouvir nada nesse áudio. Tente gravar de novo, mais perto do microfone.");
  return limpo;
}

export interface Resumo {
  resumo: string;
  nota: number;
}

export async function resumir(transcricao: string, titulo: string): Promise<Resumo> {
  const raw = provider() === "openai" ? await resumirOpenAI(transcricao, titulo) : await resumirGemini(transcricao, titulo);
  return interpretarResumo(raw, transcricao);
}

// ---------------------------------------------------------------------------

const INSTRUCAO = (titulo: string) =>
  `Você ajuda um casal a registrar o que achou de filmes, séries e animes. ` +
  `Abaixo está a transcrição de um áudio de uma pessoa avaliando "${titulo}". ` +
  `Escreva um resumo curto da opinião (no máximo 3 frases), em português do Brasil, na primeira pessoa, ` +
  `mantendo o jeito e o tom de quem falou, sem inventar nada que não foi dito. ` +
  `Sugira também uma nota de 0 a 10 em passos de 0,5; se a pessoa disse a nota, use exatamente ela. ` +
  `Responda só com JSON no formato {"resumo": string, "nota": number}.`;

/** Aceita JSON puro ou cercado por ```; se o modelo falhar, cai no começo da transcrição. */
export function interpretarResumo(raw: string, transcricao: string): Resumo {
  const limpo = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
  try {
    const j = JSON.parse(limpo) as { resumo?: unknown; nota?: unknown };
    const resumo = typeof j.resumo === "string" ? j.resumo.trim() : "";
    const bruta = typeof j.nota === "number" ? j.nota : Number(String(j.nota).replace(",", "."));
    if (resumo) return { resumo, nota: Number.isFinite(bruta) ? clampNota(bruta) : 7 };
  } catch {
    // cai no fallback
  }
  return { resumo: transcricao.slice(0, 280), nota: 7 };
}

async function transcreverOpenAI(audio: ArrayBuffer, mime: string): Promise<string> {
  const form = new FormData();
  form.append("file", new File([audio], `avaliacao.${extensaoDoAudio(mime)}`, { type: mimeBase(mime) }));
  form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
  form.append("language", "pt");
  const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: form,
  });
  if (!res.ok) {
    console.error("[openai:transcribe]", res.status, await res.text().catch(() => ""));
    throw new ApiError(502, "A transcrição falhou. Tente de novo.");
  }
  const j = (await res.json()) as { text?: string };
  return j.text ?? "";
}

async function resumirOpenAI(transcricao: string, titulo: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_SUMMARY_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: INSTRUCAO(titulo) },
        { role: "user", content: transcricao },
      ],
    }),
  });
  if (!res.ok) {
    console.error("[openai:summary]", res.status, await res.text().catch(() => ""));
    throw new ApiError(502, "O resumo falhou. Tente de novo.");
  }
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return j.choices?.[0]?.message?.content ?? "";
}

async function gemini(parts: unknown[], json: boolean): Promise<string> {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": process.env.GEMINI_API_KEY!, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: json ? { responseMimeType: "application/json", temperature: 0.3 } : { temperature: 0 },
    }),
  });
  if (!res.ok) {
    console.error("[gemini]", res.status, await res.text().catch(() => ""));
    throw new ApiError(502, "A IA não respondeu. Tente de novo.");
  }
  const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  return (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function transcreverGemini(audio: ArrayBuffer, mime: string): Promise<string> {
  const data = Buffer.from(audio).toString("base64");
  return gemini(
    [
      {
        text: "Transcreva fielmente este áudio em português do Brasil, com as palavras ditas do jeito que foram ditas. Responda apenas com a transcrição.",
      },
      { inline_data: { mime_type: mimeBase(mime), data } },
    ],
    false,
  );
}

async function resumirGemini(transcricao: string, titulo: string): Promise<string> {
  return gemini([{ text: INSTRUCAO(titulo) }, { text: `Transcrição:\n${transcricao}` }], true);
}

// ---------------------------------------------------------------------------
// Sem chave de IA: a transcrição vem do reconhecimento de voz do navegador e o
// resumo é feito aqui, sem modelo. Fica mais simples, mas funciona sem cadastro.
// ---------------------------------------------------------------------------

export function temIA(): boolean {
  return Boolean(process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);
}

const NUMEROS: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

export function resumirLocal(transcricao: string): Resumo {
  const texto = transcricao.replace(/\s+/g, " ").trim();
  // "nota 9,5", "nota nove e meio", "dou 8"
  let nota = 7;
  const padrao = /(?:nota|dou|dei|merece|vale)\s+(?:é\s+|foi\s+|um\s+|uma\s+)?(\d{1,2}(?:[.,]\d)?|zero|uma?|duas?|dois|tr[eê]s|quatro|cinco|seis|sete|oito|nove|dez)\b(\s+e\s+meio)?/gi;
  for (const m of texto.matchAll(padrao)) {
    const bruto = m[1].toLowerCase().replace(",", ".");
    const base = /^\d/.test(bruto) ? Number(bruto) : NUMEROS[bruto];
    if (base != null && base <= 10) {
      nota = clampNota(base + (m[2] ? 0.5 : 0));
      break;
    }
  }
  const frases = texto.match(/[^.!?]+[.!?]?/g) ?? [texto];
  let resumo = "";
  for (const f of frases) {
    if ((resumo + f).length > 320 && resumo) break;
    resumo += f;
  }
  return { resumo: resumo.trim().slice(0, 400), nota };
}
