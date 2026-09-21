import vm from "node:vm";

import { describe, expect, it } from "vitest";

import { injectIntoHtml, storageShimScript } from "@/lib/storage-shim";

class FakeStorage {
  map = new Map<string, string>();
}
Object.assign(FakeStorage.prototype, {
  getItem(this: FakeStorage, key: string) {
    return this.map.has(key) ? this.map.get(key)! : null;
  },
  setItem(this: FakeStorage, key: string, value: string) {
    this.map.set(key, String(value));
  },
  removeItem(this: FakeStorage, key: string) {
    this.map.delete(key);
  },
  key(this: FakeStorage, index: number) {
    return [...this.map.keys()][index] ?? null;
  },
  clear(this: FakeStorage) {
    this.map.clear();
  },
});
Object.defineProperty(FakeStorage.prototype, "length", {
  configurable: true,
  get(this: FakeStorage) {
    return this.map.size;
  },
});

class FakeIDBFactory {
  opened: string[] = [];
}
Object.assign(FakeIDBFactory.prototype, {
  open(this: FakeIDBFactory, name: string) {
    this.opened.push(name);
    return name;
  },
  deleteDatabase(name: string) {
    return name;
  },
});

describe("storage shim", () => {
  it("namespaces Storage and IndexedDB per app slug", () => {
    const context = vm.createContext({ Storage: FakeStorage, IDBFactory: FakeIDBFactory, Object });
    vm.runInContext(storageShimScript("acme"), context);

    const storage = new FakeStorage() as unknown as Storage;
    storage.map.set("other-app-key", "x");
    storage.setItem("toolcraft:demo:state:v1", "{}");
    expect(storage.map.has("app:acme:toolcraft:demo:state:v1")).toBe(true);
    expect(storage.getItem("toolcraft:demo:state:v1")).toBe("{}");
    expect(storage.getItem("other-app-key")).toBeNull();
    expect(storage.length).toBe(1);
    expect(storage.key(0)).toBe("toolcraft:demo:state:v1");
    storage.clear();
    expect(storage.map.has("other-app-key")).toBe(true);
    expect(storage.length).toBe(0);

    const idb = new FakeIDBFactory() as unknown as IDBFactory & { opened: string[] };
    idb.open("toolcraft-assets");
    expect(idb.opened).toEqual(["app:acme:toolcraft-assets"]);
  });

  it("adds the back-to-apps pill before </body>", () => {
    const html = injectIntoHtml("<html><head></head><body><div id=root></div></body></html>", "x");
    expect(html.indexOf("platform-back")).toBeGreaterThan(html.indexOf("<div id=root>"));
    expect(html.indexOf("platform-back")).toBeLessThan(html.indexOf("</body>"));
  });

  it("injects the shim as the first script in <head>", () => {
    const html = injectIntoHtml('<!doctype html><html><head><meta charset="utf-8"><script type="module" src="/a/x/app.js"></script></head></html>', "x");
    expect(html.indexOf("app:x:")).toBeGreaterThan(-1);
    expect(html.indexOf("app:x:")).toBeLessThan(html.indexOf('type="module"'));
  });
});
