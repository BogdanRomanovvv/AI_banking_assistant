export enum LetterType {
    INFO_REQUEST = 'info_request',
    COMPLAINT = 'complaint',
    REGULATORY = 'regulatory',
    PARTNERSHIP = 'partnership',
    APPROVAL_REQUEST = 'approval_request',
    NOTIFICATION = 'notification',
    OTHER = 'other'
}

export enum LetterStatus {
    NEW = 'new',
    ANALYZING = 'analyzing',
    IN_PROGRESS = 'in_progress',
    DRAFT_READY = 'draft_ready',
    IN_APPROVAL = 'in_approval',
    APPROVED = 'approved',
    SENT = 'sent'
}

export enum FormalityLevel {
    STRICT_OFFICIAL = 'strict_official',
    CORPORATE = 'corporate',
    NEUTRAL = 'neutral',
    CLIENT_ORIENTED = 'client_oriented'
}

export enum UserRole {
    ADMIN = 'admin',
    OPERATOR = 'operator',
    LAWYER = 'lawyer',
    MARKETING = 'marketing'
}

// Auth types
export interface Token {
    access_token: string;
    token_type: string;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    role: UserRole;
}

// User types
export interface User {
    id: number;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    role: UserRole;
    is_active: boolean;
    created_at: string;
    updated_at?: string;
}

export interface UserCreate {
    username: string;
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    middle_name?: string;
    role: UserRole;
}

export interface UserUpdate {
    first_name?: string;
    last_name?: string;
    middle_name?: string;
    email?: string;
    role?: UserRole;
    is_active?: boolean;
}

// Letter types
export interface Classification {
    type: string;
    description: string;
}

export interface ExtractedEntities {
    request_summary?: string;
    sender_details?: string;
    legal_references?: string[];
    mentioned_documents?: string[];
    contact_info?: string;
}

export interface Risk {
    level: 'high' | 'medium' | 'low';
    description: string;
    recommendation?: string;
}

export interface ApprovalRoute {
    department: string;
    reason: string;
    check_points: string[];
}

export interface ApprovalComment {
    department: string;
    comment: string;
    approved: boolean;
    timestamp: string;
}

export interface DraftResponses {
    strict_official: string;
    corporate: string;
    client_oriented: string;
    brief_info: string;
}

export interface Letter {
    id: number;
    subject: string;
    body: string;
    sender_email?: string;
    sender_name?: string;
    letter_type?: LetterType;
    formality_level?: FormalityLevel;
    status: LetterStatus;
    priority: number;
    sla_hours?: number;
    classification_data?: Classification;
    extracted_entities?: ExtractedEntities;
    risks?: Risk[];
    required_departments?: string[];
    draft_responses?: DraftResponses;
    selected_response?: string;
    final_response?: string;
    approval_route?: ApprovalRoute[];
    current_approver?: string;
    approval_comments?: ApprovalComment[];
    reserved_by_user_id?: number;  // Новое поле для резервирования
    reserved_at?: string;  // Новое поле для резервирования
    created_at: string;
    updated_at?: string;
    deadline?: string;
}

export interface LetterCreate {
    subject: string;
    body: string;
    sender_email?: string;
    sender_name?: string;
}

export interface LetterUpdate {
    status?: LetterStatus;
    selected_response?: string;
    current_approver?: string;
}

export interface ApprovalCommentRequest {
    department: string;
    comment: string;
    approved: boolean;
}
