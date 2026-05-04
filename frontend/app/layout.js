import '../styles/globals.css';
import { ToastProvider } from '@/components/ui/ToastProvider';

export const metadata = {
  title: 'LIMS Platform',
  description: 'Global LIMS'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
