import { Card, Typography, Empty, Alert, Button } from 'antd';
import { InfoCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

export default function UploadDetail() {
  const navigate = useNavigate();

  return (
    <div style={{ padding: 24 }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        Back
      </Button>
      <Typography.Title level={3}>Upload Detail</Typography.Title>
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
