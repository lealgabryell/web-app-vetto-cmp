import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import QueryProvider from "../provider/QueryProvider";


export const metadata: Metadata = {
  title: "Gerenciamento de Projetos",
  description: "Developed by Gabryell Leal Rocha",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body>
        <QueryProvider>
        {children}
        <Toaster position="top-right" reverseOrder={false} />
      </QueryProvider>
      </body>
    </html>
  );
}


