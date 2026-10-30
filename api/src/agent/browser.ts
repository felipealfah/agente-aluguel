import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EGO_BIN = process.env.EGO_BROWSER_BIN ?? "ego-browser";
const TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Roda um script no Ego Lite (navegador real do usuário) via `ego-browser nodejs`.
 * `buildScript` recebe o caminho absoluto onde o script deve gravar o resultado em JSON
 * (a saída padrão do ego-browser reformata linhas longas, então não serve para dados).
 * Requer o Ego Lite aberto na máquina.
 */
export async function runBrowserScript<T>(buildScript: (resultPath: string) => string): Promise<T> {
  const resultPath = join(tmpdir(), `agente-aluguel-${randomUUID()}.json`);

  const { code, output } = await new Promise<{ code: number | null; output: string }>((resolve, reject) => {
    const child = spawn(EGO_BIN, ["nodejs"], { stdio: ["pipe", "pipe", "pipe"] });
    let output = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Tempo limite do navegador excedido"));
    }, TIMEOUT_MS);

    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Não foi possível iniciar o ego-browser (${err.message}). O Ego Lite está instalado?`));
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, output });
    });
    child.stdin.end(buildScript(resultPath));
  });

  try {
    return JSON.parse(await readFile(resultPath, "utf8")) as T;
  } catch {
    throw new Error(`ego-browser saiu (código ${code}) sem resultado: ${output.slice(-500)}`);
  } finally {
    await rm(resultPath, { force: true });
  }
}
