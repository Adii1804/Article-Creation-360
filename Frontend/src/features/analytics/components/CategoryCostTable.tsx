import React from 'react';
import { Card, Table, Progress, Tag, Tooltip } from 'antd';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { InfoCircleOutlined } from '@ant-design/icons';
import { formatCurrency, formatNumber } from '../../../shared/utils/costCalculator';
import type { CategoryCostBreakdown } from '../../../shared/utils/costCalculator';

interface CategoryCostTableProps {
  data: CategoryCostBreakdown[];
  loading?: boolean;
}

const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];

export const CategoryCostTable: React.FC<CategoryCostTableProps> = ({ data, loading = false }) => {
  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text: string) => <strong>{text}</strong>,
      sorter: (a: CategoryCostBreakdown, b: CategoryCostBreakdown) => 
        a.category.localeCompare(b.category),
    },
    {
      title: 'Extractions',
      dataIndex: 'extractionCount',
      key: 'extractionCount',
      render: (count: number) => formatNumber(count),
      sorter: (a: CategoryCostBreakdown, b: CategoryCostBreakdown) => 
        a.extractionCount - b.extractionCount,
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      render: (cost: number) => (
        <Tag color="blue">{formatCurrency(cost, 4)}</Tag>
      ),
      sorter: (a: CategoryCostBreakdown, b: CategoryCostBreakdown) => 
        a.totalCost - b.totalCost,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: (
        <span>
          Avg Cost / Item
          <Tooltip title="Average cost per extraction for this category">
            <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12 }} />
          </Tooltip>
        </span>
      ),
      dataIndex: 'avgCostPerExtraction',
      key: 'avgCostPerExtraction',
      render: (avg: number) => formatCurrency(avg, 6),
      sorter: (a: CategoryCostBreakdown, b: CategoryCostBreakdown) => 
        a.avgCostPerExtraction - b.avgCostPerExtraction,
    },
    {
      title: 'Tokens Used',
      dataIndex: 'tokenUsage',
      key: 'tokenUsage',
      render: (tokens: number) => formatNumber(tokens),
      sorter: (a: CategoryCostBreakdown, b: CategoryCostBreakdown) => 
        a.tokenUsage - b.tokenUsage,
    },
    {
      title: '% of Total',
      dataIndex: 'percentage',
      key: 'percentage',
      render: (percentage: number) => (
        <div style={{ width: 150 }}>
          <Progress 
            percent={percentage} 
            size="small" 
            format={(percent) => `${percent?.toFixed(1)}%`}
            strokeColor={{
              '0%': '#1890ff',
              '100%': '#52c41a',
            }}
          />
        </div>
      ),
      sorter: (a: CategoryCostBreakdown, b: CategoryCostBreakdown) => 
        a.percentage - b.percentage,
    },
  ];

  // Prepare data for pie chart
  const pieData = data.map((item, index) => ({
    name: item.category,
    value: item.totalCost,
    percentage: item.percentage,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card 
      title="Cost Breakdown by Category"
      bordered={false}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Pie Chart */}
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name}: ${entry.percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip 
                formatter={(value: number) => formatCurrency(value, 4)}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="category"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
          }}
          scroll={{ x: 'max-content' }}
          summary={(pageData) => {
            const totalCost = pageData.reduce((sum, item) => sum + item.totalCost, 0);
            const totalExtractions = pageData.reduce((sum, item) => sum + item.extractionCount, 0);
            const totalTokens = pageData.reduce((sum, item) => sum + item.tokenUsage, 0);

            return (
              <Table.Summary fixed>
                <Table.Summary.Row style={{ background: '#fafafa' }}>
                  <Table.Summary.Cell index={0}>
                    <strong>Total</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong>{formatNumber(totalExtractions)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={2}>
                    <Tag color="green">
                      <strong>{formatCurrency(totalCost, 4)}</strong>
                    </Tag>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3}>
                    <strong>
                      {totalExtractions > 0 
                        ? formatCurrency(totalCost / totalExtractions, 6) 
                        : '$0.00'}
                    </strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <strong>{formatNumber(totalTokens)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={5}>
                    100%
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              </Table.Summary>
            );
          }}
        />
      </div>
    </Card>
  );
};

export default CategoryCostTable;
