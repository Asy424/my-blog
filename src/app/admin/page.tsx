import { notFound } from "next/navigation";

function isAdminEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_ENABLE_ADMIN === "true"
  );
}

export default async function AdminPage() {
  if (!isAdminEnabled()) {
    notFound();
  }

  const AdminClient = (await import("./AdminClient")).default;
  return <AdminClient />;
}
