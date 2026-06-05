import { Inter, JetBrains_Mono } from 'next/font/google';

// Variable fonts (no `weight` array) - full weight axis + optical sizing, which
// renders far crisper than pinned static instances, especially at regular weight.
export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains',
});
