"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Modal, Descriptions, Button, Spin, message, Table, Tag } from "antd";

interface RoleDetailsModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  role: {
    id: number;
    name: string;
  } | null;
}

const RoleDetailsModal: React.FC<RoleDetailsModalProps> = ({
  visible,
  onClose,
  role,
}) => {
  const [roleDetails, setRoleDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && role) {
      fetchRoleDetails();
    }
  }, [visible, role]);

  const fetchRoleDetails = async () => {
    if (!role) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/auth/roles/${role.id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch role details");
      }
      const data = await response.json();
      setRoleDetails(data);
    } catch (error) {
      console.error("Error fetching role details:", error);
      message.error("Nie udało się pobrać szczegółów roli");
    } finally {
      setLoading(false);
    }
  };

  const userColumns = [
    {
      title: "Nazwa użytkownika",
      dataIndex: "nickname",
      key: "nickname",
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
  ];

  if (!visible || !role) return null;

  return (
    <Modal
      title={
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Szczegóły roli: {role.name}</span>
        </div>
      }
      open={visible}
      onCancel={() => onClose(false)}
      width={700}
      footer={[
        <Button key="close" onClick={() => onClose(false)}>
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
          <Descriptions bordered column={1}>
            <Descriptions.Item label="ID">{roleDetails?.id}</Descriptions.Item>
            <Descriptions.Item label="Nazwa">
              {roleDetails?.name}
            </Descriptions.Item>
            <Descriptions.Item label="Liczba użytkowników">
              {roleDetails?.users?.length || 0}
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginTop: "20px" }}>
            <h3>Użytkownicy z tą rolą</h3>
            {roleDetails?.users && roleDetails.users.length > 0 ? (
              <Table
                dataSource={roleDetails.users}
                columns={userColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            ) : (
              <p>Brak użytkowników z tą rolą</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default RoleDetailsModal;
