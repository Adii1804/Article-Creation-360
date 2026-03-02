// Base types used across the application
export type Department = 'KIDS' | 'MENS' | 'LADIES';
export type AttributeType = 'select' | 'text' | 'number' | 'boolean';
export type ExtractionStatus = 'Pending' | 'Queued' | 'Extracting' | 'Processing' | 'Done' | 'Error';
export type ModelType = 
  | 'gpt-4o'              // Latest GPT-4 with vision (most capable)
  | 'gpt-4-vision-preview' // Backup vision model
  | 'gpt-4-turbo'         // Fast text-only model for prompts
  | 'gpt-3.5-turbo';  

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
