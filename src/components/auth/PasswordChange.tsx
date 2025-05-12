"use client";
import { useState } from "react";
import { Modal, Form, Input, Button, message, Typography } from "antd";
import { useSession } from "next-auth/react";

const { Title, Paragraph } = Typography;

interface PasswordChangeModalProps {
  isOpen: boolean;
  onPasswordChanged: () => void;
}

export default function PasswordChangeModal({
  isOpen,
  onPasswordChanged,
}: PasswordChangeModalProps) {
  const { data: session, update } = useSession();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const modalProps = {
    open: isOpen,
    closable: false,
    maskClosable: false,
    footer: null,
    title: "Wymagana zmiana hasła",
    width: 500,
  };

  const refreshSession = async () => {
    try {
      const response = await fetch("/api/auth/sessionupdate");
      const data = await response.json();

      if (response.ok && data.session) {
        await update({
          ...data.session,
          user: {
            ...data.session.user,
            passwordChanged: true,
          },
        });

        message.success("Session refreshed successfully");
      }
    } catch (error) {
      console.error("Failed to refresh session:", error);
    }
  };

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setLoading(true);

    try {
      const response = await fetch("/api/auth/changepassword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session?.user?.id,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to change password");
      }

      message.success("Password changed successfully");
      onPasswordChanged();

      try {
        await update({
          ...session,
          user: {
            ...session?.user,
            passwordChanged: true,
          },
        });

        await refreshSession();
      } catch (updateError) {
        console.error("Failed to update session:", updateError);
        await refreshSession();
      }
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : "An error occurred while changing password"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal {...modalProps}>
      <div style={{ padding: "16px 0" }}>
        <Title level={4}>Twoje hasło musi zostać zmienione!</Title>
        <Paragraph type="warning">
          Twoje konto nie jest bezpieczne. Musisz zmienić hasło, aby
          kontynuować.
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handlePasswordChange}
          requiredMark="optional"
        >
          <Form.Item
            name="currentPassword"
            label="Aktualne hasło"
            rules={[
              {
                required: true,
                message: "Prosze wpisac aktualne hasło",
              },
            ]}
          >
            <Input.Password placeholder="Prosze wpisac aktualne hasło" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Nowe hasło"
            rules={[
              { required: true, message: "Prosze wpisac nowe hasło" },
              { min: 8, message: "Hasło musi mieć minimalnie 8 znaków" },
            ]}
          >
            <Input.Password placeholder="Wprowadź hasło" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Potwierdź nowe hasło"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Proszę potwierdzić hasło" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("Hasła się różnią"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Potwierdź swoje hasło" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Zmien hasło
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
