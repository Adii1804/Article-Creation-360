/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import {
  Collapse,
  Tag,
  Space,
  Button,
  Badge,
  Tooltip,
  Typography,
  Card,
  Statistic,
} from "antd";
import {
  ExperimentOutlined,
  PlusOutlined,
  BulbOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import type { DiscoveredAttribute } from "../../../shared/types/extraction/ExtractionTypes";

const { Panel } = Collapse;
const { Text } = Typography;

interface DiscoveryPanelProps {
  discoveries: DiscoveredAttribute[];
  onPromoteToSchema: (discoveryKey: string) => void;
  onViewDetails: (discovery: DiscoveredAttribute) => void;
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  discoveries,
  onPromoteToSchema,
  onViewDetails,
}) => {
  const [activeKeys, setActiveKeys] = useState<string[]>([]);

  const highConfidence = discoveries.filter((d) => d.confidence >= 80);
  const promotable = discoveries.filter(
    (d) => d.frequency >= 3 && d.confidence >= 75
  );

  if (discoveries.length === 0) return null;

  return (
    <Card
      size="small"
      title={
        <Space>
          <ExperimentOutlined style={{ color: "#722ed1" }} />
          <Text strong>AI Discoveries</Text>
          <Badge
            count={discoveries.length}
            style={{ backgroundColor: "#722ed1" }}
            aria-label="Total discoveries found"
          />
        </Space>
      }
      extra={
        <Space>
          <Statistic
            title="High Confidence"
            value={highConfidence.length}
            suffix={`/${discoveries.length}`}
          />
          <Statistic title="Promotable" value={promotable.length} />
        </Space>
      }
      style={{ marginTop: 16 }}
      tabIndex={0}
      aria-label="AI Discoveries summary"
    >
      <Collapse
        activeKey={activeKeys}
        onChange={setActiveKeys as any}
        size="small"
        accordion
        aria-label="AI Discoveries details"
        
      >
        <Panel
          header={
            <Space>
              <BulbOutlined style={{ color: "#faad14" }} />
              <Text>New Attributes Found</Text>
              <Badge count={discoveries.length} />
            </Space>
          }
          key="discoveries"
        >
          <Space direction="vertical" style={{ width: "100%" }} size="small">
            {discoveries.map((discovery) => (
              <Card
                key={discovery.key}
                size="small"
                hoverable
                role="button"
                tabIndex={0}
                onClick={() => onViewDetails(discovery)}
                style={{ cursor: "pointer" }}
                aria-label={`Discovery: ${discovery.label}`}
              >
                <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
                  <Text strong>{discovery.label}</Text>
                  <Text code>{discovery.normalizedValue}</Text>
                  <Badge
                    count={`${discovery.confidence}%`}
                    style={{
                      backgroundColor:
                        discovery.confidence >= 80 ? "#52c41a" : "#faad14",
                    }}
                    aria-label={`Confidence ${discovery.confidence}%`}
                  />
                  {discovery.frequency > 1 && (
                    <Tag color="blue">×{discovery.frequency}</Tag>
                  )}
                </Space>

                <div
                  style={{
                    marginTop: 8,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {discovery.reasoning.substring(0, 100)}...
                  </Text>

                  {discovery.frequency >= 3 && discovery.confidence >= 75 && (
                    <Tooltip title="Add to schema for future extractions">
                      <Button
                        size="small"
                        type="text"
                        icon={<PlusOutlined />}
                        tabIndex={0}
                        aria-label={`Promote ${discovery.label} to schema`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onPromoteToSchema(discovery.key);
                        }}
                        style={{ color: "#52c41a" }}
                      />
                    </Tooltip>
                  )}
                </div>
              </Card>
            ))}
          </Space>
        </Panel>

        {promotable.length > 0 && (
          <Panel
            header={
              <Space>
                <TrophyOutlined style={{ color: "#52c41a" }} />
                <Text>Ready for Schema</Text>
                <Badge
                  count={promotable.length}
                  style={{ backgroundColor: "#52c41a" }}
                />
              </Space>
            }
            key="promotable"
          >
            <Space wrap>
              {promotable.map((discovery) => (
                <Tag
                  key={discovery.key}
                  color="green"
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  aria-label={`Promote ${discovery.label} from ready`}
                  onClick={() => onPromoteToSchema(discovery.key)}
                >
                  <PlusOutlined /> {discovery.label}
                </Tag>
              ))}
            </Space>
          </Panel>
        )}
      </Collapse>
    </Card>
  );
};
