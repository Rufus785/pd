"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Tag,
  Tabs,
  Table,
  Space,
  Typography,
  Empty,
  Select,
  message,
} from "antd";
import {
  CalendarOutlined,
  DollarOutlined,
  FileOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Edit } from "lucide-react";

const { TabPane } = Tabs;
const { Text, Link } = Typography;
const { Option } = Select;

interface Team {
  id: number;
  name: string;
  project_id?: number | null;
  members_count: number;
}

interface ProjectDetailsModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  project: any | null;
  onEdit: (project: any) => void;
}

export default function ProjectDetailsModal({
  visible,
  onClose,
  project,
  onEdit,
}: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<number | undefined>(
    undefined
  );
  const [assigningTeam, setAssigningTeam] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchTeams();
    }
  }, [visible]);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      message.error("Nie udało się załadować zespołów");
    }
  };

  if (!project) {
    return null;
  }

  const handleClose = () => {
    onClose(false);
  };

  const handleEdit = () => {
    onEdit(project);
    onClose(false);
  };

  const handleAssignTeam = async () => {
    if (!selectedTeam) {
      message.error("Wybierz zespół do przypisania");
      return;
    }

    try {
      setAssigningTeam(true);
      const response = await fetch(`/api/auth/teams/${selectedTeam}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: project.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to assign team to project");
      }

      message.success("Zespół został przypisany do projektu");
      onClose(true);
    } catch (error) {
      console.error("Error assigning team:", error);
      message.error("Nie udało się przypisać zespołu do projektu");
    } finally {
      setAssigningTeam(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Archived":
        return "orange";
      case "Closed":
        return "red";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return status === "Paid" ? "green" : "red";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nie ustawiono";
    return new Date(dateString).toLocaleDateString();
  };

  const isSubscriptionActive = () => {
    if (!project.subscription_end) return true;

    const endDate = new Date(project.subscription_end);
    const currentDate = new Date();

    return endDate > currentDate;
  };

  const teamColumns = [
    {
      title: "Nazwa zespołu",
      dataIndex: "team_name",
      key: "team_name",
    },
    {
      title: "Członkowie",
      dataIndex: "members",
      key: "members",
      render: (members: any[]) => {
        if (!members || members.length === 0) return "Brak członków";
        return `${members.length} członek(ów)`;
      },
    },
  ];

  const meetingColumns = [
    {
      title: "Data",
      dataIndex: "meeting_date",
      key: "meeting_date",
      render: (date: string) => formatDate(date),
    },
    {
      title: "Opis",
      dataIndex: "description",
      key: "description",
      render: (text: string) => text || "Brak opisu",
    },
  ];

  const availableTeams = teams.filter(
    (team) => !team.project_id || team.project_id === project.id
  );

  return (
    <Modal
      title={
        <Space>
          <span>{project.name}</span>
          <Tag color={getStatusColor(project.status)}>{project.status}</Tag>
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          Zamknij
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<Edit size={16} />}
          onClick={handleEdit}
        >
          Edytuj projekt
        </Button>,
      ]}
      width={800}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane
          tab={
            <span>
              <FileOutlined />
              Szczegóły projektu
            </span>
          }
          key="details"
        >
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID projektu">
              {project.id}
            </Descriptions.Item>
            <Descriptions.Item label="Nazwa projektu">
              {project.name}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(project.status)}>{project.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Status płatności">
              <Tag color={getPaymentStatusColor(project.payment_status)}>
                <DollarOutlined style={{ marginRight: 4 }} />
                {project.payment_status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Koniec subskrypcji">
              <Space>
                <CalendarOutlined />
                <Text type={isSubscriptionActive() ? "success" : "danger"}>
                  {formatDate(project.subscription_end)}
                </Text>
                {!isSubscriptionActive() && <Tag color="red">Wygasła</Tag>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label="Link do wireframe">
              {project.wireframe_link ? (
                <Link href={project.wireframe_link} target="_blank">
                  {project.wireframe_link}
                </Link>
              ) : (
                "Brak linku do wireframe"
              )}
            </Descriptions.Item>
          </Descriptions>
        </TabPane>

        <TabPane
          tab={
            <span>
              <TeamOutlined />
              Zespoły ({project.teams?.length || 0})
            </span>
          }
          key="teams"
        >
          <div style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <Select
                  placeholder="Wybierz zespół do przypisania"
                  style={{ width: 300 }}
                  value={selectedTeam}
                  onChange={setSelectedTeam}
                >
                  {availableTeams.map((team) => (
                    <Option key={team.id} value={team.id}>
                      {team.name} ({team.members_count} członków)
                    </Option>
                  ))}
                </Select>
                <Button
                  type="primary"
                  onClick={handleAssignTeam}
                  loading={assigningTeam}
                  disabled={!selectedTeam}
                >
                  Przypisz zespół
                </Button>
              </div>
            </Space>
          </div>

          {project.teams && project.teams.length > 0 ? (
            <Table
              dataSource={project.teams}
              columns={teamColumns}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Empty description="Brak zespołów przypisanych do tego projektu" />
          )}
        </TabPane>

        <TabPane
          tab={
            <span>
              <CalendarOutlined />
              Spotkania ({project.meetings?.length || 0})
            </span>
          }
          key="meetings"
        >
          {project.meetings && project.meetings.length > 0 ? (
            <Table
              dataSource={project.meetings}
              columns={meetingColumns}
              rowKey="id"
              pagination={false}
            />
          ) : (
            <Empty description="Brak zaplanowanych spotkań dla tego projektu" />
          )}
        </TabPane>
      </Tabs>
    </Modal>
  );
}
