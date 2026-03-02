import NavBar from "@/components/nav-bar";

export default function CaveLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      {children}
    </>
  );
}
