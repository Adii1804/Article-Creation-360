/**
 * Login Page
 * User authentication with Ant Design
 */

import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { BackendApiService } from '../../../services/api/backendApi';
import { clearLoginRedirectFlag } from '../../../shared/utils/auth/navigation';

const { Title, Text } = Typography;
const api = new BackendApiService();

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    clearLoginRedirectFlag();
  }, []);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const result = await api.login(values.email, values.password);
      localStorage.setItem('authToken', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      message.success(`Welcome back, ${result.user.name}!`);

      // Redirect to dashboard for all roles
      navigate('/dashboard');
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
        message.error('Unable to connect to server. Please check your network connection.');
      } else {
        message.error(error.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-start',
      backgroundImage: 'linear-gradient(90deg, rgba(0, 0, 0, 0.35) 0%, rgba(0, 0, 0, 0.15) 35%, rgba(0, 0, 0, 0.05) 100%), url("/Centric-Page2.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center right',
      backgroundRepeat: 'no-repeat',
      padding: '20px 20px 20px 15vw'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 440,
          boxShadow: '0 10px 34px rgba(0,0,0,0.20)',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.84)',
          backdropFilter: 'blur(5px)',
          border: '1px solid rgba(255, 255, 255, 0.45)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2} style={{ color: '#FF6F61', marginBottom: 8 }}>
            Automatic Article Creation
          </Title>
          <Text type="secondary" style={{ fontSize: '15px' }}>
            Sign in to manage your fashion catalog
          </Text>
        </div>

        <Form
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Enter your email address"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please enter your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder="Enter your password"
            />
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              style={{ height: '48px', fontSize: '16px', fontWeight: 500 }}
            >
              Sign In
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">
            Don't have an account? <Link to="/register" style={{ fontWeight: 500 }}>Sign up</Link>
          </Text>
        </div>
      </Card>
    </div>
  );
}
