"use client";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Typography, Spin, Tabs, Button, Result } from "antd";
import ProjectHeader from "@/components/projects/ProjectHeader";
import TaskSection from "@/components/projects/TaskSection";
import WireframeSection from "@/components/projects/WireframeSection";
import MeetingSection from "@/components/projects/MeetingSection";
import type { Project, Task, Meeting, User } from "@/app/types/projectTypes";

const { Title } = Typography;
const { TabPane } = Tabs;

export default function ProjectDetailPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && projectId) {
      fetchProjectData();
    }
  }, [status, projectId]);

  const fetchProjectData = async () => {
    setLoading(true);
    setError(null);

    try {
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      if (!projectResponse.ok) {
        throw new Error(
          `Failed to fetch project: ${projectResponse.statusText}`
        );
      }
      const projectData = await projectResponse.json();
      setProject(projectData);

      if (
        projectData.status === "Closed" &&
        !(
          session?.user?.roles?.includes("Admin") ||
          (await checkUserIsProjectPM(Number(projectId)))
        )
      ) {
        setAccessDenied(true);
        setLoading(false);
        return;
      }

      const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`);
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json();
        setTasks(tasksData);
      }

      const meetingsResponse = await fetch(
        `/api/projects/${projectId}/meetings`
      );
      if (meetingsResponse.ok) {
        const meetingsData = await meetingsResponse.json();
        setMeetings(meetingsData);
      }

      const usersResponse = await fetch(`/api/users`);
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      }
    } catch (err) {
      console.error("Error fetching project data:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching project data"
      );
    } finally {
      setLoading(false);
    }
  };

  const checkUserIsProjectPM = async (projectId: number): Promise<boolean> => {
    try {
      const response = await fetch(`/api/projects/${projectId}/users`);
      if (!response.ok) return false;

      const projectUsers = await response.json();
      const userTeam = projectUsers.find(
        (pu: any) => pu.user_id === session?.user?.id && pu.role === "PM"
      );

      return !!userTeam;
    } catch (error) {
      console.error("Error checking if user is PM:", error);
      return false;
    }
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
  };

  const handleTaskCreate = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleMeetingCreate = (newMeeting: Meeting) => {
    setMeetings((prevMeetings) => [...prevMeetings, newMeeting]);
  };

  const handleWireframeUpdate = (wireframeUrl: string) => {
    if (project) {
      setProject({
        ...project,
        wireframe_link: wireframeUrl,
      });
    }
  };

  const handleProjectStatusUpdate = (newStatus: string) => {
    if (project) {
      setProject({
        ...project,
        status: newStatus as any,
      });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px 0" }}>
        <Spin size="large" />
        <div style={{ marginTop: "16px" }}>Ładowanie danych projektu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Błąd ładowania danych"
        subTitle={error}
        extra={[
          <Button key="back" onClick={() => router.push("/")}>
            Wróć do strony głównej
          </Button>,
        ]}
      />
    );
  }

  if (accessDenied) {
    return (
      <Result
        status="403"
        title="Brak dostępu"
        subTitle="Projekt jest zamknięty. Tylko administratorzy i kierownicy projektu mają dostęp."
        extra={[
          <Button key="back" onClick={() => router.push("/")}>
            Wróć do strony głównej
          </Button>,
        ]}
      />
    );
  }

  if (!project) {
    return (
      <Result
        status="404"
        title="Nie znaleziono projektu"
        subTitle="Przepraszamy, ale projekt o podanym ID nie istnieje."
        extra={[
          <Button key="back" onClick={() => router.push("/")}>
            Wróć do strony głównej
          </Button>,
        ]}
      />
    );
  }

  const userRoles = session?.user?.roles || [];
  const isUserPM = userRoles.includes("PM") || userRoles.includes("Admin");
  const isUserDesigner = userRoles.includes("Designer") || isUserPM;

  return (
    <div style={{ padding: "24px" }}>
      <ProjectHeader
        project={project}
        onStatusChange={handleProjectStatusUpdate}
        isUserPM={isUserPM}
      />

      <Tabs defaultActiveKey="tasks" style={{ marginTop: 24 }}>
        <TabPane tab="Zadania" key="tasks">
          <TaskSection
            tasks={tasks}
            projectId={Number(projectId)}
            users={users}
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
            isUserPM={isUserPM}
          />
        </TabPane>

        <TabPane tab="Makiety" key="wireframes">
          <WireframeSection
            projectId={Number(projectId)}
            wireframeLink={project.wireframe_link}
            onWireframeUpdate={handleWireframeUpdate}
            isUserDesigner={isUserDesigner}
          />
        </TabPane>

        <TabPane tab="Spotkania" key="meetings">
          <MeetingSection
            meetings={meetings}
            projectId={Number(projectId)}
            onMeetingCreate={handleMeetingCreate}
            isUserPM={isUserPM}
          />
        </TabPane>
      </Tabs>
    </div>
  );
}
