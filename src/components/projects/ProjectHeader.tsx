"use client";
import { useState } from "react";
import {
  Typography,
  Row,
  Col,
  Card,
  Tag,
  Button,
  Modal,
  message,
  Select,
} from "antd";
import { Calendar, Edit, CreditCard } from "lucide-react";
import type { Project } from "@/app/types/projectTypes";

const { Title } = Typography;
const { Option } = Select;

interface ProjectHeaderProps {
  project: Project;
  isUserPM: boolean;
  onStatusChange: (newStatus: string) => void;
}

export default function ProjectHeader({
  project,
  isUserPM,
  onStatusChange,
}: ProjectHeaderProps) {
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(project.status);
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(
    project.payment_status
  );
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Archived":
        return "blue";
      case "Closed":
        return "red";
      default:
        return "default";
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "green";
      case "Unpaid":
        return "red";
      default:
        return "default";
    }
  };

  const handleStatusChange = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update project status");
      }

      message.success(`Status projektu zmieniony na ${selectedStatus}`);
      onStatusChange(selectedStatus);
      setStatusModalVisible(false);
    } catch (error) {
      console.error("Error updating project status:", error);
      message.error("Wystąpił błąd podczas aktualizacji statusu projektu");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusChange = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${project.id}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentStatus: selectedPaymentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update payment status");
      }

      message.success(`Status płatności zmieniony na ${selectedPaymentStatus}`);
      project.payment_status = selectedPaymentStatus as any;
      setPaymentModalVisible(false);
    } catch (error) {
      console.error("Error updating payment status:", error);
      message.error("Wystąpił błąd podczas aktualizacji statusu płatności");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Nie określono";

    return new Date(dateString).toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      <Card className="project-header">
        <Row gutter={[24, 24]}>
          <Col xs={24} md={16}>
            <Title level={2} style={{ margin: 0 }}>
              {project.name}
            </Title>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <Tag
                color={getStatusColor(project.status)}
                style={{ fontSize: 14, padding: "4px 8px" }}
              >
                Status: {project.status}
              </Tag>

              <Tag
                color={getPaymentStatusColor(project.payment_status)}
                style={{ fontSize: 14, padding: "4px 8px" }}
              >
                Płatność: {project.payment_status}
              </Tag>

              {project.subscription_end && (
                <Tag
                  icon={<Calendar size={14} />}
                  style={{ fontSize: 14, padding: "4px 8px" }}
                >
                  Koniec subskrypcji: {formatDate(project.subscription_end)}
                </Tag>
              )}
            </div>
          </Col>

          {isUserPM && (
            <Col
              xs={24}
              md={8}
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "flex-start",
              }}
            >
              <Button
                type="primary"
                icon={<Edit size={16} />}
                onClick={() => setStatusModalVisible(true)}
                style={{ marginRight: 8 }}
              >
                Zmień status
              </Button>

              <Button
                icon={<CreditCard size={16} />}
                onClick={() => setPaymentModalVisible(true)}
              >
                Status płatności
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      <Modal
        title="Zmień status projektu"
        open={statusModalVisible}
        onCancel={() => setStatusModalVisible(false)}
        onOk={handleStatusChange}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <p>
            Aktualny status:{" "}
            <Tag color={getStatusColor(project.status)}>{project.status}</Tag>
          </p>
          <p>Wybierz nowy status projektu:</p>
          <Select
            style={{ width: "100%" }}
            value={selectedStatus}
            onChange={setSelectedStatus}
          >
            <Option value="Active">Active</Option>
            <Option value="Archived">Archived</Option>
            <Option value="Closed">Closed</Option>
          </Select>
        </div>
      </Modal>

      <Modal
        title="Zmień status płatności"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        onOk={handlePaymentStatusChange}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: 16 }}>
          <p>
            Aktualny status płatności:{" "}
            <Tag color={getPaymentStatusColor(project.payment_status)}>
              {project.payment_status}
            </Tag>
          </p>
          <p>Wybierz nowy status płatności:</p>
          <Select
            style={{ width: "100%" }}
            value={selectedPaymentStatus}
            onChange={setSelectedPaymentStatus}
          >
            <Option value="Paid">Paid</Option>
            <Option value="Unpaid">Unpaid</Option>
          </Select>
        </div>
      </Modal>
    </>
  );
}
