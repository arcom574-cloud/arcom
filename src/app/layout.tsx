import type { Metadata } from "next";
import { Cairo } from "next/font/google";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: 'Arcom Developments | مطور عقاري متميز في مصر',
    template: '%s | Arcom Developments',
  },
  description: 'Arcom Developments - شركة تطوير عقاري رائدة في مصر. مولات تجارية ومشاريع استثمارية في أكتوبر. محلات، مكاتب إدارية، كافيهات. Premium commercial real estate developer in Egypt.',
  keywords: ['عقارات مصر', 'تطوير عقاري', 'مولات تجارية', 'أكتوبر', 'استثمار عقاري', 'محلات تجارية', 'مكاتب إدارية', 'Arcom Developments', 'real estate Egypt', 'commercial property', '6 October'],
  authors: [{ name: 'Arcom Developments' }],
  creator: 'Arcom Developments',
  publisher: 'Arcom Developments',
  manifest: '/manifest.json',
  metadataBase: new URL('https://www.arcomdevelopments.com'),
  alternates: {
    canonical: '/',
    languages: { 'ar': '/ar', 'en': '/en' },
  },
  openGraph: {
    type: 'website',
    locale: 'ar_EG',
    alternateLocale: 'en_US',
    url: 'https://www.arcomdevelopments.com',
    siteName: 'Arcom Developments',
    title: 'Arcom Developments | مطور عقاري متميز في مصر',
    description: 'مولات تجارية ومشاريع استثمارية في أفضل المواقع. محلات، مكاتب إدارية، كافيهات.',
    images: [{ url: '/arcom-logo.png', width: 1200, height: 630, alt: 'Arcom Developments' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arcom Developments',
    description: 'Premium commercial real estate developer in Egypt',
    images: ['/arcom-logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#1B4B8A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ARCOM" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body suppressHydrationWarning className={`${cairo.variable} font-sans antialiased`}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'RealEstateAgent',
          name: 'Arcom Developments',
          url: 'https://www.arcomdevelopments.com',
          logo: 'https://www.arcomdevelopments.com/arcom-logo.png',
          description: 'شركة تطوير عقاري رائدة في مصر متخصصة في المولات التجارية والمشاريع الاستثمارية',
          address: { '@type': 'PostalAddress', addressCountry: 'EG', addressLocality: '6 October City' },
          areaServed: { '@type': 'Country', name: 'Egypt' },
          knowsLanguage: ['ar', 'en'],
        })}} />
        {children}
      </body>
    </html>
  );
}
