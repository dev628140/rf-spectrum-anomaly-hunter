import "./globals.css";
import { Providers } from "@/components/providers";
import { AuthWrapper } from "@/components/auth-wrapper";

export const metadata = {
  title: "RF Intelligence Dashboard",
  description: "Real-time RF threat intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#050816] text-white antialiased overflow-hidden">
        <Providers>
          <AuthWrapper>
            {children}
          </AuthWrapper>
        </Providers>
      </body>
    </html>
  );
}