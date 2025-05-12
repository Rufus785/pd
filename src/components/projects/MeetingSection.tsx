"use client";
import { useState } from "react";
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  message,
  Typography,
  List,
  Avatar,
  Empty,
} from "antd";
import { Plus, Calendar } from "lucide-react";
import type { Meeting } from "@/app/types/projectTypes";

const { Title, Text } = Typography;
const { TextArea } = Input;

interface MeetingSectionProps {
  meetings: Meeting[];
  projectId: number;
  isUserPM: boolean;
  onMeetingCreate: (meeting: Meeting) => void;
}

export default function MeetingSection({
  meetings,
  projectId,
  isUserPM,
  onMeetingCreate,
}: MeetingSectionProps) {
  const [form] = Form.useForm();
  const [meetingModalVisible, setMeetingModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const showAddMeetingModal = () => {
    form.resetFields();
    setMeetingModalVisible(true);
  };

  const handleMeetingSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const meetingData = {
        project_id: projectId,
        meeting_date: values.meeting_date.toISOString(),
        description: values.description,
      };

      const response = await fetch(`/api/projects/${projectId}/meetings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(meetingData),
      });

      if (!response.ok) {
        throw new Error("Failed to create meeting");
      }

      const newMeeting = await response.json();
      message.success("Spotkanie utworzone pomyślnie");
      onMeetingCreate(newMeeting);
      setMeetingModalVisible(false);
    } catch (error) {
      console.error("Error creating meeting:", error);
      message.error("Wystąpił błąd podczas tworzenia spotkania");
    } finally {
      setLoading(false);
    }
  };

  const sortedMeetings = [...meetings].sort((a, b) => {
    return (
      new Date(b.meeting_date).getTime() - new Date(a.meeting_date).getTime()
    );
  });

  const upcomingMeetings = sortedMeetings.filter(
    (meeting) => new Date(meeting.meeting_date) >= new Date()
  );

  const pastMeetings = sortedMeetings.filter(
    (meeting) => new Date(meeting.meeting_date) < new Date()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pl-PL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMeetingList = (meetingsList: Meeting[], title: string) => (
    <div style={{ marginBottom: 24 }}>
      <Title level={5}>{title}</Title>
      {meetingsList.length > 0 ? (
        <List
          itemLayout="horizontal"
          dataSource={meetingsList}
          renderItem={(meeting) => (
            <List.Item>
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<Calendar />}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                }
                title={formatDate(meeting.meeting_date)}
                description={meeting.description || "Brak opisu"}
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description={`Brak ${title.toLowerCase()}`} />
      )}
    </div>
  );

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
              Spotkania projektowe
            </Title>
            {isUserPM && (
              <Button
                type="primary"
                icon={<Plus size={16} />}
                onClick={showAddMeetingModal}
              >
                Zaplanuj spotkanie
              </Button>
            )}
          </div>
        }
      >
        {meetings.length > 0 ? (
          <div>
            {renderMeetingList(upcomingMeetings, "Nadchodzące spotkania")}
            {renderMeetingList(pastMeetings, "Poprzednie spotkania")}
          </div>
        ) : (
          <Empty description="Brak zaplanowanych spotkań dla tego projektu" />
        )}
      </Card>

      <Modal
        title="Zaplanuj nowe spotkanie"
        open={meetingModalVisible}
        onCancel={() => setMeetingModalVisible(false)}
        onOk={handleMeetingSubmit}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="meeting_date"
            label="Data i godzina spotkania"
            rules={[
              {
                required: true,
                message: "Proszę wybrać datę i godzinę spotkania",
              },
            ]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: "100%" }}
              placeholder="Wybierz datę i godzinę"
            />
          </Form.Item>

          <Form.Item name="description" label="Opis spotkania">
            <TextArea rows={4} placeholder="Opis spotkania (opcjonalnie)" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
