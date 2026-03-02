import { useState, useMemo } from 'react';
import { Card, Row, Col, Statistic, Progress, DatePicker, Select, Button, Space, Spin, Empty, Typography } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  CloudUploadOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  CalendarOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { colors } from '../../../theme/colors';
import { CostOverview, CategoryCostTable, ModelComparison } from '../components';
import { 
  calculateMonthlyCosts, 
  calculateModelComparison,
  formatCurrency
} from '../../../shared/utils/costCalculator';
import { analyticsService } from '../../../services/analyticsService';
import type { Dayjs } from 'dayjs';
import './Analytics.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

export default function Analytics() {
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  
  // Get real data from analytics service
  const allHistory = analyticsService.getHistory();
  
  // Filter data based on category and date range
  const filteredHistory = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? allHistory 
      : allHistory.filter(record => record.category === selectedCategory);
    
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].toDate();
      const endDate = dateRange[1].toDate();
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }
    
    return filtered;
  }, [allHistory, selectedCategory, dateRange]);

  // Calculate stats from real data
  const stats = useMemo(() => analyticsService.getStats(filteredHistory), [filteredHistory]);
  const timeSeriesData = useMemo(() => analyticsService.getTimeSeriesData(30), []);
  const categoryStats = useMemo(() => analyticsService.getCategoryStats(filteredHistory), [filteredHistory]);
  const modelUsageStats = useMemo(() => analyticsService.getModelUsageStats(filteredHistory), [filteredHistory]);

  // Get unique categories from data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(allHistory.map(r => r.category).filter(Boolean));
    return [
      { value: 'all', label: 'All Categories' },
      ...Array.from(uniqueCategories).map(cat => ({ value: cat, label: cat }))
    ];
  }, [allHistory]);

  // Prepare cost data for components
  const currentMonthCost = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthRecords = allHistory.filter(r => new Date(r.timestamp) >= currentMonthStart);
    return analyticsService.getStats(currentMonthRecords).totalCost;
  }, [allHistory]);

  const lastMonthCost = useMemo(() => {
    const now = new Date();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthRecords = allHistory.filter(r => {
      const recordDate = new Date(r.timestamp);
      return recordDate >= lastMonthStart && recordDate <= lastMonthEnd;
    });
    return analyticsService.getStats(lastMonthRecords).totalCost;
  }, [allHistory]);

  const monthlyAnalysis = useMemo(() => {
    const now = new Date();
    const daysElapsed = now.getDate();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    return calculateMonthlyCosts(
      currentMonthCost,
      lastMonthCost,
      daysElapsed,
      totalDays
    );
  }, [currentMonthCost, lastMonthCost]);

  const categoryCostBreakdown = useMemo(() => {
    if (categoryStats.length === 0) return [];
    
    const totalCost = categoryStats.reduce((sum, cat) => sum + cat.cost, 0);
    
    return categoryStats.map(cat => ({
      category: cat.category,
      extractionCount: cat.count,
      totalCost: cat.cost,
      avgCostPerExtraction: cat.count > 0 ? cat.cost / cat.count : 0,
      tokenUsage: cat.tokensUsed,
      percentage: totalCost > 0 ? (cat.cost / totalCost) * 100 : 0
    }));
  }, [categoryStats]);

  // Get current model (most used model)
  const currentModel = useMemo(() => {
    if (modelUsageStats.length === 0) return 'gpt-4o';
    return modelUsageStats.reduce((max, stat) => 
      stat.count > max.count ? stat : max
    ).model;
  }, [modelUsageStats]);

  // Calculate model comparison using average tokens
  const avgTokensPerExtraction = useMemo(() => {
    return stats.totalExtractions > 0 ? stats.totalTokensUsed / stats.totalExtractions : 1000;
  }, [stats]);

  const modelComparison = useMemo(() => {
    // Assume 60% input, 40% output ratio
    const inputTokens = Math.round(avgTokensPerExtraction * 0.6);
    const outputTokens = Math.round(avgTokensPerExtraction * 0.4);
    return calculateModelComparison(inputTokens, outputTokens);
  }, [avgTokensPerExtraction]);

  const handleExport = () => {
    setLoading(true);
    try {
      const exportData = analyticsService.exportToJSON();
      const dataBlob = new Blob([exportData], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${new Date().toISOString()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    // Force re-render by triggering a state change
    setTimeout(() => {
      setLoading(false);
      window.location.reload(); // Simple refresh for now
    }, 500);
  };

  const handleDateRangeChange = (dates: [Dayjs | null, Dayjs | null] | null) => {
    setDateRange(dates);
  };

  const statusData = [
    { name: 'Completed', value: stats.completed, color: colors.success[500] },
    { name: 'Failed', value: stats.failed, color: colors.error[500] },
    { name: 'Processing', value: stats.processing, color: colors.primary[500] },
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <Title level={2} style={{ margin: 0 }}>Analytics Dashboard</Title>
        <Space size="middle">
          <RangePicker 
            onChange={handleDateRangeChange}
            placeholder={['Start Date', 'End Date']}
            suffixIcon={<CalendarOutlined />}
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            style={{ width: 200 }}
            suffixIcon={<FilterOutlined />}
          >
            {categories.map(cat => (
              <Option key={cat.value} value={cat.value}>{cat.label}</Option>
            ))}
          </Select>
          <Button 
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={loading}
          >
            Export Report
          </Button>
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Extractions"
              value={stats.totalExtractions}
              prefix={<CloudUploadOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={stats.totalExtractions > 0 ? ((stats.completed / stats.totalExtractions) * 100).toFixed(1) : '0'}
              suffix="%"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Processing Time"
              value={(stats.avgProcessingTime / 1000).toFixed(2)}
              suffix="sec"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Tokens Used"
              value={stats.totalTokensUsed}
              prefix={<CloudUploadOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Extraction Trends" className="chart-card">
            {timeSeriesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border.light} />
                  <XAxis dataKey="date" stroke={colors.text.secondary} />
                  <YAxis stroke={colors.text.secondary} />
                  <Tooltip 
                    contentStyle={{ 
                      background: colors.background.base,
                      border: `1px solid ${colors.border.base}`,
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="extractions" 
                    stroke={colors.primary[500]} 
                    strokeWidth={3}
                    name="Total Extractions"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke={colors.success[500]} 
                    strokeWidth={3}
                    name="Completed"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="failed" 
                    stroke={colors.error[500]} 
                    strokeWidth={2}
                    name="Failed"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" style={{ padding: '60px 0' }} />
            )}
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Status Distribution" className="chart-card">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={(entry) => `${entry.name}: ${entry.value}`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: colors.background.base,
                      border: `1px solid ${colors.border.base}`,
                      borderRadius: '6px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="No data available" style={{ padding: '60px 0' }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="AI Model Performance" className="metrics-card">
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, color: colors.text.secondary }}>Overall Confidence</div>
              <Progress 
                percent={Math.round(stats.avgConfidence)} 
                status="active" 
                strokeColor={{ from: colors.primary[500], to: colors.success[500] }}
                trailColor={colors.border.light}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ marginBottom: 8, color: colors.text.secondary }}>Success Rate</div>
              <Progress 
                percent={stats.totalExtractions > 0 ? Math.round((stats.completed / stats.totalExtractions) * 100) : 0} 
                strokeColor={colors.success[500]}
                trailColor={colors.border.light}
              />
            </div>
            <div>
              <div style={{ marginBottom: 8, color: colors.text.secondary }}>Total Cost</div>
              <Progress 
                percent={Math.min(100, Math.round((stats.totalCost / 100) * 100))} 
                strokeColor={colors.primary[500]}
                trailColor={colors.border.light}
                format={() => formatCurrency(stats.totalCost)}
              />
            </div>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Performance Metrics" className="metrics-card">
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Avg Response Time"
                  value={245}
                  suffix="ms"
                  valueStyle={{ color: colors.success[600] }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Queue Length"
                  value={3}
                  valueStyle={{ color: colors.error[500] }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Daily Limit"
                  value={85}
                  suffix="% used"
                  valueStyle={{ color: colors.warning[500] }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Error Rate"
                  value={3.4}
                  suffix="%"
                  valueStyle={{ color: colors.error[500] }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Cost Analytics Section */}
      {stats.totalExtractions > 0 && (
        <>
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <CostOverview
                currentMonthCost={currentMonthCost}
                monthlyAnalysis={monthlyAnalysis}
                totalLifetimeCost={stats.totalCost}
                averageCostPerExtraction={stats.totalExtractions > 0 ? stats.totalCost / stats.totalExtractions : 0}
                monthlyBudget={100} // $100 monthly budget - make this configurable later
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24}>
              <CategoryCostTable
                data={categoryCostBreakdown}
                loading={loading}
              />
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24, marginBottom: 24 }}>
            <Col xs={24}>
              <ModelComparison
                currentModel={currentModel}
                inputTokens={Math.round(avgTokensPerExtraction * 0.6)}
                outputTokens={Math.round(avgTokensPerExtraction * 0.4)}
                comparison={modelComparison}
              />
            </Col>
          </Row>
        </>
      )}

      </Spin>
    </div>
  );
}