"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Select, message, Space, Tag } from "antd";

interface UserModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  user: {
    id: number;
    nickname: string;
    roles: {
      id: number;
      name: string;
    }[];
  } | null;
}

const UserModal: React.FC<UserModalProps> = ({ visible, onClose, user }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (visible) {
      fetchRoles();

      if (user) {
        form.setFieldsValue({
          nickname: user.nickname,
        });

        setSelectedRoles(user.roles.map((role) => role.name));
      } else {
        form.resetFields();
        setSelectedRoles([]);
      }
    }
  }, [visible, user, form]);

  const fetchRoles = async () => {
    try {
      const response = await fetch("/api/roles");
      if (!response.ok) {
        throw new Error("Failed to fetch roles");
      }
      const data = await response.json();
      setRoles(data.roles);
    } catch (error) {
      console.error("Error fetching roles:", error);
      message.error("Nie udało się pobrać ról");
    }
  };

  const handleAddRole = (value: string) => {
    if (!selectedRoles.includes(value) && value) {
      setSelectedRoles([...selectedRoles, value]);
    }
  };

  const handleRemoveRole = (role: string) => {
    setSelectedRoles(selectedRoles.filter((r) => r !== role));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (!user) {
        message.error("Brak danych użytkownika");
        return;
      }

      const response = await fetch(`/api/auth/user/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: values.nickname,
          roles: selectedRoles,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      message.success("Użytkownik został zaktualizowany");
      onClose(true);
    } catch (error) {
      console.error("Error updating user:", error);
      message.error("Nie udało się zaktualizować użytkownika");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edytuj użytkownika"
      open={visible}
      onCancel={() => onClose(false)}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          Anuluj
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Zapisz zmiany
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="nickname"
          label="Nazwa użytkownika"
          rules={[
            { required: true, message: "Proszę podać nazwę użytkownika" },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item label="Role">
          <Select
            placeholder="Wybierz rolę..."
            onChange={handleAddRole}
            style={{ width: "100%" }}
          >
            {roles.map((role) => (
              <Select.Option key={role} value={role}>
                {role}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Wybrane role">
          <Space size={[0, 8]} wrap>
            {selectedRoles.length === 0 ? (
              <span style={{ color: "#999" }}>Brak wybranych ról</span>
            ) : (
              selectedRoles.map((role) => (
                <Tag
                  key={role}
                  closable
                  onClose={() => handleRemoveRole(role)}
                  style={{ marginBottom: 8 }}
                >
                  {role}
                </Tag>
              ))
            )}
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserModal;
