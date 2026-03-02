import { Card, Typography, Empty, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

export default function UploadsList() {
  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Uploads</Typography.Title>
      <Card>
        <Empty
          image={<InfoCircleOutlined style={{ fontSize: 64, color: '#FF6F61' }} />}
          description={
            <div>
              <Typography.Title level={4}>Upload Management Deprecated</Typography.Title>
              <Typography.Paragraph type="secondary">
                The upload management feature has been removed. Please use the extraction page to process images.
              </Typography.Paragraph>
              <Alert
                message="Use AI Extraction Instead"
                description="Navigate to the AI Extraction page from the sidebar to upload and process fashion images."
                type="info"
                showIcon
              />
            </div>
          }
        />
      </Card>
    </div>
  );
}
