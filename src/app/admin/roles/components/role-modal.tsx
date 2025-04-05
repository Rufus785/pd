"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, message } from "antd";

interface RoleModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  role: {
    id: number;
    name: string;
  } | null;
}

const RoleModal: React.FC<RoleModalProps> = ({ visible, onClose, role }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && role) {
      form.setFieldsValue({
        name: role.name,
      });
    } else {
      form.resetFields();
    }
  }, [visible, role, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const url = role ? `/api/auth/roles/${role.id}` : "/api/auth/roles";
      const method = role ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to save role");
      }

      message.success(
        `Rola została ${role ? "zaktualizowana" : "utworzona"} pomyślnie`
      );
      onClose(true);
    } catch (error) {
      console.error("Error saving role:", error);
      message.error("Nie udało się zapisać roli");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={role ? "Edytuj rolę" : "Dodaj nową rolę"}
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
          {role ? "Zapisz zmiany" : "Dodaj rolę"}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Nazwa roli"
          rules={[
            { required: true, message: "Proszę podać nazwę roli" },
            { min: 2, message: "Nazwa roli musi mieć co najmniej 2 znaki" },
          ]}
        >
          <Input placeholder="Wprowadź nazwę roli" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RoleModal;
