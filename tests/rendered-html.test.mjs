import assert from "node:assert/strict";
import { access, readFile, readdir } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://payproof.example/", {
      headers: {
        accept: "text/html",
        host: "payproof.example",
        "x-forwarded-host": "payproof.example",
        "x-forwarded-proto": "https",
      },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the PayProof workspace and absolute social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>PayProof \| Invisible Commerce Proof Network<\/title>/i);
  assert.match(html, /Working capital evidence review/);
  assert.match(html, /Turn fragmented transactions into verified commerce/);
  assert.match(
    html,
    /https:\/\/snakbillion\.github\.io\/payproof-solana-prototype\/og\.png/,
  );
  assert.doesNotMatch(html, /Income Reliability Score|Run Product Flow|Superteam builders/i);
});

test("ships the production app without the disposable starter or legacy static shell", async () => {
  const [packageJson, appSource] = await Promise.all([
    readFile(new URL("../package.json", import.meta.url), "utf8"),
    readFile(new URL("../app/payproof-app.tsx", import.meta.url), "utf8"),
  ]);

  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  assert.match(appSource, /crypto\.subtle\.digest/);
  assert.match(appSource, /MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr/);
  assert.match(appSource, /papaparse/);
  assert.match(appSource, /NEXT_PUBLIC_BASE_PATH/);
  await assert.rejects(access(new URL("../index.html", import.meta.url)));
  assert.deepEqual(
    await readdir(new URL("../app/_sites-preview", import.meta.url)),
    [],
  );
  await access(new URL("../public/og.png", import.meta.url));
});
