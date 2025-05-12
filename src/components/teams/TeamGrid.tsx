"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Row,
  Col,
  Card,
  Typography,
  Spin,
  Tag,
  Modal,
  Button,
  Table,
} from "antd";
import { Users2 } from "lucide-react";
import type { TeamRole } from "@prisma/client";

const { Title, Paragraph, Text } = Typography;

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

interface Team {
  id: number;
  name: string;
  role: TeamRole;
  project_id: number | null;
  description?: string;
  memberCount?: number;
}

interface TeamMember {
  user_id: number;
  nickname: string;
  role: TeamRole;
}

interface Project {
  id: number;
  name: string;
}

export default function TeamGrid() {
  const { data: session } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [teamModalVisible, setTeamModalVisible] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserTeams();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchUserTeams = async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/auth/user/${session?.user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }

      const userData = await response.json();

      if (userData.teams && Array.isArray(userData.teams)) {
        const enhancedTeams = await Promise.all(
          userData.teams.map(async (team: Team) => {
            try {
              const teamResponse = await fetch(`/api/teams/${team.id}`);
              if (teamResponse.ok) {
                const teamData = await teamResponse.json();
                return {
                  ...team,
                  memberCount: teamData.members?.length || 0,
                };
              }
            } catch (error) {
              console.error(
                `Error fetching details for team ${team.id}:`,
                error
              );
            }
            return team;
          })
        );

        setTeams(enhancedTeams);

        const projectIds: number[] = userData.teams
          .filter(
            (team: Team) => team.project_id !== null && team.project_id !== 0
          )
          .map((team: Team) => team.project_id as number);

        const uniqueProjectIds = [...new Set(projectIds)];

        if (uniqueProjectIds.length > 0) {
          fetchProjects(uniqueProjectIds);
        }
      } else {
        setTeams([]);
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async (projectIds: number[]) => {
    try {
      const response = await fetch(`/api/projects`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const allProjects = await response.json();
      const filteredProjects = allProjects.filter((project: Project) =>
        projectIds.includes(project.id)
      );
      setProjects(filteredProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const fetchTeamDetails = async (teamId: number) => {
    try {
      setDetailsLoading(true);

      const response = await fetch(`/api/teams/${teamId}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(
          `Failed to fetch team details: ${response.status} ${errorText}`
        );
      }

      const teamData = await response.json();

      if (teamData.members && Array.isArray(teamData.members)) {
        setTeamMembers(teamData.members);
      } else {
        setTeamMembers([]);
      }
    } catch (error) {
      console.error("Error fetching team details:", error);
      setTeamMembers([]);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team);
    setTeamModalVisible(true);
    await fetchTeamDetails(team.id);
  };

  const getRandomColor = () => {
    return tileColors[Math.floor(Math.random() * tileColors.length)];
  };

  const teamMembersColumns = [
    {
      title: "Nazwa użytkownika",
      dataIndex: "nickname",
      key: "nickname",
    },
    {
      title: "Rola w zespole",
      dataIndex: "role",
      key: "role",
      render: (role: TeamRole) => <Tag color="blue">{role}</Tag>,
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>Ładowanie zespołów...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px 0" }}>
        <Users2 size={48} style={{ color: "#d9d9d9", marginBottom: "16px" }} />
        <Paragraph style={{ fontSize: "16px", color: "rgba(0, 0, 0, 0.45)" }}>
          Nie należysz jeszcze do żadnego zespołu
        </Paragraph>
      </div>
    );
  }

  return (
    <>
      <Row gutter={[24, 24]}>
        {teams.map((team) => {
          const color = getRandomColor();

          return (
            <Col xs={24} sm={12} md={8} lg={8} xl={6} key={team.id}>
              <Card
                hoverable
                onClick={() => handleTeamClick(team)}
                style={{
                  height: "100%",
                  borderTop: `2px solid ${color}`,
                  transition: "all 0.3s",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    textAlign: "center",
                    marginBottom: "16px",
                    color: color,
                  }}
                >
                  <Users2 size={36} />
                </div>
                <Title
                  level={4}
                  style={{
                    textAlign: "center",
                    margin: "0 0 8px 0",
                    color: "rgba(0, 0, 0, 0.85)",
                  }}
                >
                  {team.name}
                </Title>
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <Tag color="blue">{team.role}</Tag>
                  {team.memberCount && (
                    <Tag color="green">{team.memberCount} członków</Tag>
                  )}
                </div>
                <Typography.Paragraph
                  style={{
                    textAlign: "center",
                    color: "rgba(0, 0, 0, 0.45)",
                    marginBottom: 0,
                  }}
                >
                  {team.description ||
                    "Kliknij, aby zobaczyć szczegóły zespołu"}
                </Typography.Paragraph>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal
        title={
          selectedTeam ? `Zespół: ${selectedTeam.name}` : "Szczegóły zespołu"
        }
        open={teamModalVisible}
        onCancel={() => setTeamModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTeamModalVisible(false)}>
            Zamknij
          </Button>,
        ]}
        width={700}
      >
        {detailsLoading ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Spin size="large" />
            <div style={{ marginTop: 8 }}>Ładowanie szczegółów zespołu...</div>
          </div>
        ) : (
          <div>
            {selectedTeam && (
              <div style={{ marginBottom: 16 }}>
                <Title level={5}>Informacje o zespole</Title>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Nazwa zespołu:</Text> {selectedTeam.name}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <Text strong>Twoja rola:</Text>{" "}
                  <Tag color="blue">{selectedTeam.role}</Tag>
                </div>
                {selectedTeam.project_id && selectedTeam.project_id !== 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>Projekt:</Text>{" "}
                    {projects.find((p) => p.id === selectedTeam.project_id)
                      ?.name || `Projekt ID: ${selectedTeam.project_id}`}
                  </div>
                )}
              </div>
            )}

            <Title level={5}>Członkowie zespołu</Title>
            {teamMembers.length > 0 ? (
              <Table
                dataSource={teamMembers}
                columns={teamMembersColumns}
                rowKey="user_id"
                pagination={false}
                size="small"
              />
            ) : (
              <div style={{ textAlign: "center", padding: "20px" }}>
                <Text type="secondary">Brak członków zespołu</Text>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
