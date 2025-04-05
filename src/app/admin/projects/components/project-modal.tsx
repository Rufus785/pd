"use client";

import { useState, useEffect } from "react";
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  message,
  Divider,
} from "antd";
import moment from "moment";

const { Option } = Select;

interface Team {
  id: number;
  name: string;
  project_id?: number | null;
  members_count: number;
}

interface ProjectModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  project: any | null;
}

export default function ProjectModal({
  visible,
  onClose,
  project,
}: ProjectModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const isEditing = !!project;

  useEffect(() => {
    if (visible) {
      fetchTeams();

      if (project) {
        form.setFieldsValue({
          ...project,
          subscription_end: project.subscription_end
            ? moment(project.subscription_end)
            : null,
          team_id:
            project.teams && project.teams.length > 0
              ? project.teams[0].id
              : undefined,
        });
      } else {
        form.resetFields();
      }
    }
  }, [visible, project, form]);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) {
        throw new Error("Failed to fetch teams");
      }
      const data = await response.json();
      setTeams(data || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
      message.error("Nie udało się załadować zespołów");
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose(false);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (values.subscription_end) {
        values.subscription_end = values.subscription_end.toISOString();
      }

      const teamId = values.team_id;
      delete values.team_id;

      const url = isEditing
        ? `/api/auth/projects/${project.id}`
        : "/api/auth/projects";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `Failed to ${isEditing ? "update" : "create"} project`
        );
      }

      if (teamId) {
        const projectId = isEditing ? project.id : data.project.id;

        const teamResponse = await fetch(`/api/auth/teams/${teamId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            project_id: projectId,
          }),
        });

        if (!teamResponse.ok) {
          message.warning(
            "Projekt został utworzony, ale nie udało się przypisać zespołu"
          );
        }
      }

      message.success(
        `Projekt został ${isEditing ? "zaktualizowany" : "utworzony"}`
      );
      form.resetFields();
      onClose(true);
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : `Wystąpił błąd podczas ${
              isEditing ? "aktualizacji" : "tworzenia"
            } projektu`
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEditing ? "Edytuj projekt" : "Utwórz nowy projekt"}
      open={visible}
      onCancel={handleCancel}
      footer={[
        <Button key="cancel" onClick={handleCancel}>
          Anuluj
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {isEditing ? "Aktualizuj" : "Utwórz"}
        </Button>,
      ]}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: "Active",
          payment_status: "Unpaid",
        }}
      >
        <Form.Item
          name="name"
          label="Nazwa projektu"
          rules={[{ required: true, message: "Proszę podać nazwę projektu" }]}
        >
          <Input placeholder="Wprowadź nazwę projektu" />
        </Form.Item>

        <Form.Item name="status" label="Status projektu">
          <Select>
            <Option value="Active">Aktywny</Option>
            <Option value="Archived">Zarchiwizowany</Option>
            <Option value="Closed">Zamknięty</Option>
          </Select>
        </Form.Item>

        <Form.Item name="payment_status" label="Status płatności">
          <Select>
            <Option value="Paid">Opłacony</Option>
            <Option value="Unpaid">Nieopłacony</Option>
          </Select>
        </Form.Item>

        <Form.Item name="wireframe_link" label="Link do wireframe">
          <Input placeholder="Wprowadź link do wireframe" />
        </Form.Item>

        <Form.Item name="subscription_end" label="Data zakończenia subskrypcji">
          <DatePicker style={{ width: "100%" }} />
        </Form.Item>

        <Divider>Przypisanie zespołu</Divider>

        <Form.Item name="team_id" label="Wybierz zespół">
          <Select placeholder="Wybierz zespół do przypisania" allowClear>
            {teams.map((team) => (
              <Option key={team.id} value={team.id}>
                {team.name} ({team.members_count} członków)
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}
