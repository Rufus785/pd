"use client";

import type React from "react";

import { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";

interface ResetPasswordModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  user: {
    id: number;
    nickname: string;
  } | null;
}

const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  visible,
  onClose,
  user,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

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
          password: values.password,
          password_changed: false,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reset password");
      }

      message.success("Hasło zostało zresetowane");
      form.resetFields();
      onClose(true);
    } catch (error) {
      console.error("Error resetting password:", error);
      message.error("Nie udało się zresetować hasła");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`Resetuj hasło: ${user?.nickname || ""}`}
      open={visible}
      onCancel={() => onClose(false)}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          Anuluj
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={loading}
          onClick={handleSubmit}
        >
          Resetuj hasło
        </Button>,
      ]}
    >
      <p>
        Uwaga: Resetowanie hasła spowoduje, że użytkownik będzie musiał zmienić
        hasło przy następnym logowaniu.
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          name="password"
          label="Nowe hasło"
          rules={[
            { required: true, message: "Proszę podać nowe hasło" },
            { min: 8, message: "Hasło musi mieć co najmniej 8 znaków" },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="Potwierdź hasło"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Proszę potwierdzić hasło" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("password") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("Hasła nie są zgodne"));
              },
            }),
          ]}
        >
          <Input.Password />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ResetPasswordModal;
