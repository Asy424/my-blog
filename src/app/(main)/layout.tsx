import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MouseTrail from "@/components/MouseTrail";

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
    </>
  );
}
