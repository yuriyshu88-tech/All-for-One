import { spawn } from "child_process";

type JsonMessage = {
  id?: number;
  method?: string;
  result?: any;
  error?: { message?: string };
  params?: any;
};

const codexBin = "/Applications/Codex.app/Contents/Resources/codex";

function textInput(text: string) {
  return {
    type: "text",
    text,
    text_elements: [],
  };
}

export async function askCodexDesktop(system: string, user: string, outputSchema?: unknown) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(codexBin, ["app-server", "--listen", "stdio://"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let nextId = 1;
    let buffer = "";
    let threadId = "";
    let finalText = "";
    let lastRetryMessage = "";
    let settled = false;

    const timeout = setTimeout(() => {
      finish(
        new Error(
          lastRetryMessage
            ? `Codex 桌面版调用超时。最后一次状态：${lastRetryMessage}`
            : "Codex 桌面版调用超时。请确认 Codex 已登录且网络可用，或先减少选择的视角数量。",
        ),
      );
    }, 180000);

    function finish(value: string | Error) {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timeout);
      child.kill();

      if (value instanceof Error) {
        reject(value);
      } else {
        resolve(value.trim());
      }
    }

    function send(method: string, params: unknown) {
      const id = nextId++;
      child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
      return id;
    }

    child.stderr.on("data", () => {
      // Codex app-server emits structured logs on stderr. They are noisy during
      // MCP startup and not useful for the product response.
    });

    child.on("error", (error) => finish(error));
    child.on("exit", () => {
      if (!settled && !finalText) {
        finish(new Error("Codex 桌面版连接已关闭，但没有返回回答。"));
      }
    });

    child.stdout.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (!line.trim()) {
          continue;
        }

        let message: JsonMessage;
        try {
          message = JSON.parse(line);
        } catch {
          continue;
        }

        if (message.error?.message) {
          finish(new Error(message.error.message));
          return;
        }

        if (message.method === "error") {
          const errorMessage =
            message.params?.error?.message ||
            message.params?.message ||
            "Codex 桌面版返回了错误，但没有提供错误详情。";
          const additionalDetails = message.params?.error?.additionalDetails;

          if (message.params?.willRetry) {
            lastRetryMessage = additionalDetails ? `${errorMessage} ${additionalDetails}` : errorMessage;
            continue;
          }

          finish(new Error(additionalDetails ? `${errorMessage} ${additionalDetails}` : errorMessage));
          return;
        }

        if (message.id === 1) {
          child.stdin.write(`${JSON.stringify({ method: "initialized" })}\n`);
          send("thread/start", {
            cwd: process.cwd(),
            approvalPolicy: "never",
            sandbox: "read-only",
            baseInstructions: system,
            ephemeral: true,
            threadSource: "user",
          });
          continue;
        }

        if (message.id === 2) {
          threadId = message.result?.thread?.id;
          if (!threadId) {
            finish(new Error("Codex 桌面版没有返回 threadId。"));
            return;
          }

          send("turn/start", {
            threadId,
            input: [textInput(user)],
            approvalPolicy: "never",
            sandboxPolicy: {
              type: "readOnly",
              networkAccess: false,
            },
            outputSchema,
          });
          continue;
        }

        if (message.method === "item/agentMessage/delta") {
          finalText += message.params?.delta || "";
          continue;
        }

        if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") {
          finalText = message.params.item.text || finalText;
          continue;
        }

        if (message.method === "turn/completed" && message.params?.threadId === threadId) {
          const turnError = message.params?.turn?.error;
          if (turnError?.message) {
            finish(
              new Error(
                turnError.additionalDetails
                  ? `${turnError.message} ${turnError.additionalDetails}`
                  : turnError.message,
              ),
            );
            return;
          }

          if (finalText.trim()) {
            finish(finalText);
          } else {
            finish(new Error("Codex 桌面版完成了推演，但没有生成文本。"));
          }
        }
      }
    });

    send("initialize", {
      clientInfo: {
        name: "all-for-one",
        version: "0.1.0",
      },
      capabilities: {
        experimentalApi: true,
        requestAttestation: false,
      },
    });
  });
}
