import React from 'react';
import { Card, Row, Col, Statistic, Tag, Tooltip, Progress } from 'antd';
import { 
  DollarOutlined, 
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { formatCurrency } from '../../../shared/utils/costCalculator';
import type { MonthlyCostAnalysis } from '../../../shared/utils/costCalculator';

interface CostOverviewProps {
  currentMonthCost: number;
  monthlyAnalysis: MonthlyCostAnalysis;
  totalLifetimeCost: number;
  averageCostPerExtraction: number;
  monthlyBudget?: number;
}

export const CostOverview: React.FC<CostOverviewProps> = ({
  currentMonthCost,
  monthlyAnalysis,
  totalLifetimeCost,
  averageCostPerExtraction,
  monthlyBudget = 100, // Default $100 monthly budget
}) => {
  const budgetUsagePercent = (currentMonthCost / monthlyBudget) * 100;
  const isOverBudget = budgetUsagePercent > 100;
  const isNearBudget = budgetUsagePercent > 80 && budgetUsagePercent <= 100;

  const getTrendIcon = () => {
    if (monthlyAnalysis.trend === 'up') {
      return <ArrowUpOutlined style={{ color: '#ff4d4f' }} />;
    }
    if (monthlyAnalysis.trend === 'down') {
      return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (monthlyAnalysis.trend === 'up') return '#ff4d4f';
    if (monthlyAnalysis.trend === 'down') return '#52c41a';
    return '#1890ff';
  };

  return (
    <Card 
      title={
        <span>
          <DollarOutlined style={{ marginRight: 8 }} />
          Cost Overview
        </span>
      }
      bordered={false}
    >
      <Row gutter={[16, 16]}>
        {/* Current Month Cost */}
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Current Month"
            value={currentMonthCost}
            precision={4}
            prefix="$"
            valueStyle={{ color: '#3f8600' }}
          />
          <div style={{ marginTop: 8 }}>
            {getTrendIcon()}
            <span style={{ marginLeft: 4, color: getTrendColor() }}>
              {Math.abs(monthlyAnalysis.percentageChange).toFixed(1)}%
            </span>
            <span style={{ marginLeft: 4, fontSize: 12, color: '#8c8c8c' }}>
              vs last month
            </span>
          </div>
        </Col>

        {/* Projected Month End */}
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title={
              <span>
                Projected (Month End)
                <Tooltip title="Based on current daily spend rate">
                  <InfoCircleOutlined style={{ marginLeft: 4, fontSize: 12 }} />
                </Tooltip>
              </span>
            }
            value={monthlyAnalysis.projectedEndOfMonth}
            precision={4}
            prefix="$"
            valueStyle={{ 
              color: monthlyAnalysis.projectedEndOfMonth > monthlyBudget ? '#cf1322' : '#1890ff' 
            }}
          />
        </Col>

        {/* Average Cost per Extraction */}
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Avg Cost / Extraction"
            value={averageCostPerExtraction}
            precision={6}
            prefix="$"
          />
        </Col>

        {/* Lifetime Total */}
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Lifetime Total"
            value={totalLifetimeCost}
            precision={2}
            prefix="$"
            valueStyle={{ color: '#595959' }}
          />
        </Col>
      </Row>

      {/* Budget Progress */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>Monthly Budget Usage</span>
          <span style={{ fontSize: 14 }}>
            {formatCurrency(currentMonthCost, 2)} / {formatCurrency(monthlyBudget, 2)}
          </span>
        </div>
        <Progress
          percent={Math.min(budgetUsagePercent, 100)}
          strokeColor={{
            '0%': isOverBudget ? '#ff4d4f' : isNearBudget ? '#faad14' : '#52c41a',
            '100%': isOverBudget ? '#cf1322' : isNearBudget ? '#fa8c16' : '#389e0d',
          }}
          status={isOverBudget ? 'exception' : 'normal'}
        />
        {isOverBudget && (
          <Tag color="error" style={{ marginTop: 8 }}>
            Over budget by {formatCurrency(currentMonthCost - monthlyBudget, 2)}
          </Tag>
        )}
        {isNearBudget && (
          <Tag color="warning" style={{ marginTop: 8 }}>
            Approaching budget limit ({budgetUsagePercent.toFixed(1)}%)
          </Tag>
        )}
      </div>
    </Card>
  );
};

export default CostOverview;
