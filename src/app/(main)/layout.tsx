import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MouseTrail from "@/components/MouseTrail";
import BackToTop from "@/components/BackToTop";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MouseTrail />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </>
  );
}
