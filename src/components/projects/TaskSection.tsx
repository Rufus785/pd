"use client";
import { useEffect, useState } from "react";
import {
  Card,
  Table,
  Tag,
  Button,
  Form,
  Input,
  Select,
  message,
  Typography,
  Space,
  Popconfirm,
  Modal,
} from "antd";
import { Plus, Edit, Trash2 } from "lucide-react";
import type { Task, User } from "@/app/types/projectTypes";
import { useRouter } from "next/navigation";

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
  onTasksReplace?: (tasks: Task[]) => void;
}

export default function TaskSection({
  tasks,
  users,
  projectId,
  isUserPM,
  onTaskUpdate,
  onTaskCreate,
  onTasksReplace,
}: TaskSectionProps) {
  const router = useRouter();
  const [form] = Form.useForm();
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const [list, setList] = useState<Task[]>(tasks);
  useEffect(() => {
    setList(tasks);
  }, [tasks]);

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

  const fetchTasks = async (): Promise<Task[]> => {
    const res = await fetch(`/api/projects/${projectId}/tasks`, {
      method: "GET",
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch tasks");
    }
    return res.json();
  };

  const deleteTask = async (taskId: number) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) {
        const text = await res.text();
        try {
          throw new Error(JSON.parse(text)?.error || "Failed to delete task");
        } catch {
          throw new Error(text || "Failed to delete task");
        }
      }

      const fresh = await fetchTasks();
      setList(fresh);
      onTasksReplace?.(fresh);

      message.success("Zadanie usunięte pomyślnie");
    } catch (e: any) {
      console.error("Error deleting task:", e);
      message.error(`Błąd usuwania: ${e?.message || e}`);
    }
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
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error("Failed to update task");
        const updatedTask: Task = await response.json();

        setList((prev) =>
          prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
        );
        onTaskUpdate(updatedTask);

        message.success("Zadanie zaktualizowane pomyślnie");
      } else {
        const response = await fetch(`/api/projects/${projectId}/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error("Failed to create task");
        const newTask: Task = await response.json();

        setList((prev) => [newTask, ...prev]);
        onTaskCreate(newTask);

        message.success("Zadanie utworzone pomyślnie");
      }

      setTaskModalVisible(false);
    } catch (error) {
      console.error("Error saving task:", error);
      message.error("Wystąpił błąd podczas zapisywania zadania");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update task status");
      const updatedTask: Task = await response.json();

      setList((prev) =>
        prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
      onTaskUpdate(updatedTask);

      message.success(`Status zadania zmieniony na ${newStatus}`);
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
          style={{ width: 140 }}
          onChange={(value) => handleStatusChange(record.id, value)}
          disabled={!isUserPM}
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
                onClick={(e) => {
                  e.stopPropagation();
                  showEditTaskModal(record);
                }}
              />
              <Popconfirm
                title="Potwierdź usunięcie"
                description="Czy na pewno chcesz usunąć to zadanie?"
                okText="Usuń"
                cancelText="Anuluj"
                onConfirm={() => deleteTask(record.id)}
              >
                <Button
                  icon={<Trash2 size={16} />}
                  size="small"
                  danger
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
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
        {list.length > 0 ? (
          <Table
            dataSource={list}
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
