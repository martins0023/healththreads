// app/layout.jsx
import "../styles/globals.css";

// export const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL);

// Default metadata for SEO and social sharing
export const metadata = {
  title: {
    default: "Doctor Kays | Expert Health & Wellness",
    template: "%s | Doctor Kays",
  },
  description:
    "Doctor Kays provides trusted medical insights, sex education, and wellness tips for everyone.",
  keywords: ["Doctor Kays", "health", "wellness", "sex education", "pregnancy"],
  authors: [{ name: "Doctor Kays", url: "https://doctorkays.com" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: "Doctor Kays",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/favicon.ico`,
        width: 1200,
        height: 630,
        alt: "Doctor Kays Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Doctor Kays | Health & Wellness",
    description: "Trusted insights on health, pregnancy, and sex education.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL}/logo.svg`],
    creator: "@DoctorKays",
  },
  // Google site verification
  verification: {
    google: "vYz7BUZ5RQhAmh5Stoqwodo21tip1pKKaUtXZyMunFc",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* 
          Next.js will automatically inject all the tags
          declared in the `metadata` export above. 
        */}

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />

        {/* Preload Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-inter bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
