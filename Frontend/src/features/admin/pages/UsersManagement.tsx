import { useState, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Card,
  Form,
  Input,
  Select,
  Modal,
  Popconfirm,
  Table,
  Tag,
  Typography,
  message,
  Space,
} from 'antd';
import { PlusOutlined, UserOutlined, ShopOutlined, AppstoreOutlined, EditOutlined } from '@ant-design/icons';
import { createUser, updateUser, deactivateUser, getUsers, getDepartments, type AdminUser } from '../../../services/adminApi';

const { Title, Text } = Typography;
const { Option } = Select;

export default function UsersManagement() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('CREATOR');
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [form] = Form.useForm();

  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getUsers,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => getDepartments(true), // include sub-depts
  });

  const availableSubDepts = useMemo(() => {
    if (!selectedDeptId) return [];
    const dept = departments.find(d => d.id === selectedDeptId);
    return dept?.subDepartments || [];
  }, [selectedDeptId, departments]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    form.resetFields();
    setSelectedDeptId(null);
    setSelectedRole('CREATOR');
  };

  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      message.success('User created successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeModal();
    },
    onError: (error: any) => {
      handleMutationError(error, 'Failed to create user');
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: any) => updateUser(selectedUser!.id, data),
    onSuccess: () => {
      message.success('User updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeModal();
    },
    onError: (error: any) => {
      handleMutationError(error, 'Failed to update user');
    },
  });

  const handleMutationError = (error: any, defaultMsg: string) => {
    let errorMessage = defaultMsg;
    const apiError = error?.response?.data?.error;

    if (typeof apiError === 'string') {
      errorMessage = apiError;
    } else if (Array.isArray(apiError)) {
      errorMessage = apiError.map((e: any) => e.message || JSON.stringify(e)).join(', ');
    } else if (typeof apiError === 'object' && apiError !== null) {
      errorMessage = apiError.message || JSON.stringify(apiError);
    }

    message.error(errorMessage);
  };

  const deactivateUserMutation = useMutation({
    mutationFn: deactivateUser,
    onSuccess: () => {
      message.success('User deactivated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.error || 'Failed to deactivate user');
    },
  });

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const divisionName = departments.find(d => d.id === values.departmentId)?.name;

      const payload = {
        email: values.email,
        password: values.password, // Optional for update
        name: values.name,
        role: values.role,
        division: divisionName,
        subDivision: values.subDivision,
      };

      if (selectedUser) {
        // Update mode
        // Remove password if empty (it's optional in edit)
        if (!payload.password) {
          delete payload.password;
        }
        updateUserMutation.mutate(payload);
      } else {
        // Create mode
        createUserMutation.mutate(payload);
      }
    } catch (error) {
      console.error('Validation failed', error);
    }
  };

  const handleEditUser = (user: AdminUser) => {
    setSelectedUser(user);
    setSelectedRole(user.role);

    // Find department ID from name
    const dept = departments.find(d => d.name === user.division);
    const deptId = dept?.id || null;
    setSelectedDeptId(deptId);

    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: deptId,
      subDivision: user.subDivision,
      password: '', // Clear password field
    });

    setIsModalOpen(true);
  };

  const handleRoleChange = (role: string) => {
    setSelectedRole(role);
  };

  const handleDeptChange = (deptId: number) => {
    setSelectedDeptId(deptId);
    form.setFieldValue('subDivision', undefined);
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (value: string) => <Text strong>{value}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: AdminUser['role']) => (
        <Tag color={role === 'ADMIN' ? 'geekblue' : 'default'}>{role}</Tag>
      ),
    },
    {
      title: 'Scope',
      key: 'scope',
      render: (_: any, record: AdminUser) => {
        if (record.role === 'ADMIN') return <Text type="secondary">—</Text>;
        return (
          <Space direction="vertical" size={0}>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {record.division || 'No Division'}
            </Text>
            <Text strong style={{ fontSize: 12 }}>
              {record.subDivision || 'No Sub-Division'}
            </Text>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'ACTIVE' : 'INACTIVE'}</Tag>
      ),
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (value: string | null) => (value ? new Date(value).toLocaleString() : '—'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AdminUser) => {
        const isSelf = userData?.id === record.id;
        return (
          <Space>
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEditUser(record)}
            >
              Edit
            </Button>
            <Popconfirm
              title="Deactivate user"
              description="This will prevent the user from logging in. Continue?"
              onConfirm={() => deactivateUserMutation.mutate(record.id)}
              okButtonProps={{ danger: true }}
              disabled={!record.isActive || isSelf}
            >
              <Button danger size="small" disabled={!record.isActive || isSelf}>
                Deactivate
              </Button>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ marginBottom: 4 }}>User Management</Title>
            <Text type="secondary">Add users and manage access roles.</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            Add User
          </Button>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users.filter((u) => u.isActive)}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No users found' }}
        />
      </Card>

      <Modal
        title={selectedUser ? "Edit User" : "Create User"}
        open={isModalOpen}
        onOk={handleSubmit}
        onCancel={closeModal}
        confirmLoading={createUserMutation.isPending || updateUserMutation.isPending}
        width={500}
        okText={selectedUser ? "Update" : "Create"}
      >
        <Form form={form} layout="vertical" initialValues={{ role: 'CREATOR' }}>
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter name' }]}
          >
            <Input placeholder="Full name" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Enter a valid email' },
            ]}
          >
            <Input placeholder="name@company.com" disabled={!!selectedUser} />
          </Form.Item>
          <Form.Item
            name="password"
            label={selectedUser ? "Password (leave blank to keep current)" : "Password"}
            rules={[
              { required: !selectedUser, message: 'Please enter password' },
              { min: 6, message: 'Minimum 6 characters' },
            ]}
          >
            <Input.Password placeholder={selectedUser ? "New password (optional)" : "Temporary password"} />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true }]}
          >
            <Select
              onChange={handleRoleChange}
              options={[
                { value: 'CREATOR', label: 'CREATOR' },
                { value: 'APPROVER', label: 'APPROVER' },
                { value: 'ADMIN', label: 'ADMIN' },
              ]}
            />
          </Form.Item>

          {(selectedRole === 'CREATOR' || selectedRole === 'APPROVER') && (
            <>
              <Form.Item
                name="departmentId"
                label="Division"
                rules={[{ required: true, message: 'Please select division' }]}
              >
                <Select
                  placeholder="Select Division"
                  onChange={handleDeptChange}
                  suffixIcon={<ShopOutlined />}
                >
                  {departments.map(dept => (
                    <Option key={dept.id} value={dept.id}>{dept.name}</Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="subDivision"
                label="Sub-Division"
                rules={[{ required: true, message: 'Please select sub-division' }]}
              >
                <Select
                  placeholder="Select Sub-Division"
                  disabled={!selectedDeptId}
                  suffixIcon={<AppstoreOutlined />}
                >
                  {availableSubDepts.map(sub => (
                    <Option key={sub.id} value={sub.code}>{sub.name} ({sub.code})</Option>
                  ))}
                </Select>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
