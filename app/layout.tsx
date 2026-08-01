import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "./globals.css";

const metadataBase = new URL(
  "https://snakbillion.github.io/payproof-solana-prototype/",
);
const githubAssetBase =
  "https://snakbillion.github.io/payproof-solana-prototype";
const title = "PayProof | Invisible Commerce Proof Network";
const description =
  "Turn fragmented orders, invoices and payment credits into explainable, privacy-safe lender evidence.";

export const metadata: Metadata = {
  metadataBase,
  title,
  description,
  alternates: {
    canonical: metadataBase,
  },
  icons: {
    icon: `${githubAssetBase}/favicon.svg`,
    shortcut: `${githubAssetBase}/favicon.svg`,
  },
  openGraph: {
    title,
    description,
    type: "website",
    url: metadataBase,
    images: [
      {
        url: `${githubAssetBase}/og.png`,
        width: 1200,
        height: 630,
        alt: "PayProof reconciles fragmented commerce into verified lender evidence.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [`${githubAssetBase}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
