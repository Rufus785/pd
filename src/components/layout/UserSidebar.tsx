"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Layout,
  Menu,
  Typography,
  Button,
  Divider,
  Spin,
  Modal,
  Table,
  Tag,
} from "antd";
import {
  LayoutDashboard,
  Users2,
  Home,
  LogOut,
  User,
  Settings,
  FolderKanban,
  FileText,
} from "lucide-react";
import DisplayIfAdmin from "@/components/DisplayIfAdmin";
import type { TeamRole } from "@prisma/client";

const { Sider } = Layout;
const { Text, Title } = Typography;

interface Team {
  id: number;
  name: string;
  role: TeamRole;
  project_id: number | null;
}

interface Project {
  id: number;
  name: string;
}

interface TeamMember {
  user_id: number;
  nickname: string;
  role: TeamRole;
}

export function UserSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamModalVisible, setTeamModalVisible] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchUserTeams();
    }
  }, [session]);

  const fetchUserTeams = async () => {
    try {
      setTeamsLoading(true);
      const response = await fetch(`/api/auth/user/${session?.user?.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const userData = await response.json();

      if (userData.teams && Array.isArray(userData.teams)) {
        setUserTeams(userData.teams);

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
      }
    } catch (error) {
      console.error("Error fetching teams:", error);
    } finally {
      setTeamsLoading(false);
    }
  };

  const fetchProjects = async (projectIds: number[]) => {
    try {
      setProjectsLoading(true);

      const response = await fetch(`/api/projects`);
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }

      const allProjects = await response.json();

      const filteredProjects = allProjects.filter((project: Project) =>
        projectIds.includes(project.id)
      );

      setUserProjects(filteredProjects);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setProjectsLoading(false);
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

  const handleProjectClick = (projectId: number) => {
    router.push(`/projects/${projectId}`);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  const projectMenuItems = userProjects.map((project) => ({
    key: `/projects/${project.id}`,
    icon: <FileText size={18} />,
    label: project.name,
    onClick: () => handleProjectClick(project.id),
  }));
  const teamMenuItems = userTeams.map((team) => ({
    key: `/teams/${team.id}`,
    icon: <Users2 size={16} />,
    label: team.name,
    onClick: () => handleTeamClick(team),
  }));

  const projectsMenuItem = {
    key: "projects",
    icon: <FolderKanban size={18} />,
    label: "Moje projekty",
    children:
      projectMenuItems.length > 0
        ? projectMenuItems
        : [
            {
              key: "no-projects",
              label: "Brak projektów",
              disabled: true,
            },
          ],
  };

  const teamsMenuItem = {
    key: "teams",
    icon: <Users2 size={18} />,
    label: "Moje zespoły",
    children:
      teamMenuItems.length > 0
        ? teamMenuItems
        : [
            {
              key: "no-teams",
              label: "Brak zespołów",
              disabled: true,
            },
          ],
  };

  const adminPanelMenuItem = {
    key: "/admin",
    icon: <LayoutDashboard size={18} />,
    label: (
      <DisplayIfAdmin adminOnly={true}>
        <Link href="/admin">Admin Panel</Link>
      </DisplayIfAdmin>
    ),
  };

  const mainMenuItems = [
    adminPanelMenuItem,
    projectsMenuItem,
    teamsMenuItem,
  ].filter(Boolean);

  const footerMenuItems = [
    {
      key: "/",
      icon: <Home size={18} />,
      label: <Link href="/">Strona główna</Link>,
    },
  ];

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

  const isLoading = teamsLoading || projectsLoading;

  return (
    <>
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
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            <FolderKanban size={24} />
            <Text strong style={{ marginLeft: 8, fontSize: 16 }}>
              Telko - Project Manager
            </Text>
          </Link>
        </div>

        <Divider style={{ margin: "0 0 8px 0" }} />

        <div style={{ padding: "0 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <User size={18} />
            <Text style={{ marginLeft: 8, fontSize: 14 }}>
              {session?.user?.name || "Użytkownik"}
            </Text>
          </div>
        </div>

        <div style={{ flex: 1, overflow: "auto" }}>
          {isLoading ? (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Spin size="small" />
              <div style={{ marginTop: 8 }}>Ładowanie danych...</div>
            </div>
          ) : (
            <Menu
              mode="inline"
              selectedKeys={[pathname || ""]}
              defaultOpenKeys={["projects", "teams"]}
              style={{ borderRight: 0 }}
              items={mainMenuItems}
            />
          )}
        </div>

        <div style={{ padding: "16px 0", borderTop: "1px solid #f0f0f0" }}>
          <Menu
            mode="inline"
            selectedKeys={[pathname || ""]}
            style={{ borderRight: 0 }}
            items={footerMenuItems}
          />

          <div style={{ padding: "0 16px" }}>
            <Button
              type="text"
              danger
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
                    {userProjects.find((p) => p.id === selectedTeam.project_id)
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
