import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Collapse,
  Tag,
  Space,
  Typography,
  Skeleton,
  Empty,
  Badge,
  Button,
  Modal,
  Form,
  Input,
  Select,
  InputNumber,
  Switch,
  message,
  Popconfirm,
} from 'antd';
import { 
  BgColorsOutlined, 
  TagOutlined, 
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { 
  getMasterAttributes,
  createMasterAttribute,
  updateMasterAttribute,
  deleteMasterAttribute,
  addAllowedValue,
  deleteAllowedValue,
  type MasterAttribute,
  type AllowedValue,
} from '../../../services/adminApi';
import { sanitizeText, sanitizeCode } from '../../../shared/utils/security/sanitizer';
import './AttributeManager.css';

const { Title, Text } = Typography;
const { Panel } = Collapse;

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
  message: string;
}

export const AttributeManager = () => {
  const queryClient = useQueryClient();
  const user = localStorage.getItem('user');
  const userData = user ? JSON.parse(user) : null;
  const isAdmin = userData?.role === 'ADMIN';
  const [isAttrModalOpen, setIsAttrModalOpen] = useState(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<MasterAttribute | null>(null);
  const [selectedAttribute, setSelectedAttribute] = useState<MasterAttribute | null>(null);
  const [attrForm] = Form.useForm();
  const [valueForm] = Form.useForm();

  const { data: attributes, isLoading } = useQuery({
    queryKey: ['master-attributes', true],
    queryFn: () => getMasterAttributes(true),
  });

  const createAttrMutation = useMutation({
    mutationFn: createMasterAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-attributes'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-stats'] });
      message.success('Attribute created successfully!');
      setIsAttrModalOpen(false);
      attrForm.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const updateAttrMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MasterAttribute> }) =>
      updateMasterAttribute(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-attributes'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Attribute updated successfully!');
      setIsAttrModalOpen(false);
      setEditingAttribute(null);
      attrForm.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const deleteAttrMutation = useMutation({
    mutationFn: deleteMasterAttribute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-attributes'] });
      queryClient.invalidateQueries({ queryKey: ['hierarchy-tree'] });
      message.success('Attribute deleted successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const addValueMutation = useMutation({
    mutationFn: ({ attributeId, data }: { attributeId: number; data: Partial<AllowedValue> }) =>
      addAllowedValue(attributeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-attributes'] });
      message.success('Value added successfully!');
      setIsValueModalOpen(false);
      valueForm.resetFields();
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const deleteValueMutation = useMutation({
    mutationFn: ({ attributeId, valueId }: { attributeId: number; valueId: number }) =>
      deleteAllowedValue(attributeId, valueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-attributes'] });
      message.success('Value deleted successfully!');
    },
    onError: (error: ApiErrorResponse) => {
      message.error(error.response?.data?.error || error.message);
    },
  });

  const handleCreateAttribute = () => {
    if (!isAdmin) {
      message.error('Only admin can add attributes');
      return;
    }
    setEditingAttribute(null);
    attrForm.resetFields();
    setIsAttrModalOpen(true);
  };

  const handleEditAttribute = (attr: MasterAttribute) => {
    if (!isAdmin) {
      message.error('Only admin can edit attributes');
      return;
    }
    setEditingAttribute(attr);
    attrForm.setFieldsValue({
      key: attr.key,
      label: attr.label,
      type: attr.type,
      description: attr.description || '',
      displayOrder: attr.displayOrder,
      isActive: attr.isActive,
    });
    setIsAttrModalOpen(true);
  };

  const handleDeleteAttribute = (id: number) => {
    if (!isAdmin) {
      message.error('Only admin can delete attributes');
      return;
    }
    deleteAttrMutation.mutate(id);
  };

  const handleAttrModalOk = async () => {
    try {
      const values = await attrForm.validateFields();
      
      // Sanitize all text inputs
      const sanitizedValues = {
        ...values,
        code: sanitizeCode(values.code), // Alphanumeric + underscore only
        name: sanitizeText(values.name), // Remove HTML tags
        description: values.description ? sanitizeText(values.description) : undefined,
      };
      
      if (editingAttribute) {
        updateAttrMutation.mutate({ id: editingAttribute.id, data: sanitizedValues });
      } else {
        createAttrMutation.mutate(sanitizedValues);
      }
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleAddValue = (attr: MasterAttribute) => {
    if (!isAdmin) {
      message.error('Only admin can add values');
      return;
    }
    setSelectedAttribute(attr);
    valueForm.resetFields();
    setIsValueModalOpen(true);
  };

  const handleValueModalOk = async () => {
    if (!selectedAttribute) return;
    
    try {
      const values = await valueForm.validateFields();
      
      // Sanitize allowed value input
      const sanitizedValues = {
        ...values,
        value: sanitizeText(values.value), // Remove HTML tags
        displayValue: values.displayValue ? sanitizeText(values.displayValue) : undefined,
      };
      
      addValueMutation.mutate({ attributeId: selectedAttribute.id, data: sanitizedValues });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteValue = (attributeId: number, valueId: number) => {
    if (!isAdmin) {
      message.error('Only admin can delete values');
      return;
    }
    deleteValueMutation.mutate({ attributeId, valueId });
  };

  const getTypeColor = (type: string) => {
    const colors = {
      TEXT: 'blue',
      SELECT: 'green',
      NUMBER: 'purple',
    };
    return colors[type as keyof typeof colors] || 'default';
  };

  const totalValues = attributes?.reduce((sum, attr) => sum + (attr.allowedValues?.length || 0), 0) || 0;

  if (isLoading) {
    return (
      <Card>
        <Skeleton active paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!attributes || attributes.length === 0) {
    return (
      <Card>
        <Empty description="No attributes found" />
      </Card>
    );
  }

  return (
    <div className="attribute-manager">
      <Card
        title={
          <Space>
            <BgColorsOutlined />
            <Title level={4} style={{ margin: 0 }}>
              Master Attributes
            </Title>
          </Space>
        }
        extra={
          <Space size="large">
            <Text type="secondary">
              <Badge count={attributes.length} showZero color="blue" />
              <span style={{ marginLeft: 8 }}>Attributes</span>
            </Text>
            <Text type="secondary">
              <Badge count={totalValues} showZero color="green" />
              <span style={{ marginLeft: 8 }}>Values</span>
            </Text>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateAttribute}
              disabled={!isAdmin}
            >
              Add Attribute
            </Button>
          </Space>
        }
      >
        <Collapse
          accordion
          bordered={false}
          className="attribute-collapse"
        >
          {attributes.map((attr) => (
            <Panel
              key={attr.id}
              header={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <Space>
                    <Tag color={getTypeColor(attr.type)}>{attr.type}</Tag>
                    <strong>{attr.label}</strong>
                    <Text type="secondary" code>{attr.key}</Text>
                    <Badge
                      count={attr.allowedValues?.length || 0}
                      style={{ backgroundColor: '#52c41a' }}
                    />
                  </Space>
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                      type="link"
                      size="small"
                      icon={<EditOutlined />}
                      onClick={() => handleEditAttribute(attr)}
                      disabled={!isAdmin}
                    >
                      Edit
                    </Button>
                    <Popconfirm
                      title="Delete Attribute"
                      description="This will delete all associated values. Continue?"
                      onConfirm={() => handleDeleteAttribute(attr.id)}
                      okText="Yes"
                      cancelText="No"
                      okButtonProps={{ danger: true }}
                      disabled={!isAdmin}
                    >
                      <Button
                        type="link"
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        disabled={!isAdmin}
                      >
                        Delete
                      </Button>
                    </Popconfirm>
                  </Space>
                </div>
              }
            >
              <div className="attribute-values">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Title level={5} style={{ margin: 0 }}>Allowed Values:</Title>
                  <Button
                    type="dashed"
                    size="small"
                    icon={<PlusOutlined />}
                    onClick={() => handleAddValue(attr)}
                    disabled={!isAdmin}
                  >
                    Add Value
                  </Button>
                </div>
                
                {attr.allowedValues && attr.allowedValues.length > 0 ? (
                  <div className="values-grid">
                    {attr.allowedValues.map((value) => (
                      <Card
                        key={value.id}
                        size="small"
                        className="value-card"
                        hoverable
                        extra={
                          <Popconfirm
                            title="Delete Value"
                            onConfirm={() => handleDeleteValue(attr.id, value.id)}
                            okText="Yes"
                            cancelText="No"
                            okButtonProps={{ danger: true, size: 'small' }}
                            disabled={!isAdmin}
                          >
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              disabled={!isAdmin}
                            />
                          </Popconfirm>
                        }
                      >
                        <Space direction="vertical" size={4}>
                          <Space>
                            <TagOutlined style={{ color: '#52c41a' }} />
                            <Text strong>{value.fullForm}</Text>
                          </Space>
                          <Text type="secondary" code>{value.shortForm}</Text>
                        </Space>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Empty
                    description="No allowed values yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            </Panel>
          ))}
        </Collapse>
      </Card>

      {/* Attribute Modal */}
      <Modal
        title={editingAttribute ? 'Edit Attribute' : 'Create Attribute'}
        open={isAttrModalOpen}
        onOk={handleAttrModalOk}
        onCancel={() => setIsAttrModalOpen(false)}
        confirmLoading={createAttrMutation.isPending || updateAttrMutation.isPending}
        width={600}
      >
        <Form
          form={attrForm}
          layout="vertical"
          initialValues={{ displayOrder: 0, isActive: true, type: 'TEXT' }}
        >
          <Form.Item
            name="key"
            label="Key"
            rules={[
              { required: true, message: 'Please enter attribute key' },
              { max: 100, message: 'Key must be less than 100 characters' },
              { pattern: /^[A-Z0-9_]+$/, message: 'Only uppercase letters, numbers, and underscores' },
            ]}
          >
            <Input 
              placeholder="e.g., FAB_COMPOSITION, COLOR" 
              onChange={(e) => {
                // Auto-convert to uppercase
                const uppercaseValue = e.target.value.toUpperCase();
                attrForm.setFieldValue('key', uppercaseValue);
              }}
            />
          </Form.Item>

          <Form.Item
            name="label"
            label="Label"
            rules={[
              { required: true, message: 'Please enter attribute label' },
              { max: 200, message: 'Label must be less than 200 characters' },
            ]}
          >
            <Input placeholder="e.g., Fabric Composition, Color" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select>
              <Select.Option value="TEXT">TEXT</Select.Option>
              <Select.Option value="SELECT">SELECT</Select.Option>
              <Select.Option value="NUMBER">NUMBER</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <Input.TextArea rows={2} placeholder="Optional description..." />
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

      {/* Add Value Modal */}
      <Modal
        title={`Add Value to ${selectedAttribute?.label || ''}`}
        open={isValueModalOpen}
        onOk={handleValueModalOk}
        onCancel={() => setIsValueModalOpen(false)}
        confirmLoading={addValueMutation.isPending}
      >
        <Form
          form={valueForm}
          layout="vertical"
          initialValues={{ displayOrder: 0, isActive: true }}
        >
          <Form.Item
            name="shortForm"
            label="Short Form"
            rules={[
              { required: true, message: 'Please enter short form' },
              { max: 100, message: 'Must be less than 100 characters' },
            ]}
          >
            <Input placeholder="e.g., COTT, POLY" />
          </Form.Item>

          <Form.Item
            name="fullForm"
            label="Full Form"
            rules={[
              { required: true, message: 'Please enter full form' },
              { max: 200, message: 'Must be less than 200 characters' },
            ]}
          >
            <Input placeholder="e.g., Cotton, Polyester" />
          </Form.Item>

          <Form.Item
            name="displayOrder"
            label="Display Order"
            rules={[{ required: true }]}
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
