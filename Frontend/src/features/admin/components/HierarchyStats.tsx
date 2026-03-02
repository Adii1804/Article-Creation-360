/**
 * Hierarchy Stats Component
 * Displays dashboard statistics with Ant Design Statistic
 */

import { Row, Col, Card, Statistic, Skeleton } from 'antd';
import { 
  BankOutlined, 
  FolderOutlined, 
  TagsOutlined, 
  BgColorsOutlined, 
  StarOutlined 
} from '@ant-design/icons';
import type { DashboardStats } from '../../../services/adminApi';

interface HierarchyStatsProps {
  stats?: DashboardStats;
  loading: boolean;
}

export const HierarchyStats = ({ stats, loading }: HierarchyStatsProps) => {
  const statCards = [
    {
      title: 'Departments',
      value: stats?.departments || 0,
      icon: <BankOutlined style={{ fontSize: 24, color: '#FF6F61' }} />,
      valueStyle: { color: '#FF6F61' },
      prefix: null,
    },
    {
      title: 'Sub-Departments',
      value: stats?.subDepartments || 0,
      icon: <FolderOutlined style={{ fontSize: 24, color: '#722ed1' }} />,
      valueStyle: { color: '#722ed1' },
      prefix: null,
    },
    {
      title: 'Categories',
      value: stats?.categories || 0,
      icon: <TagsOutlined style={{ fontSize: 24, color: '#52c41a' }} />,
      valueStyle: { color: '#52c41a' },
      prefix: null,
    },
    {
      title: 'Master Attributes',
      value: stats?.masterAttributes || 0,
      icon: <BgColorsOutlined style={{ fontSize: 24, color: '#fa8c16' }} />,
      valueStyle: { color: '#fa8c16' },
      prefix: null,
    },
    {
      title: 'Allowed Values',
      value: stats?.allowedValues || 0,
      icon: <StarOutlined style={{ fontSize: 24, color: '#eb2f96' }} />,
      valueStyle: { color: '#eb2f96' },
      prefix: null,
    },
  ];

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[...Array(5)].map((_, index) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={4} key={index}>
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {statCards.map((stat, index) => (
        <Col xs={24} sm={12} md={8} lg={8} xl={4} key={index}>
          <Card 
            bordered={false} 
            hoverable
            style={{ 
              borderRadius: 8,
              transition: 'all 0.3s ease',
            }}
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic
                title={stat.title}
                value={stat.value}
                valueStyle={stat.valueStyle}
                prefix={stat.prefix}
              />
              <div style={{ marginTop: 4 }}>
                {stat.icon}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};
