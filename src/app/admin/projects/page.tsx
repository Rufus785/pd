"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Table,
  Tag,
  Space,
  message,
  Tooltip,
  Input,
  Modal,
  Typography,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { Edit, Eye, Trash2 } from "lucide-react";
import ProjectModal from "./components/project-modal";
import ProjectDetailsModal from "./components/project-detail-modal";
const { TabPane } = Tabs;
const { Title } = Typography;

interface Project {
  id: number;
  name: string;
  status: string;
  payment_status: string;
  subscription_end: string | null;
  wireframe_link: string | null;
  teams: any[];
  meetings: any[];
}

export default function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/projects");
      if (!response.ok) {
        throw new Error("Failed to fetch projects");
      }
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddProject = () => {
    setSelectedProject(null);
    setIsModalVisible(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    setIsModalVisible(true);
  };

  const handleViewDetails = (project: Project) => {
    setSelectedProject(project);
    setIsDetailsModalVisible(true);
  };
  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project.id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/auth/projects/${projectToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete project");
      }
      message.success("Projekt został pomyślnie usunięty");
      setIsDeleteModalVisible(false);
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to delete project"
      );
    } finally {
      setDeleteLoading(false);
    }
  };
  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setProjectToDelete(null);
  };
  const handleModalClose = (refreshData: boolean) => {
    setIsModalVisible(false);
    if (refreshData) {
      fetchProjects();
    }
  };

  const handleDetailsModalClose = (refreshData: boolean) => {
    setIsDetailsModalVisible(false);
    if (refreshData) {
      fetchProjects();
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

  const isProjectActive = (project: Project) => {
    if (project.status !== "Active") return false;

    if (!project.subscription_end) return true;

    const subscriptionEndDate = new Date(project.subscription_end);
    const currentDate = new Date();

    return subscriptionEndDate > currentDate;
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const activeProjects = filteredProjects.filter(isProjectActive);
  const inactiveProjects = filteredProjects.filter(
    (project) => !isProjectActive(project)
  );

  const columns = [
    {
      title: "Nazwa",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Project) => (
        <a onClick={() => handleViewDetails(record)}>{text}</a>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Status płatności",
      dataIndex: "payment_status",
      key: "payment_status",
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Koniec subskrypcji",
      dataIndex: "subscription_end",
      key: "subscription_end",
      render: (date: string) => {
        if (!date) return "Brak daty końcowej";

        const endDate = new Date(date);
        const currentDate = new Date();
        const isExpired = endDate < currentDate;

        return (
          <Tooltip
            title={isExpired ? "Subskrypcja wygasła" : "Aktywna subskrypcja"}
          >
            <span style={{ color: isExpired ? "#ff4d4f" : "#52c41a" }}>
              <CalendarOutlined style={{ marginRight: 8 }} />
              {endDate.toLocaleDateString()}
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: "Zespoły",
      dataIndex: "teams",
      key: "teams",
      render: (teams: any[]) => {
        if (!teams || teams.length === 0) return "Brak zespołów";

        return (
          <Tooltip title={teams.map((team) => team.team_name).join(", ")}>
            {teams.length} zespół(ów)
          </Tooltip>
        );
      },
    },
    {
      title: "Akcje",
      key: "actions",
      render: (_: any, record: Project) => (
        <Space>
          <Tooltip title="Szczegóły">
            <Button
              icon={<Eye size={16} />}
              onClick={() => handleViewDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Edytuj">
            <Button
              type="primary"
              icon={<Edit size={16} />}
              onClick={() => handleEditProject(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Usuń">
            <Button
              danger
              icon={<Trash2 size={16} />}
              onClick={() => handleDeleteProject(record)}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Zarządzanie projektami
            </Title>
            <Space>
              <Input
                placeholder="Szukaj projektów"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddProject}
              >
                Dodaj projekt
              </Button>
            </Space>
          </div>
        }
      >
        <Tabs defaultActiveKey="active">
          <TabPane
            tab={`Aktywne projekty (${activeProjects.length})`}
            key="active"
          >
            <Table
              columns={columns}
              dataSource={activeProjects}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                current: currentPage,
                onChange: (page) => setCurrentPage(page),
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} z ${total} projektów`,
              }}
            />
          </TabPane>
          <TabPane
            tab={`Nieaktywne projekty (${inactiveProjects.length})`}
            key="inactive"
          >
            <Table
              columns={columns}
              dataSource={inactiveProjects}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                current: currentPage,
                onChange: (page) => setCurrentPage(page),
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} z ${total} projektów`,
              }}
            />
          </TabPane>
        </Tabs>
      </Card>

      <ProjectModal
        visible={isModalVisible}
        onClose={handleModalClose}
        project={selectedProject}
      />

      <ProjectDetailsModal
        visible={isDetailsModalVisible}
        onClose={handleDetailsModalClose}
        project={selectedProject}
        onEdit={handleEditProject}
      />
      <Modal
        title="Potwierdzenie usunięcia"
        open={isDeleteModalVisible}
        onCancel={cancelDelete}
        footer={[
          <Button key="cancel" onClick={cancelDelete}>
            Anuluj
          </Button>,
          <Button
            key="delete"
            danger
            type="primary"
            loading={deleteLoading}
            onClick={confirmDelete}
          >
            Usuń
          </Button>,
        ]}
      >
        <div
          style={{ display: "flex", alignItems: "center", marginBottom: 16 }}
        >
          <Trash2 style={{ color: "red", marginRight: 8 }} />
          <span>Czy na pewno chcesz usunąć ten projekt?</span>
        </div>
        <p>
          Tej operacji nie można cofnąć. Wszystkie dane projektu zostaną
          usunięte.
        </p>
      </Modal>
    </div>
  );
}
