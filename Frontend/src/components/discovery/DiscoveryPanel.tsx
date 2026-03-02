import React, { useState, useCallback, memo } from "react";
import {
  Collapse,
  Tag,
  Space,
  Button,
  Badge,
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
import type { DiscoveredAttribute } from "../../types/extraction/ExtractionTypes";

const { Text } = Typography;

interface DiscoveryPanelProps {
  discoveries: DiscoveredAttribute[];
  onPromoteToSchema: (discoveryKey: string) => void;
  onViewDetails: (discovery: DiscoveredAttribute) => void;
}

const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  discoveries,
  onPromoteToSchema,
  onViewDetails,
}) => {
  const onCollapseChange = useCallback((keys: string | string[]) => {
    setActiveKeys(Array.isArray(keys) ? keys : [keys]);
  }, []);
  const handlePromoteClick = useCallback(
    (e: React.MouseEvent, key: string) => {
      e.stopPropagation();
      onPromoteToSchema(key);
    },
    [onPromoteToSchema]
  );
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const highConfidence = discoveries.filter((d) => d.confidence >= 80);
  const promotable = discoveries.filter(
    (d) => d.frequency >= 3 && d.confidence >= 75
  );

  if (discoveries.length === 0) return null;

  const collapseItems = [
    {
      key: "discoveries",
      label: (
        <Space>
          <BulbOutlined style={{ color: "#faad14" }} />
          <Text>New Attributes Found</Text>
          <Badge
            count={discoveries.length}
            style={{ backgroundColor: "#722ed1" }}
          />
        </Space>
      ),
      children: (
        <Space direction="vertical" style={{ width: "100%" }} size="small">
          {discoveries.map((discovery) => (
            <div
              key={discovery.key}
              onClick={() => onViewDetails(discovery)}
              style={{
                cursor: "pointer",
                padding: "8px 12px",
                border: "1px solid #f0f0f0",
                borderRadius: "6px",
                backgroundColor: "#fafafa",
                transition: "all 0.2s",
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onViewDetails(discovery);
                }
              }}
              aria-label={`View details of ${discovery.label}`}
            >
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space split={<span style={{ color: "#d9d9d9" }}>|</span>}>
                  <Text strong style={{ color: "#722ed1" }}>
                    {discovery.label}
                  </Text>
                  <Text code style={{ fontSize: 12 }}>
                    {discovery.normalizedValue}
                  </Text>
                  <Badge
                    count={discovery.confidence}
                    style={{
                      backgroundColor:
                        discovery.confidence >= 80 ? "#52c41a" : "#faad14",
                    }}
                  />
                  {discovery.frequency > 1 && (
                    <Tag color="blue">×{discovery.frequency}</Tag>
                  )}
                </Space>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  {discovery.reasoning.substring(0, 100)}...
                </Text>
                {discovery.frequency >= 3 && discovery.confidence >= 75 && (
                  <Button
                    size="small"
                    type="text"
                    icon={<PlusOutlined />}
                    onClick={(e) => handlePromoteClick(e, discovery.key)}
                    style={{ color: "#52c41a" }}
                    aria-label={`Add ${discovery.label} to schema`}
                  >
                    Add to Schema
                  </Button>
                )}
              </Space>
            </div>
          ))}
        </Space>
      ),
    },
  ];

  if (promotable.length > 0) {
    collapseItems.push({
      key: "promotable",
      label: (
        <Space>
          <TrophyOutlined style={{ color: "#52c41a" }} />
          <Text>Ready for Schema</Text>
          <Badge
            count={promotable.length}
            style={{ backgroundColor: "#52c41a" }}
          />
        </Space>
      ),
      children: (
        <Space wrap size="small">
          {promotable.map((discovery) => (
            <Button
              key={discovery.key}
              size="small"
              type="primary"
              onClick={() => onPromoteToSchema(discovery.key)}
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              aria-label={`Promote ${discovery.label} to schema`}
            >
              <PlusOutlined /> {discovery.label}
            </Button>
          ))}
        </Space>
      ),
    });
  }

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
          />
        </Space>
      }
      extra={
        <Space>
          <Statistic
            title="High Confidence"
            value={highConfidence.length}
            valueStyle={{ fontSize: 14, color: "#52c41a" }}
          />
        </Space>
      }
      styles={{ body: { padding: 16 } }}
      style={{ marginTop: 16 }}
    >
      <Collapse
        items={collapseItems}
        activeKey={activeKeys}
        onChange={onCollapseChange}
        size="small"
        ghost
      />
    </Card>
  );
};

export default memo(DiscoveryPanel);
