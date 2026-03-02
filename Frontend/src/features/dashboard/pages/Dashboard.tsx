import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button, Typography, Space } from 'antd';
import {
  ShoppingOutlined,
  ThunderboltOutlined,
  ControlOutlined
} from '@ant-design/icons';
import './Dashboard.css';
import { APP_CONFIG } from '../../../constants/app/config';

const { Title, Paragraph, Text } = Typography;

export default function Dashboard() {
  const navigate = useNavigate();
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isAdmin = userData?.role === 'ADMIN';
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const base = APP_CONFIG.api.baseURL;
        const endpoint = isAdmin ? `${base}/admin/extractions` : `${base}/user/history`;
        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch extraction history');
        }

        const result = await response.json();
        const jobs = result?.data?.jobs || [];
        const total = jobs.length;
        const today = new Date();
        const todayCountValue = jobs.filter((job: any) => {
          if (!job.createdAt) return false;
          const createdAt = new Date(job.createdAt);
          return createdAt.toDateString() === today.toDateString();
        }).length;

        setTotalCount(total);
        setTodayCount(todayCountValue);
      } catch (error) {
        setTotalCount(0);
        setTodayCount(0);
      }
    };

    fetchStats();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'extractionsLastUpdated') {
        fetchStats();
      }
    };

    const handleFocus = () => {
      fetchStats();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAdmin]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-hero">
        <div className="dashboard-hero-text">
          <Text className="dashboard-hero-greeting">{greeting}</Text>
          <Title level={2} className="dashboard-hero-title">
            {userData?.name || 'Welcome back'}
          </Title>
          <Paragraph className="dashboard-hero-subtitle">
            Keep your catalog organized with clean insights and a calmer workflow.
          </Paragraph>
          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              className="dashboard-hero-btn"
              onClick={() => navigate('/extraction')}
            >
              Start Extraction
            </Button>
            <Button
              icon={<ShoppingOutlined />}
              className="dashboard-ghost-btn"
              onClick={() => navigate('/products')}
            >
              View Products
            </Button>
            {isAdmin && (
              <Button
                icon={<ControlOutlined />}
                className="dashboard-ghost-btn"
                onClick={() => navigate('/admin')}
              >
                Open Admin Panel
              </Button>
            )}
          </Space>
        </div>
        <div className="dashboard-hero-card">
          <div className="dashboard-hero-card-icon">
            <ThunderboltOutlined />
          </div>
          <Text type="secondary">Today’s Processing</Text>
          <Title level={3} className="dashboard-hero-metric">
            {todayCount && todayCount > 0
              ? `${todayCount} ${todayCount === 1 ? 'job' : 'jobs'}`
              : 'No data yet'}
          </Title>
          <Text className="dashboard-hero-metric-sub">
            {totalCount && totalCount > 0
              ? `${totalCount} total extraction${totalCount === 1 ? '' : 's'}`
              : 'Run an extraction to see stats'}
          </Text>
        </div>
      </div>

      <Row gutter={[16, 16]} className="dashboard-panels">
        <Col xs={24} lg={24}>
          <Card className="dashboard-panel dashboard-panel-soft">
            <Title level={4}>Quick Actions</Title>
            <Paragraph type="secondary">Stay productive with a single click.</Paragraph>
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                className="dashboard-action-btn"
                block
                onClick={() => navigate('/extraction')}
              >
                Start Extraction
              </Button>
              <Button
                icon={<ShoppingOutlined />}
                className="dashboard-action-btn ghost"
                block
                onClick={() => navigate('/products')}
              >
                Go to Products
              </Button>
              {isAdmin && (
                <Button
                  icon={<ControlOutlined />}
                  className="dashboard-action-btn ghost"
                  block
                  onClick={() => navigate('/admin')}
                >
                  Open Admin Panel
                </Button>
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
