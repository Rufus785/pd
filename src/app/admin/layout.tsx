import { AdminSidebar } from "@/components/admin/AdminSidebar/AdminSidebar";
import "./admin-layout.css";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
