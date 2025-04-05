"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Input, Form, Card, Alert } from "antd";

export default function LoginPage() {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const router = useRouter();

  const handleSubmit = async (values: {
    nickname: string;
    password: string;
  }) => {
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        nickname: values.nickname,
        password: values.password,
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.push("/");
      }
    } catch (error) {
      setError("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", padding: "20px" }}>
      <Card title={<div style={{ textAlign: "center" }}>Login</div>}>
        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form name="login" onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Nickname"
            name="nickname"
            rules={[{ required: true, message: "Please input your nickname!" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {loading ? "Logging in..." : "Login"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
