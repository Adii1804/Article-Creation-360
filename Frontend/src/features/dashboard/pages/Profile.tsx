import { useEffect, useState } from 'react';
import { Card, Descriptions, Button, message, Space } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { BackendApiService } from '../../../services/api/backendApi';

const api = new BackendApiService();

export default function Profile() {
  const [user, setUser] = useState<{ id: string; email: string; role: string; createdAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const userData = await api.getMe();
      setUser(userData);
    } catch (error) {
      message.error('Failed to load profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (!user && !loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Card>
          <p>Please log in to view your profile.</p>
          <Button type="primary" href="/login">Login</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <UserOutlined style={{ fontSize: 24 }} />
            <span>User Profile</span>
          </div>
        }
        loading={loading}
        extra={
          <Space>
            <Button onClick={loadProfile}>Refresh</Button>
            <Button danger onClick={handleLogout}>Logout</Button>
          </Space>
        }
      >
        {user && (
          <Descriptions column={1} bordered>
            <Descriptions.Item label="User ID">{user.id}</Descriptions.Item>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Role">{user.role}</Descriptions.Item>
            <Descriptions.Item label="Member Since">
              {new Date(user.createdAt).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}