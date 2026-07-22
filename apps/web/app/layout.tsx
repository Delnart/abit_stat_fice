import type { Metadata, Viewport } from 'next';
import { Providers } from '../lib/providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Вступ ФІОТ — статистика в реальному часі',
  description:
    'Жива статистика вступної кампанії на спеціальності ФІОТ КПІ: заяви, місця, прохідні бали. Дані з порталу ЄДЕБО кожні 10 хвилин.',
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('vf-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}",
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
