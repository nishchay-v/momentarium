import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Momentarium - AI-Powered Photo Gallery',
  description: 'Automatically organize your photos into beautiful, thematic albums using AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
