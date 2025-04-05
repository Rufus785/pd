"use client";

import type React from "react";

import { useState, useEffect } from "react";
import {
  Modal,
  Descriptions,
  Button,
  Spin,
  message,
  Table,
  Tag,
  Tabs,
} from "antd";
import { Edit } from "lucide-react";

const { TabPane } = Tabs;

interface UserDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: number;
    nickname: string;
  } | null;
  onEdit: (user: any) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  visible,
  onClose,
  user,
  onEdit,
}) => {
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user) {
      fetchUserDetails();
    }
  }, [visible, user]);

  const fetchUserDetails = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/auth/user/${user.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }
      const data = await response.json();
      setUserDetails(data);
    } catch (error) {
      console.error("Error fetching user details:", error);
      message.error("Nie udało się pobrać szczegółów użytkownika");
    } finally {
      setLoading(false);
    }
  };

  const roleColumns = [
    {
      title: "Nazwa roli",
      dataIndex: "name",
      key: "name",
    },
  ];

  const teamColumns = [
    {
      title: "Nazwa zespołu",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Rola w zespole",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "ID projektu",
      dataIndex: "project_id",
      key: "project_id",
    },
  ];

  const taskColumns = [
    {
      title: "Tytuł zadania",
      dataIndex: "title",
      key: "title",
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
      title: "Priorytet",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ToDo":
        return "blue";
      case "InProgress":
        return "orange";
      case "CodeReview":
        return "purple";
      case "Deprecated":
        return "red";
      case "Done":
        return "green";
      default:
        return "default";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Low":
        return "green";
      case "Medium":
        return "orange";
      case "High":
        return "red";
      default:
        return "default";
    }
  };

  if (!visible || !user) return null;

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Szczegóły użytkownika: {user.nickname}</span>
          <Button
            type="primary"
            icon={<Edit size={16} />}
            onClick={() => {
              onClose();
              onEdit(user);
            }}
          >
            Edytuj
          </Button>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Zamknij
        </Button>,
      ]}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Spin size="large" />
        </div>
      ) : (
        <div>
          <Descriptions bordered column={1} style={{ marginBottom: 20 }}>
            <Descriptions.Item label="ID">{userDetails?.id}</Descriptions.Item>
            <Descriptions.Item label="Nazwa użytkownika">
              {userDetails?.nickname}
            </Descriptions.Item>
            <Descriptions.Item label="Status hasła">
              <Tag color={userDetails?.password_changed ? "green" : "red"}>
                {userDetails?.password_changed ? "Zmienione" : "Domyślne"}
              </Tag>
            </Descriptions.Item>
          </Descriptions>

          <Tabs defaultActiveKey="roles">
            <TabPane tab="Role" key="roles">
              {userDetails?.roles && userDetails.roles.length > 0 ? (
                <Table
                  dataSource={userDetails.roles}
                  columns={roleColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <p>Brak przypisanych ról</p>
              )}
            </TabPane>
            <TabPane tab="Zespoły" key="teams">
              {userDetails?.teams && userDetails.teams.length > 0 ? (
                <Table
                  dataSource={userDetails.teams}
                  columns={teamColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <p>Użytkownik nie należy do żadnego zespołu</p>
              )}
            </TabPane>
            <TabPane tab="Zadania" key="tasks">
              {userDetails?.tasks && userDetails.tasks.length > 0 ? (
                <Table
                  dataSource={userDetails.tasks}
                  columns={taskColumns}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ) : (
                <p>Brak przypisanych zadań</p>
              )}
            </TabPane>
          </Tabs>
        </div>
      )}
    </Modal>
  );
};

export default UserDetailsModal;
