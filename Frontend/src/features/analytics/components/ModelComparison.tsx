import React from 'react';
import { Card, Table, Tag, Tooltip, Alert } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatCurrency, formatNumber, MODEL_PRICING } from '../../../shared/utils/costCalculator';
import type { CostBreakdown } from '../../../shared/utils/costCalculator';

interface ModelComparisonProps {
  currentModel: string;
  inputTokens: number;
  outputTokens: number;
  comparison: Record<string, CostBreakdown>;
}

export const ModelComparison: React.FC<ModelComparisonProps> = ({
  currentModel,
  inputTokens,
  outputTokens,
  comparison,
}) => {
  const columns = [
    {
      title: 'Model',
      dataIndex: 'model',
      key: 'model',
      render: (model: string, record: any) => (
        <span>
          <strong>{MODEL_PRICING[record.key]?.name || model}</strong>
          {record.key === currentModel && (
            <Tag color="green" style={{ marginLeft: 8 }}>
              <CheckCircleOutlined /> Current
            </Tag>
          )}
        </span>
      ),
    },
    {
      title: (
        <span>
          Input Cost
          <Tooltip title={`Based on ${formatNumber(inputTokens)} input tokens`}>
            <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'inputCost',
      key: 'inputCost',
      render: (cost: number) => formatCurrency(cost, 6),
    },
    {
      title: (
        <span>
          Output Cost
          <Tooltip title={`Based on ${formatNumber(outputTokens)} output tokens`}>
            <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'outputCost',
      key: 'outputCost',
      render: (cost: number) => formatCurrency(cost, 6),
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number, record: any) => {
        const currentCost = comparison[currentModel]?.totalCost || 0;
        const savings = currentCost - cost;
        const savingsPercent = currentCost > 0 ? ((savings / currentCost) * 100) : 0;

        return (
          <div>
            <Tag color={record.key === currentModel ? 'green' : 'blue'}>
              {formatCurrency(cost, 6)}
            </Tag>
            {record.key !== currentModel && savings > 0 && (
              <div style={{ fontSize: 12, color: '#52c41a', marginTop: 4 }}>
                Save {formatCurrency(savings, 6)} ({savingsPercent.toFixed(1)}%)
              </div>
            )}
            {record.key !== currentModel && savings < 0 && (
              <div style={{ fontSize: 12, color: '#ff4d4f', marginTop: 4 }}>
                +{formatCurrency(Math.abs(savings), 6)} ({Math.abs(savingsPercent).toFixed(1)}%)
              </div>
            )}
          </div>
        );
      },
      sorter: (a: any, b: any) => a.totalCost - b.totalCost,
      defaultSortOrder: 'ascend' as const,
    },
    {
      title: 'Price per 1K Tokens',
      key: 'pricing',
      render: (_: any, record: any) => {
        const pricing = MODEL_PRICING[record.key];
        return (
          <div style={{ fontSize: 12 }}>
            <div>Input: {formatCurrency(pricing.inputCostPer1k, 4)}</div>
            <div>Output: {formatCurrency(pricing.outputCostPer1k, 4)}</div>
          </div>
        );
      },
    },
  ];

  const dataSource = Object.entries(comparison).map(([key, breakdown]) => ({
    key,
    model: breakdown.model,
    inputCost: breakdown.inputCost,
    outputCost: breakdown.outputCost,
    totalCost: breakdown.totalCost,
  }));

  // Find cheapest model
  const cheapestModel = dataSource.reduce((min, item) => 
    item.totalCost < min.totalCost ? item : min
  , dataSource[0]);

  const currentCost = comparison[currentModel]?.totalCost || 0;
  const potentialSavings = currentCost - cheapestModel.totalCost;
  const savingsPercent = currentCost > 0 ? (potentialSavings / currentCost) * 100 : 0;

  return (
    <Card
      title="Model Cost Comparison"
      bordered={false}
    >
      {currentModel !== cheapestModel.key && potentialSavings > 0 && (
        <Alert
          message="Potential Cost Savings"
          description={
            <span>
              Switch to <strong>{MODEL_PRICING[cheapestModel.key]?.name}</strong> to save{' '}
              <strong>{formatCurrency(potentialSavings, 6)}</strong> ({savingsPercent.toFixed(1)}%) 
              per extraction with similar performance.
            </span>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowKey="key"
        scroll={{ x: 'max-content' }}
      />

      <div style={{ marginTop: 16, fontSize: 12, color: '#8c8c8c' }}>
        <InfoCircleOutlined style={{ marginRight: 4 }} />
        Costs calculated based on {formatNumber(inputTokens)} input tokens and{' '}
        {formatNumber(outputTokens)} output tokens per extraction.
      </div>
    </Card>
  );
};

export default ModelComparison;
