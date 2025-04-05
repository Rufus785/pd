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
import { SearchOutlined } from "@ant-design/icons";
import { Edit, Eye, Trash2, Key } from "lucide-react";
import UserModal from "./components/user-modal";
import UserDetailsModal from "./components/user-detail-modal";
import ResetPasswordModal from "./components/reset-password-modal";

const { TabPane } = Tabs;
const { Title } = Typography;

interface User {
  id: number;
  nickname: string;
  password_changed: boolean;
  roles: {
    id: number;
    name: string;
  }[];
  teams?: {
    id: number;
    name: string;
    role: string;
    project_id: number;
  }[];
  tasks?: {
    id: number;
    title: string;
    status: string;
    priority: string;
  }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isResetPasswordModalVisible, setIsResetPasswordModalVisible] =
    useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/user");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleViewDetails = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalVisible(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setIsResetPasswordModalVisible(true);
  };

  const handleModalClose = (refreshData: boolean) => {
    setIsModalVisible(false);
    if (refreshData) {
      fetchUsers();
    }
  };

  const handleDetailsModalClose = () => {
    setIsDetailsModalVisible(false);
  };

  const handleResetPasswordModalClose = (refreshData: boolean) => {
    setIsResetPasswordModalVisible(false);
    if (refreshData) {
      fetchUsers();
    }
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user.id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/auth/user/${userToDelete}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete user");
      }

      message.success("Użytkownik został pomyślnie usunięty");
      setIsDeleteModalVisible(false);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to delete user"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setUserToDelete(null);
  };

  const filteredUsers = users.filter((user) =>
    user.nickname.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nazwa użytkownika",
      dataIndex: "nickname",
      key: "nickname",
      render: (text: string, record: User) => (
        <a onClick={() => handleViewDetails(record)}>{text}</a>
      ),
    },
    {
      title: "Status hasła",
      dataIndex: "password_changed",
      key: "password_changed",
      render: (changed: boolean) => (
        <Tag color={changed ? "green" : "red"}>
          {changed ? "Zmienione" : "Domyślne"}
        </Tag>
      ),
    },
    {
      title: "Role",
      dataIndex: "roles",
      key: "roles",
      render: (roles: { id: number; name: string }[]) => (
        <Space size={[0, 4]} wrap>
          {roles.map((role) => (
            <Tag key={role.id} color="blue">
              {role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Zespoły",
      dataIndex: "teams",
      key: "teams",
      render: (teams: any[]) => {
        if (!teams || teams.length === 0) return "Brak";
        return `${teams.length} zespół(ów)`;
      },
    },
    {
      title: "Akcje",
      key: "actions",
      render: (_: any, record: User) => (
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
              onClick={() => handleEditUser(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Resetuj hasło">
            <Button
              icon={<Key size={16} />}
              onClick={() => handleResetPassword(record)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Usuń">
            <Button
              danger
              icon={<Trash2 size={16} />}
              onClick={() => handleDeleteUser(record)}
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
              Zarządzanie użytkownikami
            </Title>
            <Space>
              <Input
                placeholder="Szukaj użytkowników"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            </Space>
          </div>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredUsers}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            current: currentPage,
            onChange: (page) => setCurrentPage(page),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} z ${total} użytkowników`,
          }}
        />
      </Card>

      <UserModal
        visible={isModalVisible}
        onClose={handleModalClose}
        user={selectedUser}
      />

      <UserDetailsModal
        visible={isDetailsModalVisible}
        onClose={handleDetailsModalClose}
        user={selectedUser}
        onEdit={handleEditUser}
      />

      <ResetPasswordModal
        visible={isResetPasswordModalVisible}
        onClose={handleResetPasswordModalClose}
        user={selectedUser}
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
          <span>Czy na pewno chcesz usunąć tego użytkownika?</span>
        </div>
        <p>
          Tej operacji nie można cofnąć. Wszystkie dane użytkownika zostaną
          usunięte.
        </p>
      </Modal>
    </div>
  );
}
