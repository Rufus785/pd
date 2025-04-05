"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Tabs,
  Button,
  Table,
  Space,
  message,
  Tooltip,
  Input,
  Modal,
  Typography,
} from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import { Eye, Trash2 } from "lucide-react";
import RoleModal from "./components/role-modal";
import RoleDetailsModal from "./components/role-detail-modal";

const { Title } = Typography;

interface Role {
  id: number;
  name: string;
  users: any[];
}

export default function AdminRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/roles");
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const data = await response.json();
      setRoles(data.roles || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
      message.error("Failed to load roles");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = () => {
    setSelectedRole(null);
    setIsModalVisible(true);
  };

  const handleViewDetails = (role: Role) => {
    setSelectedRole(role);
    setIsDetailsModalVisible(true);
  };
  const handleDeleteRole = (role: Role) => {
    setRoleToDelete(role.id);
    setIsDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/auth/roles/${roleToDelete}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete role");
      }
      message.success("Rola został pomyślnie usunięty");
      setIsDeleteModalVisible(false);
      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
      message.error(
        error instanceof Error ? error.message : "Failed to delete role"
      );
    } finally {
      setDeleteLoading(false);
    }
  };
  const cancelDelete = () => {
    setIsDeleteModalVisible(false);
    setRoleToDelete(null);
  };

  const handleModalClose = (refreshData: boolean) => {
    setIsModalVisible(false);
    if (refreshData) {
      fetchRoles();
    }
  };

  const handleDetailsModalClose = (refreshData: boolean) => {
    setIsDetailsModalVisible(false);
    if (refreshData) {
      fetchRoles();
    }
  };

  const filteredRoles = roles.filter(
    (role) =>
      typeof role.name === "string" &&
      role.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: "Nazwa",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Role) => (
        <a onClick={() => handleViewDetails(record)}>{text}</a>
      ),
    },
    {
      title: "Użytkownicy",
      dataIndex: "users",
      key: "users",
      render: (users: any[]) => {
        if (!users || users.length === 0) return "Brak użytkowników";

        return (
          <Tooltip title={users.map((user) => user.nickname).join(", ")}>
            {users.length} użytkownik(ów)
          </Tooltip>
        );
      },
    },
    {
      title: "Akcje",
      key: "actions",
      render: (_: any, record: Role) => (
        <Space>
          <Tooltip title="Szczegóły">
            <Button
              icon={<Eye size={16} />}
              onClick={() => handleViewDetails(record)}
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
              Zarządzanie rolami
            </Title>
            <Space>
              <Input
                placeholder="Szukaj ról"
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
          dataSource={filteredRoles}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            current: currentPage,
            onChange: (page) => setCurrentPage(page),
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} z ${total} ról`,
          }}
        />
      </Card>

      <RoleModal
        visible={isModalVisible}
        onClose={handleModalClose}
        role={selectedRole}
      />

      <RoleDetailsModal
        visible={isDetailsModalVisible}
        onClose={handleDetailsModalClose}
        role={selectedRole}
      />
    </div>
  );
}
