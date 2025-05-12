"use client";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Typography, Spin } from "antd";
import PasswordChangeModal from "@/components/auth/PasswordChange";
import ProjectGrid from "@/components/projects/ProjectsGrid";
import TeamGrid from "@/components/teams/TeamGrid";

const { Title } = Typography;

export default function HomePage() {
  const { data: session, status } = useSession();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localPasswordChanged, setLocalPasswordChanged] = useState(false);

  useEffect(() => {
    if (session?.user?.passwordChanged === false && !localPasswordChanged) {
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [session, localPasswordChanged]);

  const handlePasswordChanged = () => {
    setLocalPasswordChanged(true);
    setIsModalOpen(false);
  };

  if (status === "loading") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "24px" }}>
      <PasswordChangeModal
        isOpen={isModalOpen}
        onPasswordChanged={handlePasswordChanged}
      />

      {status === "authenticated" && (
        <>
          <Title level={2} style={{ marginBottom: "24px" }}>
            Moje Projekty
          </Title>

          <ProjectGrid />
          <Title level={2} style={{ marginBottom: "24px" }}>
            Moje Zespoły
          </Title>
          <TeamGrid />
        </>
      )}
    </div>
  );
}
