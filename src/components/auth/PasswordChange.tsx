"use client";
import { useState } from "react";
import { Modal, Form, Input, Button, message, Typography } from "antd";
import { useSession, signOut } from "next-auth/react";

const { Title, Paragraph } = Typography;

interface PasswordChangeModalProps {
  isOpen: boolean;
  onPasswordChanged: () => void;
}

export default function PasswordChangeModal({
  isOpen,
}: PasswordChangeModalProps) {
  const { data: session } = useSession();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
  }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/changepassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session?.user?.id,
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change password");

      message.success("Hasło zmienione. Zaloguj się ponownie.");

      await signOut({ callbackUrl: "/login", redirect: true });
    } catch (e) {
      message.error(
        e instanceof Error ? e.message : "Błąd podczas zmiany hasła"
      );
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      closable={false}
      maskClosable={false}
      footer={null}
      title="Wymagana zmiana hasła"
      width={500}
    >
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
              { required: true, message: "Proszę wpisać aktualne hasło" },
            ]}
          >
            <Input.Password placeholder="Proszę wpisać aktualne hasło" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="Nowe hasło"
            rules={[
              { required: true, message: "Proszę wpisać nowe hasło" },
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
                  if (!value || getFieldValue("newPassword") === value)
                    return Promise.resolve();
                  return Promise.reject(new Error("Hasła się różnią"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Potwierdź swoje hasło" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Zmień hasło
            </Button>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
