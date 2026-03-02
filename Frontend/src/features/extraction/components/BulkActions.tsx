
import React, { useState, useCallback, useMemo } from "react";
import { Card, Select, Button, Space, Input, Typography, Tag } from "antd";
import { EditOutlined, ClearOutlined } from "@ant-design/icons";
import type { SchemaItem } from "../../../shared/types/extraction/ExtractionTypes";

const { Option } = Select;
const { Text } = Typography;

interface BulkActionsProps {
  selectedRowKeys: React.Key[];
  selectedRowCount: number;
  onBulkEdit: (attributeKey: string, value: string | number | null) => void;
  schema: SchemaItem[];
  onClearSelection: () => void;
}

export const BulkActions: React.FC<BulkActionsProps> = React.memo(({
  selectedRowKeys,
  selectedRowCount,
  onBulkEdit,
  schema
}) => {
  const [selectedAttribute, setSelectedAttribute] = useState<string>("");
  const [bulkValue, setBulkValue] = useState<string | number | null>("");

  const selectedSchemaItem = useMemo(
    () => schema.find((item) => item.key === selectedAttribute),
    [schema, selectedAttribute]
  );

  const canEdit = useMemo(
    () => selectedAttribute && selectedRowKeys.length > 0,
    [selectedAttribute, selectedRowKeys]
  );

  const handleBulkEdit = useCallback(() => {
    if (!canEdit) return;
    onBulkEdit(selectedAttribute, bulkValue);
    setBulkValue("");
  }, [canEdit, onBulkEdit, selectedAttribute, bulkValue]);

  const handleClear = useCallback(() => {
    if (!canEdit) return;
    onBulkEdit(selectedAttribute, null);
  }, [canEdit, onBulkEdit, selectedAttribute]);

  if (selectedRowKeys.length === 0) {
    return null;
  }

  const renderValueInput = () => {
    if (!selectedSchemaItem) return null;

    if (selectedSchemaItem.type === "select") {
      return (
        <Select
          value={bulkValue}
          onChange={setBulkValue}
          placeholder="Select value"
          style={{ width: 200 }}
          allowClear
          aria-label="Select value for bulk edit"
        >
          {selectedSchemaItem.allowedValues?.map((value) => (
            <Option key={value.shortForm} value={value.shortForm}>
              {value.fullForm || value.shortForm}
            </Option>
          ))}
        </Select>
      );
    }

    if (selectedSchemaItem.type === "number") {
      return (
        <Input
          type="number"
          value={bulkValue as number}
          onChange={(e) => setBulkValue(Number(e.target.value))}
          placeholder="Enter number"
          style={{ width: 200 }}
          aria-label="Enter number for bulk edit"
        />
      );
    }

    return (
      <Input
        value={bulkValue as string}
        onChange={(e) => setBulkValue(e.target.value)}
        placeholder="Enter value"
        style={{ width: 200 }}
        aria-label="Enter value for bulk edit"
      />
    );
  };

  return (
    <Card
      size="small"
      style={{ marginBottom: 16, backgroundColor: "#f6ffed" }}
      aria-label="Bulk actions card"
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <div>
          <Text strong>
            Bulk Edit:
          </Text>
          <Tag color="blue" style={{ marginLeft: 8 }}>
            {selectedRowCount} rows selected
          </Tag>
        </div>

        <Select
          placeholder="Select attribute"
          value={selectedAttribute}
          onChange={setSelectedAttribute}
          style={{ width: 200 }}
          showSearch
          filterOption={(input, option) =>
            option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
          }
          aria-label="Select attribute for bulk edit"
        >
          {schema.map((item) => (
            <Option key={item.key} value={item.key}>
              {item.label}
            </Option>
          ))}
        </Select>

        {selectedAttribute && (
          <>
            {renderValueInput()}

            <Space>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleBulkEdit}
                disabled={!bulkValue && bulkValue !== 0}
                aria-label={`Apply to ${selectedRowCount} rows`}
              >
                Apply to {selectedRowCount} rows
              </Button>

              <Button
                icon={<ClearOutlined />}
                onClick={handleClear}
                aria-label="Clear values"
              >
                Clear Values
              </Button>
            </Space>
          </>
        )}
      </div>
    </Card>
  );
});
