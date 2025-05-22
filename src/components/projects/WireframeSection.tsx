"use client";
import { useState } from "react";
import {
  Card,
  Input,
  Button,
  message,
  Typography,
  Empty,
  Space,
  Alert,
} from "antd";
import { ExternalLink, Plus, Edit } from "lucide-react";

const { Title, Paragraph, Text } = Typography;

interface WireframeSectionProps {
  projectId: number;
  wireframeLink: string | null | undefined;
  isUserDesigner: boolean; // Designer, PM i Admin mogą edytować makiety
  onWireframeUpdate: (url: string) => void;
}

export default function WireframeSection({
  projectId,
  wireframeLink,
  isUserDesigner,
  onWireframeUpdate,
}: WireframeSectionProps) {
  const [editing, setEditing] = useState(false);
  const [newWireframeLink, setNewWireframeLink] = useState(wireframeLink || "");
  const [loading, setLoading] = useState(false);

  const saveWireframeLink = async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/wireframe`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ wireframeLink: newWireframeLink }),
      });

      if (!response.ok) {
        throw new Error("Failed to update wireframe link");
      }

      message.success("Link do makiety zaktualizowany pomyślnie");
      onWireframeUpdate(newWireframeLink);
      setEditing(false);
    } catch (error) {
      console.error("Error updating wireframe link:", error);
      message.error("Wystąpił błąd podczas aktualizacji linku do makiety");
    } finally {
      setLoading(false);
    }
  };

  const cancelEditing = () => {
    setNewWireframeLink(wireframeLink || "");
    setEditing(false);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
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
            Makiety projektowe
          </Title>
          {/* Tylko Designer, PM i Admin mogą edytować makiety */}
          {isUserDesigner && !editing && (
            <Button
              type="primary"
              icon={wireframeLink ? <Edit size={16} /> : <Plus size={16} />}
              onClick={() => setEditing(true)}
            >
              {wireframeLink
                ? "Edytuj link do makiety"
                : "Dodaj link do makiety"}
            </Button>
          )}
        </div>
      }
    >
      {editing ? (
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Wprowadź link do makiety (np. Figma, Sketch, itp.)"
            value={newWireframeLink}
            onChange={(e) => setNewWireframeLink(e.target.value)}
          />
          <div style={{ marginTop: 16 }}>
            <Button
              type="primary"
              onClick={saveWireframeLink}
              loading={loading}
              disabled={
                !newWireframeLink.trim() || !isValidUrl(newWireframeLink.trim())
              }
              style={{ marginRight: 8 }}
            >
              Zapisz
            </Button>
            <Button onClick={cancelEditing}>Anuluj</Button>
          </div>
          {newWireframeLink && !isValidUrl(newWireframeLink) && (
            <Alert
              message="Nieprawidłowy URL"
              description="Proszę wprowadzić poprawny adres URL (np. https://figma.com)"
              type="error"
              showIcon
            />
          )}
        </Space>
      ) : wireframeLink ? (
        <div>
          <Paragraph>
            <Text strong>Link do makiety:</Text>{" "}
            <a href={wireframeLink} target="_blank" rel="noopener noreferrer">
              {wireframeLink}{" "}
              <ExternalLink size={14} style={{ verticalAlign: "middle" }} />
            </a>
          </Paragraph>
          <iframe
            src={`https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
              wireframeLink
            )}`}
            style={{
              width: "100%",
              height: "600px",
              border: "1px solid #f0f0f0",
            }}
            allowFullScreen
          />
        </div>
      ) : (
        <Empty
          description={
            isUserDesigner
              ? "Kliknij przycisk powyżej, aby dodać link do makiety projektu"
              : "Brak makiet dla tego projektu"
          }
        />
      )}
    </Card>
  );
}
