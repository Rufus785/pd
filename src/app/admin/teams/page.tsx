"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Button,
  Table,
  Space,
  message,
  Tooltip,
  Input,
  Modal,
  Typography,
  Tag,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Eye, Trash2 } from "lucide-react";
import TeamModal from "./components/team-modal";
import TeamDetailsModal from "./components/team-detail-modal";

const { Title } = Typography;

interface TeamMember {
  user_id: number;
  nickname: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  project_id: number;
  project_name: string;
  project_status: string;
  members: TeamMember[];
}

export default function AdminTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      message.error("Nie udało się załadować zespołów");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTeam = () => {
    setSelectedTeam(null);
    setIsModalVisible(true);
  };

  const handleViewDetails = (team: Team) => {
    setSelectedTeam(team);
    setIsDetailsModalVisible(true);
  };

  const handleDeleteTeam = (team: Team) => {
    setTeamToDelete(team.id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!teamToDelete) return;
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/auth/teams/${teamToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete team");
      }
      message.success("Zespół został pomyślnie usunięty");
      setIsDeleteModalVisible(false);
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      message.error(
        error instanceof Error ? error.message : "Nie udało się usunąć zespołu"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setTeamToDelete(null);
  };

  const handleModalClose = (refreshData: boolean) => {
    setIsModalVisible(false);
    if (refreshData) {
      fetchTeams();
    }
  };

  const handleDetailsModalClose = (refreshData: boolean) => {
    setIsDetailsModalVisible(false);
    if (refreshData) {
      fetchTeams();
    }
  };

  const filteredTeams = teams.filter(
    (team) =>
      typeof team.name === "string" &&
      team.name.toLowerCase().includes(searchText.toLowerCase())
  );

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

  const columns = [
    {
      title: "Nazwa zespołu",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Team) => (
        <a onClick={() => handleViewDetails(record)}>{text}</a>
      ),
    },
    {
      title: "Projekt",
      dataIndex: "project_name",
      key: "project_name",
    },
    {
      title: "Status projektu",
      dataIndex: "project_status",
      key: "project_status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: "Członkowie",
      dataIndex: "members",
      key: "members",
      render: (members: TeamMember[]) => {
        if (!members || members.length === 0) return "Brak członków";

        return (
          <Tooltip title={members.map((member) => member.nickname).join(", ")}>
            {members.length} członek(ów)
          </Tooltip>
        );
      },
    },
    {
      title: "Akcje",
      key: "actions",
      render: (_: any, record: Team) => (
        <Space>
          <Tooltip title="Szczegóły">
            <Button
              icon={<Eye size={16} />}
              onClick={() => handleViewDetails(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Usuń">
            <Button
              danger
              icon={<Trash2 size={16} />}
              onClick={() => handleDeleteTeam(record)}
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
              Zarządzanie zespołami
            </Title>
            <Space>
              <Input
                placeholder="Szukaj zespołów"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddTeam}
              >
                Dodaj zespół
              </Button>
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredTeams}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            current: currentPage,
            onChange: (page) => setCurrentPage(page),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} z ${total} zespołów`,
          }}
        />
      </Card>

      <TeamModal
        visible={isModalVisible}
        onClose={handleModalClose}
        team={selectedTeam}
      />

      <TeamDetailsModal
        visible={isDetailsModalVisible}
        onClose={handleDetailsModalClose}
        team={selectedTeam}
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
          <span>Czy na pewno chcesz usunąć ten zespół?</span>
        </div>
        <p>
          Tej operacji nie można cofnąć. Wszyscy członkowie zostaną usunięci z
          zespołu.
        </p>
      </Modal>
    </div>
  );
}
