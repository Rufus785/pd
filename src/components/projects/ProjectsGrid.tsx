"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Row, Col, Card, Typography, Spin } from "antd";
import { FileText, FolderKanban } from "lucide-react";

const { Title, Paragraph } = Typography;

const tileColors = [
  "#1890ff",
  "#52c41a",
  "#722ed1",
  "#fa8c16",
  "#eb2f96",
  "#13c2c2",
  "#f5222d",
  "#faad14",
  "#2f54eb",
  "#fa541c",
];

interface Project {
  id: number;
  name: string;
  description?: string;
}

export default function ProjectGrid() {
  const { data: session } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserProjects();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchUserProjects = async () => {
    try {
      setLoading(true);

      const userResponse = await fetch(`/api/auth/user/${session?.user?.id}`);
      if (!userResponse.ok) {
        throw new Error("Nie udalo sie odswiezyc danych uzytkownika");
      }

      const userData = await userResponse.json();

      if (!userData.teams || !Array.isArray(userData.teams)) {
        setProjects([]);
        return;
      }

      const projectIds = userData.teams
        .filter(
          (team: any) => team.project_id !== null && team.project_id !== 0
        )
        .map((team: any) => team.project_id);

      const uniqueProjectIds = [...new Set(projectIds)];

      if (uniqueProjectIds.length === 0) {
        setProjects([]);
        return;
      }

      const projectsResponse = await fetch(`/api/projects`);
      if (!projectsResponse.ok) {
        throw new Error("Nie udalo sie odwiezyc projektow!");
      }

      const allProjects = await projectsResponse.json();

      const userProjects = allProjects.filter((project: Project) =>
        uniqueProjectIds.includes(project.id)
      );

      setProjects(userProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const getRandomColor = () => {
    return tileColors[Math.floor(Math.random() * tileColors.length)];
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>Ładowanie projektów...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <FolderKanban
          size={48}
          style={{ color: "#d9d9d9", marginBottom: "16px" }}
        />
        <Paragraph style={{ fontSize: "16px", color: "rgba(0, 0, 0, 0.45)" }}>
          Nie masz jeszcze żadnych projektów
        </Paragraph>
      </div>
    );
  }

  return (
    <Row gutter={[24, 24]}>
      {projects.map((project) => {
        const color = getRandomColor();

        return (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={project.id}>
            <Link
              href={`/projects/${project.id}`}
              style={{ textDecoration: "none" }}
            >
              <Card
                hoverable
                style={{
                  height: "100%",
                  borderTop: `2px solid ${color}`,
                  transition: "all 0.3s",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "16px",
                    color: color,
                  }}
                >
                  <FileText size={36} />
                </div>
                <Title
                  level={4}
                  style={{
                    textAlign: "center",
                    margin: "0 0 8px 0",
                    color: "rgba(0, 0, 0, 0.85)",
                  }}
                >
                  {project.name}
                </Title>
                <Typography.Paragraph
                  style={{
                    textAlign: "center",
                    color: "rgba(0, 0, 0, 0.45)",
                    marginBottom: 0,
                  }}
                >
                  {project.description ||
                    "Kliknij, aby zobaczyć szczegóły projektu"}
                </Typography.Paragraph>
              </Card>
            </Link>
          </Col>
        );
      })}
    </Row>
  );
}
