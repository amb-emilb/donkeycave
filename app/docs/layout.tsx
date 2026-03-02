import NavBar from "@/components/nav-bar";

export default function DocsLayout({
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
