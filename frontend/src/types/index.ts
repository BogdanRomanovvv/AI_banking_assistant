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
