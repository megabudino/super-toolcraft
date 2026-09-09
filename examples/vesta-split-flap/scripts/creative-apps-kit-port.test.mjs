import net from "node:net";

import { describe, expect, it } from "vitest";

import { findAvailablePort, isPortAvailable } from "./creative-apps-kit-port.mjs";

function listen(host = "127.0.0.1") {
  const server = net.createServer();

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, host, () => {
      const address = server.address();

      if (!address || typeof address === "string") {
        server.close();
        reject(new Error("Could not allocate a TCP port."));
        return;
      }

      resolve({
        close: () => new Promise((closeResolve) => server.close(closeResolve)),
        port: address.port,
      });
    });
  });
}

describe("Creative Apps Kit port helper", () => {
  it("treats a port occupied on 127.0.0.1 as unavailable", async () => {
    const occupied = await listen();

    try {
      await expect(isPortAvailable(occupied.port)).resolves.toBe(false);
    } finally {
      await occupied.close();
    }
  });

  it("finds the next free localhost port after an occupied start port", async () => {
    const occupied = await listen();

    try {
      await expect(findAvailablePort(occupied.port)).resolves.toBeGreaterThan(occupied.port);
    } finally {
      await occupied.close();
    }
  });
});
