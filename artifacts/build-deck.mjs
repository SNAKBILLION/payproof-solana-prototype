import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const root =
  "C:/Users/accounts3/.codex/visualizations/2026/07/29/019fad9e-e9c5-7942-9864-3a11f8fe7290";
const output = `${root}/artifacts/deck-render`;
const shots = `${root}/artifacts/screenshots`;

const W = 1280;
const H = 720;
const ink = "#111614";
const muted = "#59635F";
const rule = "#C9CECB";
const green = "#66E7A0";
const dark = "#0D1512";
const white = "#FFFFFF";

const deck = Presentation.create({ slideSize: { width: W, height: H } });

function box(slide, x, y, w, h, fill = "none", lineFill = "none", radius = 0) {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: lineFill, width: lineFill === "none" ? 0 : 1 },
    ...(radius ? { borderRadius: radius } : {}),
  });
}

function text(slide, value, x, y, w, h, size, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    fontFamily: "Arial",
    fontSize: size,
    color: options.color ?? ink,
    bold: options.bold ?? false,
    alignment: options.align ?? "left",
    verticalAlignment: options.vAlign ?? "middle",
  };
  return shape;
}

function ruleLine(slide, x, y, w, color = rule, height = 1) {
  return box(slide, x, y, w, height, color);
}

function eyebrow(slide, value, x = 56, y = 44, color = muted) {
  return text(slide, value.toUpperCase(), x, y, 520, 24, 13, {
    bold: true,
    color,
  });
}

function footer(slide, index, inverse = false) {
  text(slide, "PAYPROOF", 56, 680, 160, 20, 11, {
    bold: true,
    color: inverse ? "#A8B2AD" : muted,
  });
  text(slide, String(index).padStart(2, "0"), 1180, 680, 44, 20, 11, {
    bold: true,
    align: "right",
    color: inverse ? "#A8B2AD" : muted,
  });
}

function notes(slide, sourceLines) {
  slide.speakerNotes.textFrame.setText(
    `[Sources]\n${sourceLines.map((source) => `- ${source}`).join("\n")}\n[/Sources]`,
  );
}

async function addImage(slide, file, position, alt, fit = "contain") {
  const blob = await fs.readFile(file);
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt,
    fit,
    position,
  });
}

// 1. Cover: sparse statement + product evidence.
{
  const slide = deck.slides.add();
  slide.background.fill = white;
  eyebrow(slide, "Solana commerce evidence network", 56, 52, "#15794C");
  text(slide, "Invisible commerce,\nverified.", 56, 116, 500, 188, 61, {
    bold: true,
  });
  text(
    slide,
    "PayProof turns fragmented merchant records into a consent-bound claim a lender can verify.",
    56,
    330,
    455,
    104,
    24,
    { color: muted },
  );
  ruleLine(slide, 56, 510, 420, ink, 2);
  text(slide, "28 records", 56, 530, 120, 34, 21, { bold: true });
  text(slide, "13 events", 190, 530, 110, 34, 21, { bold: true });
  text(slide, "92% cross-source", 312, 530, 175, 34, 21, { bold: true });
  text(slide, "Working product on Solana devnet", 56, 572, 360, 30, 16, {
    color: muted,
  });
  box(slide, 566, 72, 658, 548, dark);
  await addImage(
    slide,
    `${shots}/04-lender-verifier.png`,
    { left: 590, top: 96, width: 610, height: 500 },
    "PayProof lender verifier",
    "contain",
  );
  footer(slide, 1);
  notes(slide, [
    "https://payproof-network.rohiy1347.chatgpt.site/",
    "https://github.com/SNAKBILLION/payproof-solana-prototype",
  ]);
}

// 2. Problem: one dominant claim and source fragmentation.
{
  const slide = deck.slides.add();
  slide.background.fill = white;
  eyebrow(slide, "The underwriting gap");
  text(
    slide,
    "The commerce is real.\nThe evidence is disconnected.",
    56,
    102,
    830,
    180,
    54,
    { bold: true },
  );
  text(
    slide,
    "A WhatsApp order, invoice, UPI settlement and bank credit may describe one sale. Today a lender must reconstruct that chain manually.",
    56,
    310,
    720,
    106,
    23,
    { color: muted },
  );
  const labels = [
    ["01", "Order", "intent"],
    ["02", "Invoice", "obligation"],
    ["03", "UPI", "settlement"],
    ["04", "Bank", "receipt"],
  ];
  labels.forEach(([num, title, detail], i) => {
    const x = 56 + i * 294;
    ruleLine(slide, x, 500, 250, i === 3 ? green : ink, 3);
    text(slide, num, x, 516, 40, 24, 13, { bold: true, color: muted });
    text(slide, title, x, 548, 160, 34, 25, { bold: true });
    text(slide, detail, x, 586, 160, 28, 16, { color: muted });
  });
  footer(slide, 2);
  notes(slide, [
    "Product problem statement and import schema: https://github.com/SNAKBILLION/payproof-solana-prototype",
  ]);
}

// 3. Evidence graph: screenshot-led product proof.
{
  const slide = deck.slides.add();
  slide.background.fill = white;
  eyebrow(slide, "Working product");
  text(slide, "Reconciliation creates a traceable revenue graph.", 56, 78, 1030, 62, 39, {
    bold: true,
  });
  text(
    slide,
    "Every event keeps source provenance, confidence and exceptions.",
    56,
    142,
    790,
    40,
    20,
    { color: muted },
  );
  await addImage(
    slide,
    `${shots}/01-evidence-graph.png`,
    { left: 56, top: 202, width: 1168, height: 438 },
    "PayProof revenue event graph",
    "contain",
  );
  box(slide, 932, 110, 292, 74, dark);
  text(slide, "28 → 13", 952, 118, 112, 32, 27, {
    bold: true,
    color: white,
  });
  text(slide, "records to events", 1064, 120, 136, 28, 15, {
    color: "#B6C2BC",
  });
  text(slide, "92% cross-source coverage", 952, 151, 235, 22, 14, {
    color: green,
    bold: true,
  });
  footer(slide, 3);
  notes(slide, [
    "Screenshot captured from local working product using the downloadable sample CSV bundle.",
    "https://payproof-network.rohiy1347.chatgpt.site/",
  ]);
}

// 4. Explainable decision.
{
  const slide = deck.slides.add();
  slide.background.fill = dark;
  eyebrow(slide, "Decision infrastructure", 56, 44, green);
  text(slide, "A lender can replay every reason.", 56, 82, 650, 62, 42, {
    bold: true,
    color: white,
  });
  text(
    slide,
    "No universal credit score. One purpose-specific policy, five explicit checks, and mandatory human review.",
    56,
    150,
    660,
    80,
    20,
    { color: "#B6C2BC" },
  );
  await addImage(
    slide,
    `${shots}/02-decision-lab.png`,
    { left: 470, top: 245, width: 754, height: 380 },
    "PayProof explainable decision lab",
    "contain",
  );
  const metrics = [
    ["5/5", "policy checks"],
    ["₹39,767", "supported monthly revenue"],
    ["14%", "revenue volatility"],
  ];
  metrics.forEach(([value, label], i) => {
    const y = 280 + i * 104;
    ruleLine(slide, 56, y - 18, 330, "#34423C");
    text(slide, value, 56, y, 170, 40, 31, { bold: true, color: white });
    text(slide, label, 210, y + 4, 220, 30, 16, { color: "#A8B2AD" });
  });
  footer(slide, 4, true);
  notes(slide, [
    "Screenshot captured from the working policy engine and sample evidence bundle.",
    "https://github.com/SNAKBILLION/payproof-solana-prototype/blob/main/SUBMISSION.md",
  ]);
}

// 5. Privacy + Solana.
{
  const slide = deck.slides.add();
  slide.background.fill = white;
  eyebrow(slide, "Privacy-safe trust rail");
  text(slide, "Share a claim, not a financial life.", 56, 82, 820, 60, 43, {
    bold: true,
  });
  text(
    slide,
    "Raw records stay off-chain. The merchant selects claims and expiry; Solana carries the verifiable commitment.",
    56,
    148,
    830,
    62,
    20,
    { color: muted },
  );
  await addImage(
    slide,
    `${shots}/03-proof-passport.png`,
    { left: 56, top: 230, width: 558, height: 350 },
    "Merchant proof passport",
    "contain",
  );
  await addImage(
    slide,
    `${shots}/04-lender-verifier.png`,
    { left: 666, top: 230, width: 558, height: 350 },
    "Lender verifier",
    "contain",
  );
  text(slide, "MERCHANT CONTROLS", 56, 596, 210, 22, 12, {
    bold: true,
    color: "#15794C",
  });
  text(slide, "claims + expiry", 56, 620, 220, 28, 19, { bold: true });
  text(slide, "VERIFIER RECEIVES", 666, 596, 210, 22, 12, {
    bold: true,
    color: "#15794C",
  });
  text(slide, "predicate + receipt", 666, 620, 250, 28, 19, { bold: true });
  footer(slide, 5);
  notes(slide, [
    "https://solana.com/docs/tools/attestations/instructions/create-attestation",
    "Screenshots captured from the working PayProof product.",
  ]);
}

// 6. Pilot ask: decisive close.
{
  const slide = deck.slides.add();
  slide.background.fill = white;
  eyebrow(slide, "The 12-week pilot");
  text(slide, "Fund the step from proof to operating network.", 56, 88, 1040, 66, 44, {
    bold: true,
  });
  const stages = [
    ["01", "Issuer", "Authenticated case vault\nand issuer-controlled keys"],
    ["02", "Attestation", "SAS schema, expiry,\nverification and revocation"],
    ["03", "Pilot", "25 merchants and two\nlending partners"],
    ["04", "Evidence", "Publish verification time,\nexceptions and learnings"],
  ];
  stages.forEach(([num, title, detail], i) => {
    const x = 56 + i * 292;
    ruleLine(slide, x, 230, 246, i === 0 ? green : ink, 4);
    text(slide, num, x, 250, 40, 22, 13, { bold: true, color: muted });
    text(slide, title, x, 288, 220, 38, 27, { bold: true });
    text(slide, detail, x, 338, 230, 78, 17, { color: muted });
  });
  box(slide, 56, 480, 1168, 136, dark);
  text(slide, "$10,000", 84, 500, 220, 54, 42, {
    bold: true,
    color: green,
  });
  text(slide, "grant ask", 84, 554, 180, 28, 16, { color: "#B6C2BC" });
  text(slide, "25", 370, 500, 100, 54, 42, { bold: true, color: white });
  text(slide, "merchant cases", 370, 554, 180, 28, 16, {
    color: "#B6C2BC",
  });
  text(slide, "2", 640, 500, 80, 54, 42, { bold: true, color: white });
  text(slide, "lending partners", 640, 554, 180, 28, 16, {
    color: "#B6C2BC",
  });
  text(slide, "12 weeks", 910, 500, 220, 54, 42, {
    bold: true,
    color: white,
  });
  text(slide, "to measured pilot", 910, 554, 190, 28, 16, {
    color: "#B6C2BC",
  });
  footer(slide, 6);
  notes(slide, [
    "https://superteam.fun/earn/grants/solana-foundation-india-grants",
    "https://solana.org/grants-funding",
    "https://colosseum.com/eternal",
  ]);
}

await fs.mkdir(output, { recursive: true });

for (const [index, slide] of deck.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await deck.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(`${output}/${stem}.png`, new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(`${output}/${stem}.layout.json`, await layout.text());
}

const montage = await deck.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(
  `${output}/PayProof-Grant-Deck-montage.webp`,
  new Uint8Array(await montage.arrayBuffer()),
);

const pptx = await PresentationFile.exportPptx(deck);
await pptx.save(`${root}/artifacts/PayProof-Grant-Deck.pptx`);
