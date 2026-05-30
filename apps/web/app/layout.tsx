import type { ReactNode } from "react";

export const metadata = {
  title: "md-pdf-studio",
  description: "Markdown a PDF editorial con estilos granulares",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
