import { execFileSync } from "node:child_process";

/**
 * Varredura de segredos nas linhas ADICIONADAS do diff BASE_SHA..HEAD_SHA.
 * Padrões de alta confiança, para não transformar o CI em alarme instável.
 *
 * Uso: BASE_SHA=... HEAD_SHA=... node scripts/automation/check-secrets.mjs
 */

const { BASE_SHA, HEAD_SHA } = process.env;
if (!BASE_SHA || !HEAD_SHA) {
  console.error("BASE_SHA e HEAD_SHA são obrigatórios.");
  process.exit(2);
}

const PATTERNS = [
  { name: "chave privada PEM", regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  { name: "token GitHub", regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/ },
  { name: "token GitHub fine-grained", regex: /\bgithub_pat_[A-Za-z0-9_]{50,}\b/ },
  { name: "AWS Access Key", regex: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "token Slack", regex: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { name: "chave de API OpenAI/Anthropic", regex: /\b(?:sk|sk-ant)-[A-Za-z0-9_-]{20,}\b/ },
  { name: "token Vercel", regex: /\bvercel_[A-Za-z0-9]{24,}\b/ },
  { name: "URL com credenciais embutidas", regex: /\bhttps?:\/\/[^\s/@"']+:[^\s/@"']+@[^\s"']+/ },
  { name: "atribuição literal de segredo", regex: /\b(?:api[_-]?key|secret|password|senha|token)\b\s*[:=]\s*["'][A-Za-z0-9+/_-]{16,}["']/i },
];

const diff = execFileSync("git", ["diff", `${BASE_SHA}..${HEAD_SHA}`], {
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

const findings = [];
let currentFile = "";
for (const line of diff.split("\n")) {
  if (line.startsWith("+++ b/")) {
    currentFile = line.slice(6);
    continue;
  }
  if (!line.startsWith("+") || line.startsWith("+++")) continue;
  const added = line.slice(1);
  // .env.example e documentação usam placeholders óbvios.
  if (/ca-pub-\d+/.test(added) && !/(secret|password|token)/i.test(added)) continue;
  for (const { name, regex } of PATTERNS) {
    if (regex.test(added)) {
      findings.push(`${currentFile}: possível ${name} adicionado no diff.`);
    }
  }
}

if (findings.length > 0) {
  console.error(`Varredura de segredos falhou:\n- ${[...new Set(findings)].join("\n- ")}`);
  process.exit(1);
}
console.log("Varredura de segredos: nenhum padrão de credencial encontrado nas linhas adicionadas.");
