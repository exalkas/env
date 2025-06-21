import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AdminLayout from "../components/AdminLayout";
import { CategoriesProvider } from "@/lib/contexts/CategoriesContext";
import { QuestionCategoriesProvider } from "../lib/contexts/QuestionCategoriesContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Green Energy Trading - Admin Panel",
  description: "Admin panel for Green Energy Trading Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CategoriesProvider>
          <QuestionCategoriesProvider>
            <AdminLayout>{children}</AdminLayout>
          </QuestionCategoriesProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}
