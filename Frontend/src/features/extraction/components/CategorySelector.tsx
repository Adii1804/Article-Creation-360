import React from 'react';
// Force HMR update
import { Select, Card, Typography, Tag, Button } from 'antd';
import { ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import type { CategoryConfig } from '../../../shared/types/category/CategoryTypes';
import { useCategorySelector } from '../../../shared/hooks/category/useCategorySelector';

const { Title, Text } = Typography;
const { Option } = Select;

interface CategorySelectorProps {
  onCategorySelect: (category: CategoryConfig | null) => void; // ✅ FIX: Allow null
  selectedCategory?: CategoryConfig | null;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  onCategorySelect,
  selectedCategory
}) => {
  // ✅ FIX: Use the correct hook (only one implementation)
  const {
    selectedDepartment,
    selectedSubDepartment,
    departments,
    subDepartments,
    availableCategories,
    handleDepartmentChange,
    handleSubDepartmentChange,
    resetSelection,
    isComplete,
    isDepartmentsLoading,
    isSubDepartmentsLoading,
    isCategoriesLoading,
    userRole,
    restrictedDivision,
    restrictedSubDivision
  } = useCategorySelector();

  // Determine if fields should be disabled
  const isDivisionDisabled = userRole === 'CREATOR' && !!restrictedDivision;
  const isSubDivisionDisabled = userRole === 'CREATOR' && !!restrictedSubDivision;

  // ✅ Handle category selection properly with null check
  const handleCategorySelectInternal = (categoryCode: string) => {
    const category = availableCategories.find(c => c.category === categoryCode);
    if (category) {
      onCategorySelect(category);
    }
  };

  if (isComplete && selectedCategory) {
    return (
      <Card className="category-summary" style={{ borderRadius: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#FF6F61' }}>
              {selectedCategory.displayName}
            </Title>
            <Text type="secondary">
              {selectedCategory.department} → {selectedCategory.subDepartment}
            </Text>
            <div style={{ marginTop: 8 }}>
              <Tag color="blue" className="selection-badge">
                Category Selected
              </Tag>
            </div>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              resetSelection();
              onCategorySelect(null);
            }}
            className="btn-secondary"
            disabled={isDivisionDisabled} // Can't change category if division is locked? 
          // Actually, they can change the SPECIFIC category within their division/subdivision.
          // Reset selection will trigger the useEffect in useCategorySelector to re-select division/subdivision.
          >
            Change Category
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      title={
        <span style={{ color: '#FF6F61', fontWeight: 600 }}>
          <InfoCircleOutlined style={{ marginRight: 8 }} />
          Select Fashion Category
        </span>
      }
      className="category-selector"
      style={{ borderRadius: 12 }}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        {/* Division Selection */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            1. Choose Division
          </Text>
          <Select
            placeholder="Select division (Kids, Ladies, Mens)"
            value={selectedDepartment}
            onChange={handleDepartmentChange}
            style={{ width: '100%' }}
            size="large"
            allowClear={!isDivisionDisabled}
            loading={isDepartmentsLoading}
            disabled={isDivisionDisabled}
          >
            {departments.map(dept => (
              <Option key={dept} value={dept}>
                {dept}
              </Option>
            ))}
          </Select>
        </div>

        {/* Sub-Department Selection */}
        {(selectedDepartment || isDivisionDisabled) && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              2. Choose Sub-Division
            </Text>
            <Select
              placeholder={isSubDepartmentsLoading ? "Loading sub-departments..." : "Select sub-division"}
              value={selectedSubDepartment}
              onChange={handleSubDepartmentChange}
              style={{ width: '100%' }}
              size="large"
              allowClear={!isSubDivisionDisabled}
              loading={isSubDepartmentsLoading}
              disabled={isSubDepartmentsLoading || isSubDivisionDisabled}
            >
              {subDepartments.map(subDept => (
                <Option key={subDept} value={subDept}>
                  {subDept}
                </Option>
              ))}
            </Select>
          </div>
        )}

        {/* Category Selection */}
        {selectedDepartment && selectedSubDepartment && (
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              3. Choose Specific Category
            </Text>
            <Select
              placeholder={isCategoriesLoading ? "Loading categories..." : "Select category"}
              onChange={handleCategorySelectInternal}
              style={{ width: '100%' }}
              size="large"
              showSearch
              loading={isCategoriesLoading}
              disabled={isCategoriesLoading}
              filterOption={(input, option) =>
                option?.children?.toString().toLowerCase().includes(input.toLowerCase()) ?? false
              }
            >
              {availableCategories.map(category => {
                const enabledAttrs = Object.values(category.attributes || {}).filter(v => v === true).length;
                const totalAttrs = Object.keys(category.attributes || {}).length;
                return (
                  <Option key={category.category} value={category.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{category.displayName}</span>
                      <Tag color="blue" style={{ marginLeft: 8 }}>
                        {enabledAttrs} of {totalAttrs}
                      </Tag>
                    </div>
                  </Option>
                );
              })}
            </Select>
          </div>
        )}

        {availableCategories.length === 0 && selectedDepartment && selectedSubDepartment && (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <Text type="secondary">No categories available for this selection</Text>
          </div>
        )}
      </div>
    </Card>
  );
};
