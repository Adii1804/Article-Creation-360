import { Layout, Button, Space, Dropdown, Avatar } from 'antd';
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';

const { Header } = Layout;

interface ModernAppHeaderProps {
  title?: string;
  user?: { email: string; role: string } | null;
  onLogout?: () => void;
}

export default function ModernAppHeader({ 
  title = 'AI Fashion Extractor',
  user,
  onLogout 
}: ModernAppHeaderProps) {
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
    window.location.href = '/login';
  };

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => window.location.href = '/profile'
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    },
  ];

  return (
    <Header 
      style={{ 
        background: '#fff',
        padding: '0 24px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>
          {title}
        </h1>
      </div>

      <Space size="middle">
        {user ? (
          <Dropdown 
            menu={{ items: userMenu }}
            placement="bottomRight"
            trigger={['click']}
          >
            <Button 
              type="text" 
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '4px 12px'
              }}
            >
              <Avatar size="small" icon={<UserOutlined />} />
              <span>{user.email}</span>
            </Button>
          </Dropdown>
        ) : (
          <Space>
            <Button href="/login">Login</Button>
            <Button type="primary" href="/register">Sign Up</Button>
          </Space>
        )}
      </Space>
    </Header>
  );
}