"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, Row, Col, Typography, Spin } from "antd";
import { Users, FileText, Users2, ShieldCheck, Settings } from "lucide-react";

const { Title } = Typography;

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const dashboardTiles = [
    {
      title: "Uzytkownicy",
      icon: <Users size={36} />,
      description: "Zarzadzaj uzytkownikami",
      link: "/admin/users",
      color: "#1890ff",
    },
    {
      title: "Projekty",
      icon: <FileText size={36} />,
      description: "Zarzadzaj projektami",
      link: "/admin/projects",
      color: "#52c41a",
    },
    {
      title: "Zarejestruj uzytkownika",
      icon: <FileText size={36} />,
      description: "Zarejestruj nowego uzytkownika",
      link: "/admin/create",
      color: "#722ed1",
    },
    {
      title: "Zespoly",
      icon: <Users2 size={36} />,
      description: "Zarzadzaj zespolami",
      link: "/admin/teams",
      color: "#fa8c16",
    },
    {
      title: "Role",
      icon: <ShieldCheck size={36} />,
      description: "Zarzadzaj rolami",
      link: "/admin/roles",
      color: "#eb2f96",
    },
  ];

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <Title level={2} style={{ marginBottom: "24px" }}>
        Admin Dashboard
      </Title>

      <Row gutter={[24, 24]}>
        {dashboardTiles.map((tile, index) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={index}>
            <Link href={tile.link} style={{ textDecoration: "none" }}>
              <Card
                hoverable
                style={{
                  height: "100%",
                  borderTop: `2px solid ${tile.color}`,
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "16px",
                    color: tile.color,
                  }}
                >
                  {tile.icon}
                </div>
                <Title
                  level={4}
                  style={{
                    textAlign: "center",
                    margin: "0 0 8px 0",
                    color: "rgba(0, 0, 0, 0.85)",
                  }}
                >
                  {tile.title}
                </Title>
                <Typography.Paragraph
                  style={{
                    textAlign: "center",
                    color: "rgba(0, 0, 0, 0.45)",
                    marginBottom: 0,
                  }}
                >
                  {tile.description}
                </Typography.Paragraph>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
