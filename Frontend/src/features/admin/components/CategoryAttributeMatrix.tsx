/**
 * Category-Attribute Matrix Viewer
 * Shows which attributes are enabled/disabled for each category in a table format
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Input,
  Space,
  Tag,
  Typography,
  Skeleton,
  Empty,
  Switch,
  Tooltip,
  Select,
  Badge,
  message,
  Spin,
} from 'antd';
import { 
  TagsOutlined, 
  SearchOutlined, 
  FilterOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { 
  getHierarchyTree,
  updateCategoryAttributeMapping,
  getCategoryWithAllAttributes,
} from '../../../services/adminApi';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface AttributeMapping {
  attributeId: number;
  attributeKey: string;
  attributeLabel: string;
  isEnabled: boolean;
  isRequired: boolean;
  displayOrder: number;
}

interface CategoryWithAttributes {
  id: number;
  code: string;
  name: string;
  department: string;
  subDepartment: string;
  attributesCount: number;
  enabledCount: number;
  attributes: AttributeMapping[];
}

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export const CategoryAttributeMatrix = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);

  // Fetch hierarchy tree with all attributes
  const { data: hierarchyData, isLoading } = useQuery({
    queryKey: ['hierarchy-tree-full'],
    queryFn: getHierarchyTree,
  });

  // Mutation for updating mappings
  const updateMappingMutation = useMutation({
    mutationFn: ({ 
      categoryId, 
      attributeId, 
      data 
    }: { 
      categoryId: number; 
      attributeId: number; 
      data: { isEnabled?: boolean; isRequired?: boolean; displayOrder?: number; defaultValue?: string | null };
    }) => updateCategoryAttributeMapping(categoryId, attributeId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree-full'] });
      queryClient.invalidateQueries({ queryKey: ['category-all-attributes', variables.categoryId] });
      message.success('Mapping updated successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  // Transform hierarchy data into flat category list with attributes
  const processedData: CategoryWithAttributes[] = hierarchyData?.flatMap((dept) =>
    dept.subDepartments?.flatMap((subDept) =>
      subDept.categories?.map((cat) => {
        const attributes: AttributeMapping[] = cat.attributes?.map((attr) => ({
          attributeId: attr.attributeId,
          attributeKey: attr.attribute?.key || '',
          attributeLabel: attr.attribute?.label || '',
          isEnabled: attr.isEnabled || false,
          isRequired: attr.isRequired || false,
          displayOrder: attr.displayOrder || 0,
        })) || [];

        const enabledCount = attributes.filter(a => a.isEnabled).length;

        return {
          id: cat.id,
          code: cat.code,
          name: cat.name,
          department: dept.name,
          subDepartment: subDept.name,
          attributesCount: attributes.length,
          enabledCount,
          attributes: attributes.sort((a, b) => a.displayOrder - b.displayOrder),
        };
      }) || []
    ) || []
  ) || [];

  // Filter data
  const filteredData = processedData.filter((item) => {
    const matchesSearch = 
      item.code.toLowerCase().includes(searchText.toLowerCase()) ||
      item.name.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesDepartment = 
      departmentFilter === 'all' || item.department === departmentFilter;

    return matchesSearch && matchesDepartment;
  });

  const mainColumns: ColumnsType<CategoryWithAttributes> = [
    {
      title: 'Category Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      fixed: 'left',
      render: (code: string) => (
        <Tag color="blue" style={{ fontFamily: 'monospace' }}>
          {code}
        </Tag>
      ),
    },
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      fixed: 'left',
      render: (name: string) => (
        <Space>
          <TagsOutlined style={{ color: '#52c41a' }} />
          <strong>{name}</strong>
        </Space>
      ),
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      width: 120,
      render: (dept: string) => <Tag color="purple">{dept}</Tag>,
    },
    {
      title: 'Sub-Department',
      dataIndex: 'subDepartment',
      key: 'subDepartment',
      width: 150,
      render: (subDept: string) => <Tag color="cyan">{subDept}</Tag>,
    },
    {
      title: 'Attributes',
      key: 'attributesStats',
      width: 150,
      align: 'center',
      render: (_: unknown, record: CategoryWithAttributes) => (
        <Space direction="vertical" size={0}>
          <Badge 
            count={record.enabledCount} 
            style={{ backgroundColor: '#52c41a' }}
            showZero
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            of {record.attributesCount}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Enabled %',
      key: 'enabledPercentage',
      width: 120,
      align: 'center',
      render: (_: unknown, record: CategoryWithAttributes) => {
        const percentage = record.attributesCount > 0 
          ? Math.round((record.enabledCount / record.attributesCount) * 100)
          : 0;
        
        let color = '#52c41a';
        if (percentage < 30) color = '#f5222d';
        else if (percentage < 60) color = '#faad14';

        return (
          <Tag color={color} style={{ minWidth: 60 }}>
            {percentage}%
          </Tag>
        );
      },
    },
  ];

  // Component for expanded row - fetches ALL 44 attributes
  const ExpandedRow = ({ categoryId }: { categoryId: number }) => {
    const { data: fullCategoryData, isLoading } = useQuery({
      queryKey: ['category-all-attributes', categoryId],
      queryFn: () => getCategoryWithAllAttributes(categoryId),
    });

    if (isLoading) {
      return (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Spin tip="Loading all attributes..." />
        </div>
      );
    }

    const allAttributes = fullCategoryData?.allAttributes || [];

    const attributeColumns: ColumnsType<typeof allAttributes[0]> = [
      {
        title: '#',
        key: 'order',
        width: 60,
        align: 'center',
        render: (_: unknown, _record: unknown, index: number) => (
          <Text type="secondary">{index + 1}</Text>
        ),
      },
      {
        title: 'Attribute Key',
        dataIndex: 'attributeKey',
        key: 'attributeKey',
        width: 200,
        render: (key: string) => (
          <Tag color="geekblue" style={{ fontFamily: 'monospace' }}>
            {key}
          </Tag>
        ),
      },
      {
        title: 'Attribute Label',
        dataIndex: 'attributeLabel',
        key: 'attributeLabel',
        width: 250,
      },
      {
        title: 'Enabled',
        key: 'isEnabled',
        width: 100,
        align: 'center',
        render: (_: unknown, attr: typeof allAttributes[0]) => (
          <Tooltip title={attr.hasMapping ? "Toggle enabled/disabled" : "Click to enable (will create mapping)"}>
            <Switch
              checked={attr.isEnabled}
              size="small"
              onChange={(checked) => {
                updateMappingMutation.mutate({
                  categoryId,
                  attributeId: attr.attributeId,
                  data: { isEnabled: checked },
                });
              }}
              loading={updateMappingMutation.isPending}
            />
          </Tooltip>
        ),
      },
      {
        title: 'Required',
        key: 'isRequired',
        width: 100,
        align: 'center',
        render: (_: unknown, attr: typeof allAttributes[0]) => (
          <Tooltip title="Mark as required">
            <Switch
              checked={attr.isRequired}
              size="small"
              disabled={!attr.isEnabled}
              onChange={(checked) => {
                updateMappingMutation.mutate({
                  categoryId,
                  attributeId: attr.attributeId,
                  data: { isRequired: checked },
                });
              }}
              loading={updateMappingMutation.isPending}
            />
          </Tooltip>
        ),
      },
      {
        title: 'Display Order',
        dataIndex: 'displayOrder',
        key: 'displayOrder',
        width: 120,
        align: 'center',
        render: (order: number) => (
          <Tag color="orange">{order}</Tag>
        ),
      },
      {
        title: 'Status',
        key: 'hasMapping',
        width: 100,
        align: 'center',
        render: (_: unknown, attr: typeof allAttributes[0]) => (
          attr.hasMapping ? (
            <Tag color="green">Mapped</Tag>
          ) : (
            <Tag color="default">Not Mapped</Tag>
          )
        ),
      },
    ];

    return (
      <div style={{ marginLeft: 40, marginRight: 40 }}>
        <div style={{ marginBottom: 16, padding: 12, background: '#f0f2f5', borderRadius: 4 }}>
          <Space>
            <Text strong>Total Master Attributes:</Text>
            <Badge count={allAttributes.length} style={{ backgroundColor: '#FF6F61' }} />
            <Text strong style={{ marginLeft: 16 }}>Enabled:</Text>
            <Badge count={allAttributes.filter((a: typeof allAttributes[0]) => a.isEnabled).length} style={{ backgroundColor: '#52c41a' }} />
            <Text strong style={{ marginLeft: 16 }}>Mapped:</Text>
            <Badge count={allAttributes.filter((a: typeof allAttributes[0]) => a.hasMapping).length} style={{ backgroundColor: '#722ed1' }} />
          </Space>
        </div>
        <Table
          columns={attributeColumns}
          dataSource={allAttributes}
          pagination={false}
          size="small"
          rowKey="attributeKey"
        />
      </div>
    );
  };

  // Expanded row showing attribute details
  const expandedRowRender = (record: CategoryWithAttributes) => {
    return <ExpandedRow categoryId={record.id} />;
  };

  const handleExpandAll = () => {
    if (expandedRowKeys.length === filteredData.length) {
      setExpandedRowKeys([]);
    } else {
      setExpandedRowKeys(filteredData.map(item => item.id));
    }
  };

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  return (
    <div className="category-attribute-matrix">
      <Card
        title={
          <Space>
            <TagsOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Category-Attribute Mappings
            </Title>
            <Badge 
              count={filteredData.length} 
              style={{ backgroundColor: '#FF6F61' }}
              showZero
            />
          </Space>
        }
        extra={
          <Space>
            <Select
              value={departmentFilter}
              onChange={setDepartmentFilter}
              style={{ width: 150 }}
              prefix={<FilterOutlined />}
            >
              <Option value="all">All Departments</Option>
              <Option value="MENS">MENS</Option>
              <Option value="LADIES">LADIES</Option>
              <Option value="KIDS">KIDS</Option>
            </Select>
            <Search
              placeholder="Search categories..."
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Tooltip title={expandedRowKeys.length > 0 ? "Collapse All" : "Expand All"}>
              <Tag 
                style={{ cursor: 'pointer' }}
                color={expandedRowKeys.length > 0 ? "red" : "green"}
                onClick={handleExpandAll}
              >
                {expandedRowKeys.length > 0 ? "Collapse All" : "Expand All"}
              </Tag>
            </Tooltip>
          </Space>
        }
      >
        <Table
          columns={mainColumns}
          dataSource={filteredData}
          rowKey="id"
          loading={isLoading}
          expandable={{
            expandedRowRender,
            expandedRowKeys,
            onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as number[]),
          }}
          pagination={{
            defaultPageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          locale={{
            emptyText: <Empty description="No categories found" />,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};
