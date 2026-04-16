import React from 'react';
import { Card, Typography, Empty } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const POPresentationPage: React.FC = () => {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          <FileTextOutlined style={{ marginRight: 10, color: '#1677ff' }} />
          PO Presentation
        </Title>
        <Text type="secondary">Purchase Order Presentation</Text>
      </div>

      <Card>
        <Empty
          image={<FileTextOutlined style={{ fontSize: 64, color: '#bfbfbf' }} />}
          imageStyle={{ height: 80 }}
          description={
            <span style={{ color: '#8c8c8c' }}>
              PO Presentation content coming soon
            </span>
          }
        />
      </Card>
    </div>
  );
};

export default POPresentationPage;
