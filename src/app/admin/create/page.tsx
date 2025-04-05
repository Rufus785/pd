"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Form, Card, Alert, Select, Tag, Space } from "antd";

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRoles = async () => {
      const res = await fetch("/api/roles");
      const data = await res.json();
      if (res.ok) {
        setRoles(data.roles);
      } else {
        setError("Nie udało się załadować ról");
      }
    };

    fetchRoles();
  }, []);

  const handleAddRole = (value: string) => {
    if (!selectedRoles.includes(value) && value) {
      setSelectedRoles([...selectedRoles, value]);
    }
  };

  const handleRemoveRole = (role: string) => {
    setSelectedRoles(selectedRoles.filter((r) => r !== role));
  };

  const handleSubmit = async (values: {
    nickname: string;
    password: string;
  }) => {
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: values.nickname,
          password_hash: values.password,
          roles: selectedRoles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Rejestracja nie powiodła się");
      } else {
        setSuccess(true);
        setTimeout(() => {}, 2000);
      }
    } catch (error) {
      setError("Wystąpił błąd podczas rejestracji");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <Card title={<div style={{ textAlign: "center" }}>Rejestracja</div>}>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {success && (
          <Alert
            message="Rejestracja zakończona sukcesem!"
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            label="Pseudonim"
            name="nickname"
            rules={[{ required: true, message: "Podaj swój pseudonim!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Hasło"
            name="password"
            rules={[{ required: true, message: "Podaj swoje hasło!" }]}
          >
            <Input.Password />
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

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {loading ? "Rejestrowanie..." : "Zarejestruj się"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
