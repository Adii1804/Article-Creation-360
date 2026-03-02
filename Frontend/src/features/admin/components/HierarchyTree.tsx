/**
 * Hierarchy Tree Component
 * Displays the complete fashion hierarchy tree with Ant Design Tree
 */

import { useMemo } from 'react';
import { Card, Tree, Empty, Skeleton, Typography, Tag } from 'antd';
import { FolderOutlined, FolderOpenOutlined, TagOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { Department } from '../../../services/adminApi';

const { Title } = Typography;

interface HierarchyTreeProps {
  hierarchy?: Department[];
  loading: boolean;
}

export const HierarchyTree = ({ hierarchy, loading }: HierarchyTreeProps) => {
  // Convert hierarchy data to Ant Design Tree data structure
  const treeData: DataNode[] = useMemo(() => {
    if (!hierarchy) return [];

    return hierarchy.map((dept) => ({
      title: (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>{dept.name}</strong>
          {dept.subDepartments && dept.subDepartments.length > 0 && (
            <Tag color="blue">{dept.subDepartments.length} sub-depts</Tag>
          )}
        </span>
      ),
      key: `dept-${dept.id}`,
      icon: <FolderOutlined style={{ color: '#FF6F61' }} />,
      children: dept.subDepartments?.map((subDept) => ({
        title: (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{subDept.name}</span>
            {subDept.categories && subDept.categories.length > 0 && (
              <Tag color="green">{subDept.categories.length} categories</Tag>
            )}
          </span>
        ),
        key: `subdept-${subDept.id}`,
        icon: <FolderOpenOutlined style={{ color: '#722ed1' }} />,
        children: subDept.categories?.map((cat) => ({
          title: cat.name,
          key: `cat-${cat.id}`,
          icon: <TagOutlined style={{ color: '#52c41a' }} />,
          isLeaf: true,
        })),
      })),
    }));
  }, [hierarchy]);

  if (loading) {
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOutlined />
            <Title level={5} style={{ margin: 0 }}>Complete Hierarchy</Title>
          </div>
        }
      >
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!hierarchy || hierarchy.length === 0) {
    return (
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderOutlined />
            <Title level={5} style={{ margin: 0 }}>Complete Hierarchy</Title>
          </div>
        }
      >
        <Empty 
          description="No hierarchy data available" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  return (
    <Card 
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FolderOutlined />
          <Title level={5} style={{ margin: 0 }}>Complete Hierarchy</Title>
        </div>
      }
      extra={
        <Tag color="blue">{treeData.length} Departments</Tag>
      }
    >
      <Tree
        showIcon
        defaultExpandAll={false}
        treeData={treeData}
        blockNode
        style={{ 
          background: '#fafafa', 
          padding: '16px', 
          borderRadius: '6px',
          maxHeight: '500px',
          overflow: 'auto'
        }}
      />
    </Card>
  );
};
