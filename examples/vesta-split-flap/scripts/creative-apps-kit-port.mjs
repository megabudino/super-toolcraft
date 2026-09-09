import net from "node:net";

export const DEFAULT_CREATIVE_APPS_KIT_PORT = 3002;

export function readPreferredPort(names, fallback = DEFAULT_CREATIVE_APPS_KIT_PORT, env = process.env) {
  for (const name of names) {
    const value = env[name];

    if (value == null || value === "") {
      continue;
    }

    const port = Number(value);

    if (Number.isInteger(port) && port > 0 && port <= 65_535) {
      return port;
    }
  }

  return fallback;
}

export function isPortAvailable(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.unref();
    server.once("error", () => {
      resolve(false);
    });
    server.listen(port, host, () => {
      server.close(() => {
        resolve(true);
      });
    });
  });
}

export async function findAvailablePort(startPort = DEFAULT_CREATIVE_APPS_KIT_PORT, host = "127.0.0.1") {
  for (let port = startPort; port <= 65_535; port += 1) {
    if (await isPortAvailable(port, host)) {
      return port;
    }
  }

  throw new Error(`No free port found at or above ${startPort}.`);
}
