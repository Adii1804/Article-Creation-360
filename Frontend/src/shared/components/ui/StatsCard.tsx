import React from 'react';
import { Card, Statistic, Row, Col } from 'antd';

interface StatItem {
  label: string;
  value: string | number;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple';
}

interface StatsCardProps {
  title: string;
  stats: StatItem[]; 
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, stats }) => {
  const getValueStyle = (color?: string) => {
    const colors = {
      blue: '#FF6F61',
      green: '#52c41a',
      orange: '#fa8c16',
      red: '#ff4d4f',
      purple: '#722ed1'
    };
    
    return { 
      color: color ? colors[color as keyof typeof colors] : '#262626' 
    };
  };

  return (
    <Card title={title} size="small">
      <Row gutter={[8, 8]}>
        {stats.map((stat, index) => (
          <Col span={24} key={index}>
            <Statistic
              title={stat.label}
              value={stat.value}
              valueStyle={getValueStyle(stat.color)}
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
};
