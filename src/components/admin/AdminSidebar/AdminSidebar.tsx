"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layout, Menu, Typography, Button, Divider } from "antd";
import {
  LayoutDashboard,
  Users,
  FileText,
  Users2,
  ShieldCheck,
  Settings,
  Home,
  LogOut,
} from "lucide-react";

const { Sider } = Layout;
const { Text } = Typography;

const handleLogout = async () => {
  await signOut({ redirect: false });
  window.location.reload();
};

export function AdminSidebar() {
  const pathname = usePathname();

  const mainMenuItems = [
    {
      key: "/admin",
      icon: <LayoutDashboard size={18} />,
      label: <Link href="/admin">Dashboard</Link>,
    },
    {
      key: "/admin/users",
      icon: <Users size={18} />,
      label: <Link href="/admin/users">Uzytkownicy</Link>,
    },
    {
      key: "/admin/projects",
      icon: <FileText size={18} />,
      label: <Link href="/admin/projects">Projekty</Link>,
    },
    {
      key: "/admin/create",
      icon: <FileText size={18} />,
      label: <Link href="/admin/create">Zarejestruj uzytkownika</Link>,
    },
    {
      key: "/admin/teams",
      icon: <Users2 size={18} />,
      label: <Link href="/admin/teams">Zespoly</Link>,
    },
    {
      key: "/admin/roles",
      icon: <ShieldCheck size={18} />,
      label: <Link href="/admin/roles">Role</Link>,
    },
  ];

  const footerMenuItems = [
    {
      key: "/admin/settings",
      icon: <Settings size={18} />,
      label: <Link href="/admin/settings">Ustawienia</Link>,
    },
    {
      key: "/",
      icon: <Home size={18} />,
      label: <Link href="/">Strona główna</Link>,
    },
  ];

  return (
    <Sider
      width={250}
      style={{
        height: "100vh",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        background: "#fff",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
      }}
    >
      <div style={{ padding: "16px", display: "flex", alignItems: "center" }}>
        <Link
          href="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            color: "inherit",
            textDecoration: "none",
          }}
        >
          <ShieldCheck size={24} />
          <Text strong style={{ marginLeft: 8, fontSize: 16 }}>
            Admin Panel
          </Text>
        </Link>
      </div>

      <Divider style={{ margin: "0 0 8px 0" }} />

      <div style={{ flex: 1, overflow: "auto" }}>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          style={{ borderRight: 0 }}
          items={mainMenuItems}
        />
      </div>

      <div style={{ padding: "16px 0", borderTop: "1px solid #f0f0f0" }}>
        <Menu
          mode="inline"
          selectedKeys={[pathname]}
          style={{ borderRight: 0 }}
          items={footerMenuItems}
        />

        <div style={{ padding: "0 16px" }}>
          <Button
            type="text"
            onClick={handleLogout}
            icon={<LogOut size={18} />}
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              textAlign: "left",
              padding: "0 16px",
              height: "40px",
            }}
          >
            <span style={{ marginLeft: 10 }}>Wyloguj się</span>
          </Button>
        </div>
      </div>
    </Sider>
  );
}
