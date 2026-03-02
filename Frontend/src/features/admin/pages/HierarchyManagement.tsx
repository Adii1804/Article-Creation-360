/**
 * Hierarchy Management Page
 * Manage departments, sub-departments, categories, and attributes
 */

import { useState } from 'react';
import { Layout, Tabs, Button, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  BankOutlined,
  TagsOutlined,
  BgColorsOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getHierarchyTree } from '../../../services/adminApi';
import { HierarchyStats } from '../components/HierarchyStats';
import { HierarchyTree } from '../components/HierarchyTree';
import { DepartmentManager } from '../components/DepartmentManager';
import { CategoryManager } from '../components/CategoryManager';
import { AttributeManager } from '../components/AttributeManager';
import { CategoryAttributeMatrix } from '../components/CategoryAttributeMatrix';
import VLMStatusPanel from '../../../components/vlm/VLMStatusPanel';

const { Content } = Layout;
const { Title, Text } = Typography;

type TabType = 'overview' | 'departments' | 'categories' | 'attributes' | 'mappings';

export default function HierarchyManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['hierarchy-stats'],
    queryFn: getDashboardStats,
  });

  // Fetch hierarchy tree
  const { data: hierarchy, isLoading: hierarchyLoading } = useQuery({
    queryKey: ['hierarchy-tree'],
    queryFn: getHierarchyTree,
  });

  const handleExport = async () => {
    try {
      const { exportHierarchy } = await import('../../../services/adminApi');
      const blob = await exportHierarchy();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hierarchy-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <DashboardOutlined /> Overview
        </span>
      ),
      children: (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <VLMStatusPanel />
          <HierarchyStats stats={stats} loading={statsLoading} />
          <HierarchyTree hierarchy={hierarchy} loading={hierarchyLoading} />
        </Space>
      ),
    },
    {
      key: 'departments',
      label: (
        <span>
          <BankOutlined /> Departments
        </span>
      ),
      children: <DepartmentManager />,
    },
    {
      key: 'categories',
      label: (
        <span>
          <TagsOutlined /> Categories
        </span>
      ),
      children: <CategoryManager />,
    },
    {
      key: 'attributes',
      label: (
        <span>
          <BgColorsOutlined /> Attributes
        </span>
      ),
      children: <AttributeManager />,
    },
    {
      key: 'mappings',
      label: (
        <span>
          <TagsOutlined /> Category-Attribute Mappings
        </span>
      ),
      children: <CategoryAttributeMatrix />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {/* Header */}
          <div style={{
            background: '#fff',
            padding: '24px',
            marginBottom: '24px',
            borderRadius: '8px',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={2} style={{ margin: 0 }}>Hierarchy Management</Title>
                <Text type="secondary">Manage departments, categories & attributes</Text>
              </div>
              <Space>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={handleExport}
                >
                  Export Data
                </Button>
              </Space>
            </div>
          </div>

          {/* Tabs Content */}
          <div style={{ background: '#fff', borderRadius: '8px', overflow: 'hidden' }}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => setActiveTab(key as TabType)}
              items={tabItems}
              size="large"
              style={{ padding: '0 24px' }}
              tabBarStyle={{ marginBottom: 0 }}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
}
