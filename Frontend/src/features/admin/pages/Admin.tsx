import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Button, message, Table, Empty, Spin } from 'antd';
import {
  UserOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  DollarOutlined,
  PictureOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { BackendApiService } from '../../../services/api/backendApi';

const api = new BackendApiService();

export default function Admin() {
  const [stats, setStats] = useState({ totalUploads: 0, completed: 0, failed: 0, pending: 0 });
  const [expenseData, setExpenseData] = useState<any>(null);
  const [imageData, setImageData] = useState<any>(null);
  const [detailedExpenses, setDetailedExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminStats, expenses, images, detailed] = await Promise.all([
        api.getAdminStats(),
        api.getExpenseAnalytics(),
        api.getImageUsageAnalytics(),
        api.getDetailedExpenses(),
      ]);
      console.log('Admin Stats:', adminStats);
      console.log('Expense Data:', expenses);
      console.log('Image Data:', images);
      console.log('Detailed Expenses:', detailed);
      setStats(adminStats);
      setExpenseData(expenses);
      setImageData(images);
      setDetailedExpenses(detailed || []);
    } catch (error) {
      message.error('Failed to load admin data');
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const expenseColumns = [
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'Count',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: 'Total Cost',
      key: 'costPrice',
      render: (_: any, record: any) => `$${record.totalCostPrice?.toFixed(2) || '0.00'}`,
    },
  ];

  const detailedExpenseColumns = [
    {
      title: 'Image',
      key: 'image',
      width: 80,
      align: 'center' as const,
      render: (_: any, record: any) => (
        record.imageUrl ? (
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => window.open(record.imageUrl, '_blank')}
            title="View image"
          />
        ) : (
          <span style={{ color: '#ccc' }}>—</span>
        )
      ),
    },
    {
      title: 'Article',
      dataIndex: 'imageName',
      key: 'imageName',
      ellipsis: true,
      render: (imageName: string, record: any) => {
        // Use articleNumber if available, otherwise fall back to imageName
        const displayName = record.articleNumber || imageName;
        return displayName || '—';
      },
    },
    {
      title: 'Input Tokens',
      dataIndex: 'inputTokens',
      key: 'inputTokens',
      align: 'right' as const,
      render: (val: number) => val?.toLocaleString() || '0',
    },
    {
      title: 'Output Tokens',
      dataIndex: 'outputTokens',
      key: 'outputTokens',
      align: 'right' as const,
      render: (val: number) => val?.toLocaleString() || '0',
    },
    {
      title: 'Total Tokens',
      key: 'totalTokens',
      align: 'right' as const,
      render: (_: any, record: any) => ((record.inputTokens || 0) + (record.outputTokens || 0)).toLocaleString(),
    },
    {
      title: 'Cost',
      dataIndex: 'cost',
      key: 'cost',
      align: 'right' as const,
      render: (val: number) => `$${val?.toFixed(4) || '0.0000'}`,
    },
  ];

  const categoryColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
    },
    {
      title: 'Image Count',
      dataIndex: 'count',
      key: 'count',
    },
  ];

  const statusBreakdownData = expenseData?.statusBreakdown
    ? Object.entries(expenseData.statusBreakdown).map(([status, data]: [string, any]) => ({
      key: status,
      status,
      count: data.count,
      totalCostPrice: data.totalCostPrice,
      totalSellingPrice: data.totalSellingPrice,
    }))
    : [];

  const categoryBreakdownData = imageData?.categoryBreakdown
    ? Object.entries(imageData.categoryBreakdown).map(([category, count]: [string, any]) => ({
      key: category,
      category,
      count,
    }))
    : [];

  return (
    <div className="page-scroll-enabled" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1>Admin Dashboard</h1>
        <Button icon={<ReloadOutlined />} onClick={loadData} loading={loading}>
          Refresh
        </Button>
      </div>

      <Spin spinning={loading}>
        {/* Main Statistics Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Uploads"
                value={stats.totalUploads}
                prefix={<CloudUploadOutlined />}
                valueStyle={{ color: '#FF6F61' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Completed"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Failed"
                value={stats.failed}
                prefix={<CloseCircleOutlined />}
                valueStyle={{ color: '#f5222d' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Pending"
                value={stats.pending}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Debug Info */}
        <Card style={{ marginBottom: 24, background: '#f0f2f5' }}>
          <p><strong>Debug Info:</strong></p>
          <p>Expense Data Loaded: {expenseData ? 'Yes' : 'No'}</p>
          <p>Image Data Loaded: {imageData ? 'Yes' : 'No'}</p>
          <p>Status Breakdown Records: {statusBreakdownData.length}</p>
          <p>Category Breakdown Records: {categoryBreakdownData.length}</p>
        </Card>

        {/* Expense and Image Analytics Row */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card title="Expense Overview" extra={<DollarOutlined />}>
              {expenseData ? (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Total Cost Price"
                      value={expenseData.totalCostPrice}
                      prefix="$"
                      precision={2}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                </Row>
              ) : (
                <Empty description="No expense data available" />
              )}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            <Card title="Image Usage Overview" extra={<PictureOutlined />}>
              {imageData ? (
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Total Images Used"
                      value={imageData.totalImages}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Unique Images"
                      value={imageData.uniqueImages}
                      valueStyle={{ color: '#13c2c2' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Images with Costs"
                      value={expenseData?.totalJobsWithCosts || 0}
                      valueStyle={{ color: '#1890ff' }}
                    />
                  </Col>
                  <Col xs={24} sm={12}>
                    <Statistic
                      title="Avg Images/Day"
                      value={imageData.averageImagesPerDay}
                      precision={2}
                      valueStyle={{ color: '#eb2f96' }}
                    />
                  </Col>
                </Row>
              ) : (
                <Empty description="No image data available" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Detailed Tables */}
        <Card style={{ marginBottom: 24, marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Expense Breakdown</h3>
          {statusBreakdownData.length > 0 ? (
            <Table
              columns={expenseColumns}
              dataSource={statusBreakdownData}
              pagination={false}
              size="small"
              rowKey="key"
            />
          ) : (
            <Empty description="No expense data available" style={{ padding: '40px 0' }} />
          )}
        </Card>

        {/* Detailed Per-Image Expenses */}
        <Card title="Detailed Image Expenses" style={{ marginBottom: 24 }}>
          {detailedExpenses.length > 0 ? (
            <Table
              columns={detailedExpenseColumns}
              dataSource={detailedExpenses}
              pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} images` }}
              size="small"
              rowKey="key"
              scroll={{ x: 800 }}
            />
          ) : (
            <Empty description="No detailed expense data available" style={{ padding: '40px 0' }} />
          )}
        </Card>

        <Card title="Admin Overview" style={{ marginTop: 24 }}>
          <p>Use the sidebar navigation to manage the system:</p>
          <ul>
            <li><strong>Hierarchy Management:</strong> Manage departments, categories, and attributes</li>
            <li><strong>Expense Analytics:</strong> Track costs, selling prices, and profit margins</li>
            <li><strong>Image Usage Analytics:</strong> Monitor total images and extraction statistics</li>
          </ul>
        </Card>
      </Spin>
    </div>
  );
}
