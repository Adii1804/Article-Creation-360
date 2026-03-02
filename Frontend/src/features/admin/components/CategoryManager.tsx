import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Table,
  Input,
  Space,
  Tag,
  Typography,
  Skeleton,
  Empty,
  Button,
  Modal,
  Form,
  Select,
  InputNumber,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { 
  TagsOutlined, 
  SearchOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { 
  getCategories, 
  createCategory,
  updateCategory,
  deleteCategory,
  getDepartments,
  type GetCategoriesParams, 
  type Category,
  type Department,
} from '../../../services/adminApi';
import { sanitizeText, sanitizeCode } from '../../../shared/utils/security/sanitizer';
import './CategoryManager.css';

const { Title } = Typography;
const { Search } = Input;

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export const CategoryManager = () => {
  const queryClient = useQueryClient();
  const [params, setParams] = useState<GetCategoriesParams>({
    page: 1,
    limit: 20,
    search: '',
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form] = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['categories', params],
    queryFn: () => getCategories(params),
  });

  const { data: departments } = useQuery({
    queryKey: ['departments', true],
    queryFn: () => getDepartments(true),
  });

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Category created successfully!');
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Category> }) =>
      updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Category updated successfully!');
      setIsModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Category deleted successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const handleSearch = (value: string) => {
    // ✅ SANITIZE SEARCH INPUT
    const sanitized = sanitizeText(value);
    setParams({ ...params, search: sanitized, page: 1 });
  };

  const handleTableChange = (pagination: TablePaginationConfig) => {
    setParams({
      ...params,
      page: pagination.current || 1,
      limit: pagination.pageSize || 20,
    });
  };

  const handleCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setIsModalOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    // First set department to load sub-departments
    const departmentId = category.subDepartment?.department?.id;
    form.setFieldsValue({
      departmentId: departmentId,
      subDepartmentId: category.subDepartmentId,
      code: category.code,
      name: category.name,
      description: category.description || '',
      displayOrder: category.displayOrder,
      isActive: category.isActive,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: number) => {
    deleteMutation.mutate(id);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      // Remove departmentId before sending (not in Category model, used only for UI)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { departmentId, ...categoryData } = values;
      
      // ✅ SANITIZE USER INPUT
      const sanitized = {
        ...categoryData,
        code: sanitizeCode(categoryData.code), // Remove special characters
        name: sanitizeText(categoryData.name), // Remove HTML/XSS
        description: categoryData.description ? sanitizeText(categoryData.description) : undefined,
      };
      
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, data: sanitized });
      } else {
        createMutation.mutate(sanitized);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    form.resetFields();
  };

  // Get selected department for sub-department filter
  const selectedDepartmentId = Form.useWatch('departmentId', form);
  const availableSubDepartments = departments
    ?.find((dept: Department) => dept.id === selectedDepartmentId)
    ?.subDepartments || [];

  const columns: ColumnsType<Category> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Category) => (
        <Space>
          <TagsOutlined style={{ color: '#52c41a' }} />
          <strong>{name}</strong>
          {!record.isActive && <Tag color="red">Inactive</Tag>}
        </Space>
      ),
    },
    {
      title: 'Department',
      key: 'department',
      render: (_: unknown, record: Category) => (
        <Tag color="purple">{record.subDepartment?.department?.name || '-'}</Tag>
      ),
    },
    {
      title: 'Sub-Department',
      key: 'subDepartment',
      render: (_: unknown, record: Category) => (
        <Tag color="cyan">{record.subDepartment?.name || '-'}</Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      align: 'center',
      render: (_: unknown, record: Category) => (
        <Tag color={record.isActive ? 'green' : 'red'}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      align: 'center',
      render: (_: unknown, record: Category) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete Category"
            description="Are you sure? This will delete all associated data."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              size="small"
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
    <div className="category-manager">
      <Card
        title={
          <Space>
            <TagsOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Categories
            </Title>
          </Space>
        }
        extra={
          <Space>
            <Search
              placeholder="Search categories..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Category
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={data?.data}
          rowKey="id"
          loading={isLoading}
          onChange={handleTableChange}
          pagination={{
            current: data?.pagination.page,
            pageSize: data?.pagination.limit,
            total: data?.pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          locale={{
            emptyText: <Empty description="No categories found" />,
          }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Create Category'}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ displayOrder: 0, isActive: true }}
        >
          <Form.Item
            name="departmentId"
            label="Department"
            rules={[{ required: true, message: 'Please select a department' }]}
          >
            <Select placeholder="Select department">
              {departments?.map((dept: Department) => (
                <Select.Option key={dept.id} value={dept.id}>
                  {dept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subDepartmentId"
            label="Sub-Department"
            rules={[{ required: true, message: 'Please select a sub-department' }]}
          >
            <Select 
              placeholder="Select sub-department"
              disabled={!selectedDepartmentId}
            >
              {availableSubDepartments.map((subDept) => (
                <Select.Option key={subDept.id} value={subDept.id}>
                  {subDept.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="code"
            label="Code"
            rules={[
              { required: true, message: 'Please enter category code' },
              { max: 100, message: 'Code must be less than 100 characters' },
            ]}
          >
            <Input placeholder="e.g., T_SHIRT, JEANS" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Name"
            rules={[
              { required: true, message: 'Please enter category name' },
              { max: 200, message: 'Name must be less than 200 characters' },
            ]}
          >
            <Input placeholder="e.g., T-Shirt, Jeans" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea 
              rows={3}
              placeholder="Optional description..."
            />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[{ required: true, message: 'Please enter display order' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
