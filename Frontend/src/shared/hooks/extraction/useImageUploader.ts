import { useCallback, useState } from "react";
import { useImageExtraction } from "./useImageExtraction";
import type { SchemaItem } from "../../types/extraction/ExtractionTypes";

export const useImageUploader = () => {
  const {
    extractedRows,
    isExtracting,
    progress,
    addImages,
    extractAllPending,
    extractImageAttributes, // ✅ ADD THIS LINE
    removeRow,
    clearAll,
    updateRowAttribute,
  } = useImageExtraction();

  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);

  const stats = {
    total: extractedRows.length,
    done: extractedRows.filter((r) => r.status === "Done").length,
    pending: extractedRows.filter((r) => r.status === "Pending").length,
    extracting: extractedRows.filter((r) => r.status === "Extracting").length,
    error: extractedRows.filter((r) => r.status === "Error").length,
    successRate:
      extractedRows.length > 0
        ? (extractedRows.filter((r) => r.status === "Done").length / extractedRows.length) * 100
        : 0,
  };

  const handleBeforeUpload = useCallback(
    async (files: File[]) => {
      await addImages(files);
    },
    [addImages]
  );

  // ✅ Fix: Use proper SchemaItem[] type instead of any[]
  const handleExtractAll = useCallback((schema: SchemaItem[]) => {
    if (schema.length > 0) {
      extractAllPending(schema);
    }
  }, [extractAllPending]);

  const handleAttributeChange = useCallback(
    (rowId: string, attributeKey: string, value: string | number | null) => {
      updateRowAttribute(rowId, attributeKey, value);
    },
    [updateRowAttribute]
  );

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      removeRow(rowId);
    },
    [removeRow]
  );

  // ✅ Fix: Remove extractSingleImage from dependencies (it's not a dependency)
  const handleReExtract = useCallback((rowId: string, schema: SchemaItem[]) => {
    const row = extractedRows.find(r => r.id === rowId);
    if (row && schema.length > 0) {
      extractImageAttributes(row, schema);
    }
  }, [extractedRows, extractImageAttributes]); // ✅ This is fine since extractImageAttributes comes from useImageExtraction

  const handleAddToSchema = useCallback((attributeKey: string, value: string) => {
    // Add to schema logic - for future enhancement
    console.log('Add to schema:', attributeKey, value);
  }, []);

  // ✅ Fix: Use proper type instead of any
  const handleBulkEdit = useCallback((selectedKeys: string[], updates: Record<string, unknown>) => {
    selectedKeys.forEach(rowId => {
      Object.entries(updates).forEach(([key, value]) => {
        updateRowAttribute(rowId, key, value as string | number | null);
      });
    });
  }, [updateRowAttribute]);

  return {
    extractedRows,
    isExtracting,
    progress,
    selectedRowKeys,
    setSelectedRowKeys,
    stats,
    handleBeforeUpload,
    handleExtractAll,
    handleAttributeChange,
    handleDeleteRow,
    handleReExtract,
    handleAddToSchema,
    handleBulkEdit,
    handleClearAll: clearAll,
    // ✅ Don't return extractSingleImage here since it's internal to useImageExtraction
  };
};
