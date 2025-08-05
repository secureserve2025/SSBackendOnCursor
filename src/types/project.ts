// TypeScript interfaces for the Projects system
// These interfaces match the database schema defined in projects_schema.sql

export interface Project {
  id: string;
  project_id: string; // Auto-generated V-prefixed ID (e.g., V1001)
  client_id: string; // References client_profiles.user_id
  freelancer_id: string; // References freelancer_profiles.freelancer_id
  project_category: string; // Default: "Video Production"
  project_name: string; // 3-20 characters
  project_requirement: string; // Max 200 characters
  desired_completion_date: string; // Date in ISO format
  project_status: 'Draft' | 'Active' | 'In Progress' | 'Completed' | 'Cancelled';
  created_at: string;
  updated_at: string;
}

export interface ProjectFile {
  id: string;
  project_id: string; // References projects.id
  file_name: string;
  file_path: string; // Supabase Storage path
  file_size: number; // Size in bytes
  file_type: string; // MIME type
  storage_bucket: string; // Default: 'project-files'
  uploaded_at: string;
  created_at: string;
}

export interface Deliverable {
  id: string;
  project_id: string; // References projects.id
  deliverable_text: string; // Max 200 characters
  deliverable_order: number; // To maintain order
  created_at: string;
}

export interface ProjectWithDetails {
  project_data: Project;
  files_data: ProjectFile[] | null;
  deliverables_data: Deliverable[] | null;
}

export interface CreateProjectData {
  client_id: string;
  freelancer_id: string;
  project_category?: string; // Optional, defaults to "Video Production"
  project_name: string;
  project_requirement: string;
  desired_completion_date: string;
  files?: File[]; // Optional files to upload
  deliverables?: string[]; // Optional array of deliverable texts
}

export interface ProjectSummary {
  id: string;
  project_id: string;
  project_name: string;
  project_category: string;
  project_status: string;
  desired_completion_date: string;
  client_name: string;
  freelancer_name: string;
  file_count: number;
  deliverable_count: number;
  created_at: string;
}

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  maxFiles: 1,
  maxFileSize: 5 * 1024 * 1024, // 5MB in bytes
  allowedTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['.pdf', '.doc', '.docx']
} as const;

// Project validation rules
export const PROJECT_VALIDATION = {
  projectName: {
    minLength: 3,
    maxLength: 20
  },
  projectRequirement: {
    maxLength: 200
  },
  deliverables: {
    maxItems: 15,
    maxLength: 200
  },
  completionDate: {
    minDaysFromNow: 1 // Minimum tomorrow
  }
} as const;

// Project status options
export const PROJECT_STATUS_OPTIONS = [
  'Draft',
  'Active', 
  'In Progress',
  'Completed',
  'Cancelled'
] as const;

// Project category options (currently only Video Production enabled)
export const PROJECT_CATEGORY_OPTIONS = [
  'Video Production'
  // Future categories can be added here
] as const; 

// Project Workflow Status
export const PROJECT_WORKFLOW_STATUS = {
  PROJECT_CREATED: 'Project Created',
  CHECKLIST_SENT_TO_FREELANCER: 'Checklist Sent to Freelancer',
  ASSIGNED_TO_FREELANCER: 'Assigned to Freelancer',
  CHECKLIST_SIGNED_OFF: 'Checklist Signed off',
  FUND_SECURED: 'Fund Secured',
  PRODUCTION_IN_PROGRESS: 'Production in Progress',
  AI_VERIFIED: 'AI Verified',
  UNDER_MANUAL_REVISION: 'Under Manual Revision',
  SUCCESSFULLY_CLOSED: 'Successfully Closed',
  PRODUCT_REJECTED: 'Product Rejected'
} as const;

export type ProjectWorkflowStatus = typeof PROJECT_WORKFLOW_STATUS[keyof typeof PROJECT_WORKFLOW_STATUS];

// Work Product Interface
export interface WorkProduct {
  id: string;
  project_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  storage_bucket: string;
  video_duration?: number;
  video_resolution?: string;
  video_format?: string;
  upload_status: 'Uploading' | 'Uploaded' | 'Failed';
  created_at: string;
  updated_at: string;
}

// Verification Report Interface
export interface VerificationReport {
  id: string;
  project_id: string;
  report_title: string;
  report_content: string;
  report_type: 'AI Verification' | 'Manual Review' | 'Quality Check';
  verification_status: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  verified_by?: string;
  verification_score?: number;
  verification_notes?: string;
  file_path?: string;
  file_size?: number;
  file_type?: string;
  storage_bucket: string;
  created_at: string;
  updated_at: string;
}

// Extended Project Interface with Workflow Status
export interface ProjectWithWorkflow extends Project {
  project_status_workflow: ProjectWorkflowStatus;
}

// Project with All Details Interface
export interface ProjectWithAllDetails {
  project_data: ProjectWithWorkflow;
  files_data: ProjectFile[];
  deliverables_data: Deliverable[];
  work_products_data: WorkProduct[];
  verification_reports_data: VerificationReport[];
}

// Work Product Upload Data
export interface WorkProductUploadData {
  duration?: number;
  resolution?: string;
  format?: string;
}

// Verification Report Creation Data
export interface VerificationReportData {
  title: string;
  content: string;
  type?: 'AI Verification' | 'Manual Review' | 'Quality Check';
  status?: 'Pending' | 'In Progress' | 'Completed' | 'Failed';
  verifiedBy?: string;
  score?: number;
  notes?: string;
} 