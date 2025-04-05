"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import DisplayIfAdmin from "@/components/DisplayIfAdmin";
import {
  Modal,
  Form,
  Input,
  Button,
  message,
  Card,
  Typography,
  Space,
} from "antd";

const { Title, Text, Paragraph } = Typography;

export default function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const { data: session, status, update } = useSession();
  const [localPasswordChanged, setLocalPasswordChanged] = useState(false);

  const modalProps = {
    open: isModalOpen && !localPasswordChanged,
    closable: false,
    maskClosable: false,
    footer: null,
    title: "Password Change Required",
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
      setLocalPasswordChanged(true);
      setIsModalOpen(false);

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

  const handleLogout = async () => {
    await signOut({ redirect: false });
    window.location.reload();
  };

  useEffect(() => {
    if (session?.user?.passwordChanged === false && !localPasswordChanged) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
    console.log("Session updated:", session?.user?.passwordChanged);
  }, [session, localPasswordChanged]);

  return (
    <div style={{ maxWidth: "600px", margin: "50px auto", padding: "20px" }}>
      <Modal {...modalProps}>
        <div style={{ padding: "16px 0" }}>
          <Title level={4}>Your password needs to be changed!</Title>
          <Paragraph type="warning">
            Your account is not secure. You must change your password to
            continue.
          </Paragraph>

          <Form
            form={form}
            layout="vertical"
            onFinish={handlePasswordChange}
            requiredMark="optional"
          >
            <Form.Item
              name="currentPassword"
              label="Current Password"
              rules={[
                {
                  required: true,
                  message: "Please enter your current password",
                },
              ]}
            >
              <Input.Password placeholder="Enter your current password" />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="New Password"
              rules={[
                { required: true, message: "Please enter a new password" },
                // { min: 8, message: "Password must be at least 8 characters" },
              ]}
            >
              <Input.Password placeholder="Enter a new password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="Confirm New Password"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Please confirm your new password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("The two passwords do not match")
                    );
                  },
                }),
              ]}
            >
              <Input.Password placeholder="Confirm your new password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block>
                Change Password
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Modal>

      <Title level={2} style={{ textAlign: "center", marginBottom: "20px" }}>
        Authentication
      </Title>

      <DisplayIfAdmin adminOnly={true}>
        <Button
          type="link"
          href="/admin"
          style={{ padding: 0, marginBottom: 16 }}
        >
          Admin panel
        </Button>
      </DisplayIfAdmin>

      <Card>
        {status === "authenticated" ? (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>
              You are logged in as <Text strong>{session.user?.name}</Text>
            </Paragraph>

            <Paragraph>
              Password Changed:
              <Text
                type={
                  session.user?.passwordChanged || localPasswordChanged
                    ? "success"
                    : "danger"
                }
              >
                {session.user?.passwordChanged || localPasswordChanged
                  ? " Yes"
                  : " No"}
              </Text>
            </Paragraph>

            {session.user?.roles && (
              <Paragraph type="secondary">
                Roles:{" "}
                {Array.isArray(session.user.roles)
                  ? session.user.roles.join(", ")
                  : "None"}
              </Paragraph>
            )}

            <Button danger onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        ) : (
          <Space direction="vertical" style={{ width: "100%" }}>
            <Paragraph>You are not logged in</Paragraph>
            <Space>
              <Button type="primary">
                <Link href="/login">Login</Link>
              </Button>
              <Button>
                <Link href="/register">Register</Link>
              </Button>
            </Space>
          </Space>
        )}
      </Card>
    </div>
  );
}
