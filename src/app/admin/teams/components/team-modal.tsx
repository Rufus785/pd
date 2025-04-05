"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Select, message, Spin } from "antd";
import { TeamRole } from "@prisma/client";

interface TeamMember {
  user_id: number;
  nickname: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  project_id?: number | null;
  project_name?: string;
  project_status?: string;
  members: TeamMember[];
}

interface User {
  id: number;
  nickname: string;
  roles?: string[];
}

interface TeamModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  team: Team | null;
}

const { Option } = Select;

const TeamModal: React.FC<TeamModalProps> = ({ visible, onClose, team }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (visible) {
      fetchUsers();

      if (team) {
        form.setFieldsValue({
          name: team.name,
          members: team.members.map((member) => ({
            user_id: member.user_id,
            role: member.role,
          })),
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          members: [{ user_id: undefined, role: undefined }],
        });
      }
    }
  }, [visible, team, form]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      message.error("Nie udało się załadować użytkowników");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const validMembers = (values.members || []).filter(
        (member: any) => member.user_id && member.role
      );

      const payload = {
        name: values.name,
        members: validMembers,
      };

      console.log("Submitting team data:", payload);

      const url = team ? `/api/auth/teams/${team.id}` : "/api/auth/teams";
      const method = team ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to save team");
      }

      message.success(
        team ? "Zespół zaktualizowany pomyślnie" : "Zespół utworzony pomyślnie"
      );
      onClose(true);
    } catch (error) {
      console.error("Error saving team:", error);
      message.error(
        error instanceof Error ? error.message : "Nie udało się zapisać zespołu"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={team ? "Edytuj zespół" : "Dodaj nowy zespół"}
      open={visible}
      onCancel={() => onClose(false)}
      footer={[
        <Button key="cancel" onClick={() => onClose(false)}>
          Anuluj
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={submitting}
          onClick={handleSubmit}
        >
          {team ? "Zapisz zmiany" : "Dodaj zespół"}
        </Button>,
      ]}
      width={600}
    >
      <Spin spinning={loading}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ members: [{ user_id: undefined, role: undefined }] }}
        >
          <Form.Item
            name="name"
            label="Nazwa zespołu"
            rules={[{ required: true, message: "Nazwa zespołu jest wymagana" }]}
          >
            <Input placeholder="Wprowadź nazwę zespołu" />
          </Form.Item>

          <Form.List name="members">
            {(fields, { add, remove }) => (
              <>
                {fields.map((field) => (
                  <div
                    key={field.key}
                    style={{ display: "flex", marginBottom: 8, gap: 8 }}
                  >
                    <Form.Item
                      {...field}
                      name={[field.name, "user_id"]}
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[
                        { required: true, message: "Wybierz użytkownika" },
                      ]}
                    >
                      <Select placeholder="Wybierz użytkownika">
                        {users.map((user) => (
                          <Option
                            key={`user-${user.id}-${field.key}`}
                            value={user.id}
                          >
                            {user.nickname}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "role"]}
                      style={{ flex: 1, marginBottom: 0 }}
                      rules={[{ required: true, message: "Wybierz rolę" }]}
                    >
                      <Select placeholder="Wybierz rolę">
                        {Object.values(TeamRole).map((role) => (
                          <Option
                            key={`role-${role}-${field.key}`}
                            value={role}
                          >
                            {role}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button
                        onClick={() => remove(field.name)}
                        type="text"
                        danger
                      >
                        Usuń
                      </Button>
                    )}
                  </div>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block>
                    Dodaj członka zespołu
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Spin>
    </Modal>
  );
};

export default TeamModal;
