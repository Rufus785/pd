"use client";

import type React from "react";

import { useState } from "react";
import { Modal, Button, Descriptions, Table, Tag } from "antd";
import { Edit, Users } from "lucide-react";
import TeamModal from "./team-modal";

interface TeamMember {
  user_id: number;
  nickname: string;
  role: string;
}

interface Team {
  id: number;
  name: string;
  project_id: number;
  project_name: string;
  project_status: string;
  members: TeamMember[];
}

interface TeamDetailsModalProps {
  visible: boolean;
  onClose: (refreshData: boolean) => void;
  team: Team | null;
}

const TeamDetailsModal: React.FC<TeamDetailsModalProps> = ({
  visible,
  onClose,
  team,
}) => {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  if (!team) {
    return null;
  }

  const handleEditClick = () => {
    setIsEditModalVisible(true);
  };

  const handleEditModalClose = (refreshData: boolean) => {
    setIsEditModalVisible(false);
    if (refreshData) {
      onClose(true);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "green";
      case "Archived":
        return "orange";
      case "Closed":
        return "red";
      default:
        return "default";
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "PM":
        return "blue";
      case "Developer":
        return "green";
      case "Designer":
        return "purple";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Użytkownik",
      dataIndex: "nickname",
      key: "nickname",
    },
    {
      title: "Rola",
      dataIndex: "role",
      key: "role",
      render: (role: string) => <Tag color={getRoleColor(role)}>{role}</Tag>,
    },
  ];

  return (
    <>
      <Modal
        title={
          <div style={{ display: "flex", alignItems: "center" }}>
            <Users style={{ marginRight: 8 }} />
            <span>Szczegóły zespołu</span>
          </div>
        }
        open={visible}
        onCancel={() => onClose(false)}
        footer={[
          <Button key="close" onClick={() => onClose(false)}>
            Zamknij
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<Edit size={16} />}
            onClick={handleEditClick}
          >
            Edytuj
          </Button>,
        ]}
        width={700}
      >
        <Descriptions bordered column={1} style={{ marginTop: 16 }}>
          <Descriptions.Item label="ID zespołu">{team.id}</Descriptions.Item>
          <Descriptions.Item label="Nazwa zespołu">
            {team.name}
          </Descriptions.Item>
          <Descriptions.Item label="Projekt">
            {team.project_name}
          </Descriptions.Item>
          <Descriptions.Item label="Status projektu">
            <Tag color={getStatusColor(team.project_status)}>
              {team.project_status}
            </Tag>
          </Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Członkowie zespołu</h3>
          <Table
            columns={columns}
            dataSource={team.members}
            rowKey="user_id"
            pagination={false}
            size="small"
          />
        </div>
      </Modal>

      <TeamModal
        visible={isEditModalVisible}
        onClose={handleEditModalClose}
        team={team}
      />
    </>
  );
};

export default TeamDetailsModal;
