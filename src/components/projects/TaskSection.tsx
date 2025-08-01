"use client";
import { useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Typography,
  Space,
} from "antd";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Task, User } from "@/app/types/projectTypes";

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface TaskSectionProps {
  tasks: Task[];
  users: User[];
  projectId: number;
  isUserPM: boolean;
  onTaskUpdate: (task: Task) => void;
  onTaskCreate: (task: Task) => void;
}

export default function TaskSection({
  tasks,
  users,
  projectId,
  isUserPM,
  onTaskUpdate,
  onTaskCreate,
}: TaskSectionProps) {
  const [form] = Form.useForm();
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "red";
      case "Medium":
        return "orange";
      case "Low":
        return "green";
      default:
        return "blue";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ToDo":
        return "default";
      case "InProgress":
        return "blue";
      case "CodeReview":
        return "purple";
      case "Deprecated":
        return "red";
      case "Done":
        return "green";
      default:
        return "default";
    }
  };

  const showAddTaskModal = () => {
    setEditingTask(null);
    form.resetFields();
    setTaskModalVisible(true);
  };

  const showEditTaskModal = (task: Task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      userId: task.user_id,
    });
    setTaskModalVisible(true);
  };

  const handleTaskSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const taskData = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        status: values.status,
        user_id: values.userId,
        project_id: projectId,
      };

      if (editingTask) {
        const response = await fetch(`/api/tasks/${editingTask.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error("Failed to update task");
        }

        const updatedTask = await response.json();
        message.success("Zadanie zaktualizowane pomyślnie");
        onTaskUpdate(updatedTask);
      } else {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(taskData),
        });

        if (!response.ok) {
          throw new Error("Failed to create task");
        }

        const newTask = await response.json();
        message.success("Zadanie utworzone pomyślnie");
        onTaskCreate(newTask);
      }

      setTaskModalVisible(false);
    } catch (error) {
      console.error("Error saving task:", error);
      message.error("Wystąpił błąd podczas zapisywania zadania");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    Modal.confirm({
      title: "Potwierdź usunięcie",
      content: "Czy na pewno chcesz usunąć to zadanie?",
      onOk: async () => {
        try {
          const response = await fetch(`/api/tasks/${taskId}`, {
            method: "DELETE",
          });

          if (!response.ok) {
            throw new Error("Failed to delete task");
          }

          message.success("Zadanie usunięte pomyślnie");
          const updatedTasks = tasks.filter((task) => task.id !== taskId);
          onTaskUpdate({
            ...tasks.find((task) => task.id === taskId)!,
            id: -1,
          });
        } catch (error) {
          console.error("Error deleting task:", error);
          message.error("Wystąpił błąd podczas usuwania zadania");
        }
      },
    });
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task status");
      }

      const updatedTask = await response.json();
      message.success(`Status zadania zmieniony na ${newStatus}`);
      onTaskUpdate(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      message.error("Wystąpił błąd podczas aktualizacji statusu zadania");
    }
  };

  const columns = [
    {
      title: "Tytuł",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: Task) => (
        <Button type="link" onClick={() => setViewingTask(record)}>
          {text}
        </Button>
      ),
    },
    {
      title: "Priorytet",
      dataIndex: "priority",
      key: "priority",
      render: (priority: string) => (
        <Tag color={getPriorityColor(priority)}>{priority}</Tag>
      ),
      filters: [
        { text: "High", value: "High" },
        { text: "Medium", value: "Medium" },
        { text: "Low", value: "Low" },
      ],
      onFilter: (value: any, record: Task) => record.priority === String(value),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string, record: Task) => (
        <Select
          value={status}
          style={{ width: 120 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          disabled={false}
        >
          <Option value="ToDo">
            <Tag color={getStatusColor("ToDo")}>ToDo</Tag>
          </Option>
          <Option value="InProgress">
            <Tag color={getStatusColor("InProgress")}>InProgress</Tag>
          </Option>
          <Option value="CodeReview">
            <Tag color={getStatusColor("CodeReview")}>CodeReview</Tag>
          </Option>
          <Option value="Deprecated">
            <Tag color={getStatusColor("Deprecated")}>Deprecated</Tag>
          </Option>
          <Option value="Done">
            <Tag color={getStatusColor("Done")}>Done</Tag>
          </Option>
        </Select>
      ),
      filters: [
        { text: "ToDo", value: "ToDo" },
        { text: "InProgress", value: "InProgress" },
        { text: "CodeReview", value: "CodeReview" },
        { text: "Deprecated", value: "Deprecated" },
        { text: "Done", value: "Done" },
      ],
      onFilter: (value: any, record: Task) => record.status === String(value),
    },
    {
      title: "Przypisany do",
      dataIndex: "user_id",
      key: "user_id",
      render: (userId: number) => {
        const user = users.find((u) => u.id === userId);
        return user ? user.nickname : "Nieznany użytkownik";
      },
    },
    {
      title: "Akcje",
      key: "actions",
      render: (_: any, record: Task) => (
        <Space>
          {isUserPM && (
            <>
              <Button
                icon={<Edit size={16} />}
                size="small"
                onClick={() => showEditTaskModal(record)}
              />
              <Button
                icon={<Trash2 size={16} />}
                size="small"
                danger
                onClick={() => handleDeleteTask(record.id)}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              Zadania projektu
            </Title>
            {isUserPM && (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={showAddTaskModal}
              >
                Dodaj zadanie
              </Button>
            )}
          </div>
        }
      >
        {tasks.length > 0 ? (
          <Table
            dataSource={tasks}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
          />
        ) : (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <Text type="secondary">Brak zadań dla tego projektu</Text>
          </div>
        )}
      </Card>

      <Modal
        title={editingTask ? "Edytuj zadanie" : "Dodaj nowe zadanie"}
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        onOk={handleTaskSubmit}
        confirmLoading={loading}
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="Tytuł zadania"
            rules={[{ required: true, message: "Proszę podać tytuł zadania" }]}
          >
            <Input placeholder="Tytuł zadania" />
          </Form.Item>

          <Form.Item name="description" label="Opis">
            <TextArea rows={4} placeholder="Opis zadania" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="Priorytet"
            rules={[{ required: true, message: "Proszę wybrać priorytet" }]}
          >
            <Select placeholder="Wybierz priorytet">
              <Option value="High">High</Option>
              <Option value="Medium">Medium</Option>
              <Option value="Low">Low</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Proszę wybrać status" }]}
            initialValue="ToDo"
          >
            <Select placeholder="Wybierz status">
              <Option value="ToDo">ToDo</Option>
              <Option value="InProgress">InProgress</Option>
              <Option value="CodeReview">CodeReview</Option>
              <Option value="Deprecated">Deprecated</Option>
              <Option value="Done">Done</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="userId"
            label="Przypisz do"
            rules={[{ required: true, message: "Proszę wybrać użytkownika" }]}
          >
            <Select placeholder="Wybierz użytkownika">
              {users.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.nickname}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Szczegóły zadania"
        open={!!viewingTask}
        onCancel={() => setViewingTask(null)}
        footer={null}
        width={600}
      >
        <Title level={5}>{viewingTask?.title}</Title>
        <p>
          <strong>Opis:</strong>
        </p>
        <Text>{viewingTask?.description || "Brak opisu"}</Text>

        <p style={{ marginTop: 16 }}>
          <strong>Status:</strong>{" "}
          <Tag color={getStatusColor(viewingTask?.status || "")}>
            {viewingTask?.status}
          </Tag>
        </p>

        <p>
          <strong>Priorytet:</strong>{" "}
          <Tag color={getPriorityColor(viewingTask?.priority || "")}>
            {viewingTask?.priority}
          </Tag>
        </p>

        <p>
          <strong>Przypisany do:</strong>{" "}
          {users.find((u) => u.id === viewingTask?.user_id)?.nickname ||
            "Nieznany użytkownik"}
        </p>
      </Modal>
    </>
  );
}
