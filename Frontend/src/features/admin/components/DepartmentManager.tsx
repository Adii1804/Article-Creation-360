import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Typography,
  Skeleton,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  type Department,
} from '../../../services/adminApi';
import { sanitizeText, sanitizeCode } from '../../../shared/utils/security/sanitizer';
import './DepartmentManager.css';

const { Title } = Typography;

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export const DepartmentManager = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [form] = Form.useForm();

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments', true],
    queryFn: () => getDepartments(true),
  });

  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Department created successfully!');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Department> }) =>
      updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Department updated successfully!');
      setIsModalOpen(false);
      setEditingDept(null);
      form.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Department deleted successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const handleAdd = () => {
    setEditingDept(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (dept: Department) => {
    setEditingDept(dept);
    form.setFieldsValue(dept);
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleModalOk = () => {
    form.validateFields().then((values) => {
      // Sanitize all text inputs
      const sanitizedValues = {
        ...values,
        code: sanitizeCode(values.code), // Alphanumeric + underscore only
        name: sanitizeText(values.name), // Remove HTML tags
        description: values.description ? sanitizeText(values.description) : undefined,
      };

      if (editingDept) {
        updateMutation.mutate({ id: editingDept.id, data: sanitizedValues });
      } else {
        createMutation.mutate(sanitizedValues);
      }
    });
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingDept(null);
    form.resetFields();
  };

  const columns: ColumnsType<Department> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Department) => (
        <Space>
          <BankOutlined style={{ color: '#FF6F61' }} />
          <strong>{name}</strong>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Sub-Departments',
      key: 'subDepartments',
      width: 150,
      align: 'center',
      render: (_: unknown, record: Department) => (
        <Tag color="purple">{record.subDepartments?.length || 0}</Tag>
      ),
    },
    {
      title: 'Display Order',
      dataIndex: 'displayOrder',
      key: 'displayOrder',
      width: 120,
      align: 'center',
      sorter: (a, b) => a.displayOrder - b.displayOrder,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_: unknown, record: Department) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Department"
            description={`Are you sure you want to delete "${record.name}"? This will also delete all sub-departments and categories.`}
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              loading={deleteMutation.isPending}
            >
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  return (
    <div className="department-manager">
      <Card
        title={
          <Space>
            <BankOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Departments
            </Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Department
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={departments}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} departments`,
          }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <BankOutlined />
            {editingDept ? 'Edit Department' : 'Create Department'}
          </Space>
        }
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ displayOrder: 0 }}
        >
          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Please enter department code' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Use uppercase letters, numbers, and underscores only' },
            ]}
          >
            <Input placeholder="e.g., MENS" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input placeholder="e.g., Men's Fashion" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea
              placeholder="Brief description of the department"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[{ required: true, message: 'Please enter display order' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
