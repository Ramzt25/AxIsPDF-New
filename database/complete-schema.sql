-- ===================================================================
-- TeamBeam Construction Platform - Complete Database Schema
-- ===================================================================
-- This schema provides a comprehensive foundation for a construction
-- management platform with real-time collaboration, document management,
-- AI integration, and future-ready features.
-- ===================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ===================================================================
-- ENUMS AND CUSTOM TYPES
-- ===================================================================

-- User roles and permissions
CREATE TYPE user_role AS ENUM (
    'super_admin',
    'admin', 
    'project_manager',
    'field_engineer',
    'architect',
    'contractor',
    'subcontractor',
    'inspector',
    'client',
    'guest'
);

-- User status for real-time collaboration
CREATE TYPE user_status AS ENUM (
    'online',
    'idle', 
    'busy',
    'away',
    'offline'
);

-- Project phases and statuses
CREATE TYPE project_status AS ENUM (
    'planning',
    'design',
    'bidding',
    'preconstruction',
    'construction',
    'inspection',
    'closeout',
    'completed',
    'on_hold',
    'cancelled'
);

-- Document types and statuses
CREATE TYPE document_type AS ENUM (
    'architectural',
    'structural',
    'mechanical',
    'electrical',
    'plumbing',
    'fire_safety',
    'civil',
    'landscape',
    'specifications',
    'contract',
    'permit',
    'inspection_report',
    'change_order',
    'rfi',
    'submittal',
    'photo',
    'video',
    'other'
);

CREATE TYPE document_status AS ENUM (
    'draft',
    'under_review',
    'approved',
    'rejected',
    'superseded',
    'archived'
);

-- Markup and annotation types
CREATE TYPE markup_type AS ENUM (
    'comment',
    'highlight',
    'stamp',
    'measurement',
    'arrow',
    'rectangle',
    'circle',
    'freehand',
    'text',
    'photo',
    'audio',
    'video'
);

-- Issue and RFI statuses
CREATE TYPE issue_status AS ENUM (
    'open',
    'in_progress',
    'pending_review',
    'resolved',
    'closed',
    'cancelled'
);

CREATE TYPE issue_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical',
    'emergency'
);

-- Meeting types
CREATE TYPE meeting_type AS ENUM (
    'standup',
    'planning',
    'review',
    'inspection',
    'client_meeting',
    'team_meeting',
    'training',
    'emergency'
);

-- Notification types
CREATE TYPE notification_type AS ENUM (
    'mention',
    'assignment',
    'due_date',
    'approval_required',
    'document_updated',
    'message',
    'meeting_reminder',
    'issue_created',
    'issue_updated',
    'ai_detection',
    'system'
);

-- Activity types for audit logs
CREATE TYPE activity_type AS ENUM (
    'create',
    'update',
    'delete',
    'view',
    'download',
    'upload',
    'share',
    'comment',
    'approve',
    'reject',
    'assign',
    'complete',
    'archive',
    'restore',
    'login',
    'logout'
);

-- ===================================================================
-- STORAGE BUCKETS
-- ===================================================================

-- Create storage buckets for different file types
INSERT INTO storage.buckets (id, name, public) VALUES
    ('documents', 'documents', false),
    ('images', 'images', false),
    ('videos', 'videos', false),
    ('avatars', 'avatars', true),
    ('thumbnails', 'thumbnails', true),
    ('exports', 'exports', false),
    ('templates', 'templates', false),
    ('temp', 'temp', false);

-- ===================================================================
-- CORE TABLES
-- ===================================================================

-- Organizations table (for multi-tenancy)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    logo_url TEXT,
    website TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    address JSONB,
    settings JSONB DEFAULT '{}',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table with comprehensive profile information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200),
    avatar_url TEXT,
    role user_role DEFAULT 'guest',
    status user_status DEFAULT 'offline',
    phone VARCHAR(50),
    title VARCHAR(100),
    department VARCHAR(100),
    bio TEXT,
    skills TEXT[],
    certifications JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    email_verified_at TIMESTAMP WITH TIME ZONE,
    phone_verified_at TIMESTAMP WITH TIME ZONE,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret TEXT,
    recovery_codes TEXT[],
    login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    terms_accepted_at TIMESTAMP WITH TIME ZONE,
    privacy_accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table with comprehensive project management
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    project_number VARCHAR(100),
    location JSONB,
    coordinates GEOMETRY(POINT, 4326),
    status project_status DEFAULT 'planning',
    priority issue_priority DEFAULT 'medium',
    budget DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'USD',
    start_date DATE,
    estimated_end_date DATE,
    actual_end_date DATE,
    project_manager_id UUID REFERENCES users(id),
    client_contact_id UUID REFERENCES users(id),
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    archived_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Project members with roles and permissions
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    permissions JSONB DEFAULT '{}',
    hourly_rate DECIMAL(10,2),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invited_by UUID REFERENCES users(id),
    invitation_accepted_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(project_id, user_id)
);

-- Document management with versioning
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES documents(id),
    name VARCHAR(500) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    original_filename VARCHAR(500),
    file_size BIGINT,
    mime_type VARCHAR(255),
    file_hash VARCHAR(64),
    document_type document_type DEFAULT 'other',
    status document_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    version_notes TEXT,
    page_count INTEGER,
    dimensions JSONB,
    metadata JSONB DEFAULT '{}',
    tags TEXT[],
    ocr_text TEXT,
    ai_analysis JSONB,
    thumbnail_url TEXT,
    preview_url TEXT,
    uploaded_by UUID REFERENCES users(id),
    reviewed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document sheets for multi-page documents
CREATE TABLE document_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    sheet_number INTEGER NOT NULL,
    name VARCHAR(255),
    description TEXT,
    width INTEGER,
    height INTEGER,
    dpi INTEGER DEFAULT 150,
    thumbnail_url TEXT,
    render_url TEXT,
    ocr_text TEXT,
    ai_analysis JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(document_id, sheet_number)
);

-- Markups and annotations
CREATE TABLE markups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    sheet_id UUID REFERENCES document_sheets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    type markup_type NOT NULL,
    data JSONB NOT NULL,
    style JSONB DEFAULT '{}',
    content TEXT,
    x DECIMAL(10,4),
    y DECIMAL(10,4),
    width DECIMAL(10,4),
    height DECIMAL(10,4),
    rotation DECIMAL(6,2) DEFAULT 0,
    z_index INTEGER DEFAULT 0,
    locked BOOLEAN DEFAULT false,
    visible BOOLEAN DEFAULT true,
    reply_to UUID REFERENCES markups(id),
    thread_id UUID,
    resolved BOOLEAN DEFAULT false,
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RFIs (Request for Information)
CREATE TABLE rfis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id),
    rfi_number VARCHAR(100),
    subject VARCHAR(500) NOT NULL,
    description TEXT,
    question TEXT NOT NULL,
    response TEXT,
    status issue_status DEFAULT 'open',
    priority issue_priority DEFAULT 'medium',
    due_date TIMESTAMP WITH TIME ZONE,
    submitted_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    responded_by UUID REFERENCES users(id),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Issues and deficiencies
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id),
    markup_id UUID REFERENCES markups(id),
    issue_number VARCHAR(100),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status issue_status DEFAULT 'open',
    priority issue_priority DEFAULT 'medium',
    category VARCHAR(100),
    location VARCHAR(255),
    trade VARCHAR(100),
    cost_impact DECIMAL(12,2),
    schedule_impact INTEGER, -- days
    due_date TIMESTAMP WITH TIME ZONE,
    reported_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    resolved_by UUID REFERENCES users(id),
    reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    verified_at TIMESTAMP WITH TIME ZONE,
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks and assignments
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES tasks(id),
    rfi_id UUID REFERENCES rfis(id),
    issue_id UUID REFERENCES issues(id),
    document_id UUID REFERENCES documents(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status issue_status DEFAULT 'open',
    priority issue_priority DEFAULT 'medium',
    estimated_hours DECIMAL(8,2),
    actual_hours DECIMAL(8,2),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    due_date TIMESTAMP WITH TIME ZONE,
    start_date TIMESTAMP WITH TIME ZONE,
    completion_date TIMESTAMP WITH TIME ZONE,
    assigned_to UUID REFERENCES users(id),
    created_by UUID REFERENCES users(id),
    dependencies UUID[] DEFAULT '{}',
    tags TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meetings and scheduling
CREATE TABLE meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    type meeting_type DEFAULT 'team_meeting',
    location VARCHAR(255),
    virtual_link TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    agenda JSONB DEFAULT '[]',
    notes TEXT,
    recording_url TEXT,
    organizer_id UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'scheduled',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting attendees
CREATE TABLE meeting_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    role VARCHAR(50) DEFAULT 'attendee',
    status VARCHAR(50) DEFAULT 'invited',
    response VARCHAR(50), -- accepted, declined, tentative
    joined_at TIMESTAMP WITH TIME ZONE,
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(meeting_id, user_id)
);

-- Real-time collaboration sessions
CREATE TABLE collaboration_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    sheet_id UUID REFERENCES document_sheets(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    active_users JSONB DEFAULT '[]',
    viewport JSONB,
    cursor_positions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- User sessions for collaboration
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    collaboration_session_id UUID REFERENCES collaboration_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    socket_id VARCHAR(255),
    cursor_position JSONB,
    viewport JSONB,
    permissions JSONB DEFAULT '{}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(collaboration_session_id, user_id)
);

-- Chat and messaging
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    thread_id UUID,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    reply_to UUID REFERENCES chat_messages(id),
    mentions UUID[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    reactions JSONB DEFAULT '{}',
    edited_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications system
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs for audit trail
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    organization_id UUID REFERENCES organizations(id),
    project_id UUID REFERENCES projects(id),
    target_type VARCHAR(100),
    target_id UUID,
    action activity_type NOT NULL,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File uploads tracking
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    project_id UUID REFERENCES projects(id),
    filename VARCHAR(500) NOT NULL,
    original_name VARCHAR(500),
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(255),
    file_hash VARCHAR(64),
    upload_status VARCHAR(50) DEFAULT 'uploading',
    processing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI processing results
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    sheet_id UUID REFERENCES document_sheets(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL,
    model_version VARCHAR(100),
    input_data JSONB,
    results JSONB NOT NULL,
    confidence_score DECIMAL(5,4),
    processing_time INTEGER, -- milliseconds
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    status VARCHAR(50) DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System integrations and webhooks
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    config JSONB NOT NULL,
    credentials JSONB,
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_frequency INTEGER, -- minutes
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Webhook events
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_attempt_at TIMESTAMP WITH TIME ZONE,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document templates
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    template_data JSONB NOT NULL,
    preview_url TEXT,
    is_public BOOLEAN DEFAULT false,
    usage_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Saved filters and views
CREATE TABLE saved_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    view_type VARCHAR(100) NOT NULL,
    filters JSONB NOT NULL,
    sort_options JSONB,
    is_public BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- User indexes
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_seen ON users(last_seen_at);

-- Project indexes
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_manager ON projects(project_manager_id);
CREATE INDEX idx_projects_location ON projects USING GIST(coordinates);
CREATE INDEX idx_projects_dates ON projects(start_date, estimated_end_date);

-- Project members indexes
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_project_members_role ON project_members(role);

-- Document indexes
CREATE INDEX idx_documents_project_id ON documents(project_id);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_file_hash ON documents(file_hash);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_search ON documents USING GIN(to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(ocr_text, '')));

-- Document sheets indexes
CREATE INDEX idx_document_sheets_document_id ON document_sheets(document_id);
CREATE INDEX idx_document_sheets_number ON document_sheets(document_id, sheet_number);

-- Markup indexes
CREATE INDEX idx_markups_document_id ON markups(document_id);
CREATE INDEX idx_markups_sheet_id ON markups(sheet_id);
CREATE INDEX idx_markups_user_id ON markups(user_id);
CREATE INDEX idx_markups_type ON markups(type);
CREATE INDEX idx_markups_thread ON markups(thread_id);
CREATE INDEX idx_markups_resolved ON markups(resolved);

-- RFI indexes
CREATE INDEX idx_rfis_project_id ON rfis(project_id);
CREATE INDEX idx_rfis_status ON rfis(status);
CREATE INDEX idx_rfis_priority ON rfis(priority);
CREATE INDEX idx_rfis_assigned_to ON rfis(assigned_to);
CREATE INDEX idx_rfis_due_date ON rfis(due_date);

-- Issue indexes
CREATE INDEX idx_issues_project_id ON issues(project_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_priority ON issues(priority);
CREATE INDEX idx_issues_assigned_to ON issues(assigned_to);
CREATE INDEX idx_issues_category ON issues(category);

-- Task indexes
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);

-- Meeting indexes
CREATE INDEX idx_meetings_project_id ON meetings(project_id);
CREATE INDEX idx_meetings_organizer ON meetings(organizer_id);
CREATE INDEX idx_meetings_start_time ON meetings(start_time);
CREATE INDEX idx_meetings_type ON meetings(type);

-- Collaboration indexes
CREATE INDEX idx_collaboration_sessions_document ON collaboration_sessions(document_id);
CREATE INDEX idx_collaboration_sessions_sheet ON collaboration_sessions(sheet_id);
CREATE INDEX idx_collaboration_sessions_token ON collaboration_sessions(session_token);
CREATE INDEX idx_collaboration_sessions_expires ON collaboration_sessions(expires_at);

-- Chat indexes
CREATE INDEX idx_chat_messages_project_id ON chat_messages(project_id);
CREATE INDEX idx_chat_messages_thread ON chat_messages(thread_id);
CREATE INDEX idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_mentions ON chat_messages USING GIN(mentions);

-- Notification indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read_at);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- Activity log indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_project_id ON activity_logs(project_id);
CREATE INDEX idx_activity_logs_target ON activity_logs(target_type, target_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);

-- AI analysis indexes
CREATE INDEX idx_ai_analyses_document ON ai_analyses(document_id);
CREATE INDEX idx_ai_analyses_sheet ON ai_analyses(sheet_id);
CREATE INDEX idx_ai_analyses_type ON ai_analyses(analysis_type);
CREATE INDEX idx_ai_analyses_status ON ai_analyses(status);

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE markups ENABLE ROW LEVEL SECURITY;
ALTER TABLE rfis ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Super admins can manage organizations" ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'super_admin'
        )
    );

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view org members" ON users
    FOR SELECT USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage org users" ON users
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Projects policies
CREATE POLICY "Project members can view projects" ON projects
    FOR SELECT USING (
        id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project managers can manage projects" ON projects
    FOR ALL USING (
        project_manager_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = projects.id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'project_manager')
        )
    );

-- Project members policies
CREATE POLICY "Project members can view project membership" ON project_members
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project managers can manage membership" ON project_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM project_members pm
            JOIN projects p ON pm.project_id = p.id
            WHERE pm.user_id = auth.uid() 
            AND pm.project_id = project_members.project_id
            AND (pm.role IN ('admin', 'project_manager') OR p.project_manager_id = auth.uid())
        )
    );

-- Documents policies
CREATE POLICY "Project members can view documents" ON documents
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can upload documents" ON documents
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

CREATE POLICY "Document owners and managers can update documents" ON documents
    FOR UPDATE USING (
        uploaded_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = documents.project_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'project_manager')
        )
    );

-- Document sheets policies
CREATE POLICY "Project members can view document sheets" ON document_sheets
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN project_members pm ON d.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Markups policies
CREATE POLICY "Project members can view markups" ON markups
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN project_members pm ON d.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create markups" ON markups
    FOR INSERT WITH CHECK (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN project_members pm ON d.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Markup owners can update their markups" ON markups
    FOR UPDATE USING (user_id = auth.uid());

-- RFIs policies
CREATE POLICY "Project members can view RFIs" ON rfis
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create RFIs" ON rfis
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        AND submitted_by = auth.uid()
    );

CREATE POLICY "RFI stakeholders can update RFIs" ON rfis
    FOR UPDATE USING (
        submitted_by = auth.uid() 
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = rfis.project_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'project_manager')
        )
    );

-- Issues policies (similar to RFIs)
CREATE POLICY "Project members can view issues" ON issues
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create issues" ON issues
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        AND reported_by = auth.uid()
    );

CREATE POLICY "Issue stakeholders can update issues" ON issues
    FOR UPDATE USING (
        reported_by = auth.uid() 
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = issues.project_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'project_manager')
        )
    );

-- Tasks policies
CREATE POLICY "Project members can view tasks" ON tasks
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can create tasks" ON tasks
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Task stakeholders can update tasks" ON tasks
    FOR UPDATE USING (
        created_by = auth.uid() 
        OR assigned_to = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = tasks.project_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'project_manager')
        )
    );

-- Meetings policies
CREATE POLICY "Project members can view meetings" ON meetings
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Meeting organizers can manage meetings" ON meetings
    FOR ALL USING (
        organizer_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM project_members 
            WHERE project_id = meetings.project_id 
            AND user_id = auth.uid() 
            AND role IN ('admin', 'project_manager')
        )
    );

-- Meeting attendees policies
CREATE POLICY "Attendees can view meeting attendance" ON meeting_attendees
    FOR SELECT USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM meetings m
            JOIN project_members pm ON m.project_id = pm.project_id
            WHERE m.id = meeting_attendees.meeting_id
            AND pm.user_id = auth.uid()
        )
    );

-- Collaboration sessions policies
CREATE POLICY "Project members can view collaboration sessions" ON collaboration_sessions
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN project_members pm ON d.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own sessions" ON user_sessions
    FOR ALL USING (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY "Project members can view chat messages" ON chat_messages
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can send messages" ON chat_messages
    FOR INSERT WITH CHECK (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update their own messages" ON chat_messages
    FOR UPDATE USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- Activity logs policies (read-only for users)
CREATE POLICY "Project members can view project activity" ON activity_logs
    FOR SELECT USING (
        project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
        OR user_id = auth.uid()
    );

-- File uploads policies
CREATE POLICY "Users can view their own uploads" ON file_uploads
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own uploads" ON file_uploads
    FOR ALL USING (user_id = auth.uid());

-- AI analyses policies
CREATE POLICY "Project members can view AI analyses" ON ai_analyses
    FOR SELECT USING (
        document_id IN (
            SELECT d.id FROM documents d
            JOIN project_members pm ON d.project_id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Integrations policies
CREATE POLICY "Org admins can manage integrations" ON integrations
    FOR ALL USING (
        organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin')
        )
    );

-- Document templates policies
CREATE POLICY "Org members can view templates" ON document_templates
    FOR SELECT USING (
        is_public = true
        OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    );

CREATE POLICY "Template creators can manage their templates" ON document_templates
    FOR ALL USING (created_by = auth.uid());

-- Saved views policies
CREATE POLICY "Users can manage their own views" ON saved_views
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view public views in their projects" ON saved_views
    FOR SELECT USING (
        is_public = true
        AND project_id IN (
            SELECT project_id FROM project_members 
            WHERE user_id = auth.uid()
        )
    );

-- ===================================================================
-- STORAGE POLICIES
-- ===================================================================

-- Documents bucket policies
CREATE POLICY "Project members can view documents" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] IN (
            SELECT p.id::text FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

CREATE POLICY "Project members can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents'
        AND (storage.foldername(name))[1] IN (
            SELECT p.id::text FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Images bucket policies
CREATE POLICY "Project members can view images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'images'
        AND (storage.foldername(name))[1] IN (
            SELECT p.id::text FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Videos bucket policies
CREATE POLICY "Project members can view videos" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'videos'
        AND (storage.foldername(name))[1] IN (
            SELECT p.id::text FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = auth.uid()
        )
    );

-- Avatars bucket policies (public read)
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Thumbnails bucket policies (public read)
CREATE POLICY "Anyone can view thumbnails" ON storage.objects
    FOR SELECT USING (bucket_id = 'thumbnails');

-- Exports bucket policies
CREATE POLICY "Users can view their own exports" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'exports'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Templates bucket policies
CREATE POLICY "Org members can view templates" ON storage.objects
    FOR SELECT USING (bucket_id = 'templates');

-- Temp bucket policies
CREATE POLICY "Users can manage temp files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'temp'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ===================================================================
-- TRIGGERS AND FUNCTIONS
-- ===================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_markups_updated_at BEFORE UPDATE ON markups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rfis_updated_at BEFORE UPDATE ON rfis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaboration_sessions_updated_at BEFORE UPDATE ON collaboration_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_views_updated_at BEFORE UPDATE ON saved_views
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO activity_logs (
        user_id,
        target_type,
        target_id,
        action,
        description,
        metadata
    ) VALUES (
        auth.uid(),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE TG_OP
            WHEN 'INSERT' THEN 'create'
            WHEN 'UPDATE' THEN 'update'
            WHEN 'DELETE' THEN 'delete'
        END,
        CASE TG_OP
            WHEN 'INSERT' THEN 'Created ' || TG_TABLE_NAME
            WHEN 'UPDATE' THEN 'Updated ' || TG_TABLE_NAME
            WHEN 'DELETE' THEN 'Deleted ' || TG_TABLE_NAME
        END,
        CASE TG_OP
            WHEN 'DELETE' THEN to_jsonb(OLD)
            ELSE to_jsonb(NEW)
        END
    );
    
    RETURN CASE TG_OP
        WHEN 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ language 'plpgsql';

-- Apply activity logging to key tables
CREATE TRIGGER log_documents_activity AFTER INSERT OR UPDATE OR DELETE ON documents
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_markups_activity AFTER INSERT OR UPDATE OR DELETE ON markups
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_rfis_activity AFTER INSERT OR UPDATE OR DELETE ON rfis
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_issues_activity AFTER INSERT OR UPDATE OR DELETE ON issues
    FOR EACH ROW EXECUTE FUNCTION log_activity();

CREATE TRIGGER log_tasks_activity AFTER INSERT OR UPDATE OR DELETE ON tasks
    FOR EACH ROW EXECUTE FUNCTION log_activity();

-- Function to send notifications
CREATE OR REPLACE FUNCTION send_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title TEXT,
    p_message TEXT DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_action_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        data,
        action_url
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data,
        p_action_url
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ language 'plpgsql';

-- Function to clean up expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
    -- Clean up expired collaboration sessions
    DELETE FROM collaboration_sessions 
    WHERE expires_at < NOW();
    
    -- Clean up old temp files
    DELETE FROM file_uploads 
    WHERE upload_status = 'temporary' 
    AND expires_at < NOW();
    
    -- Clean up old activity logs (keep 1 year)
    DELETE FROM activity_logs 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Clean up processed webhook events (keep 30 days)
    DELETE FROM webhook_events 
    WHERE processed_at IS NOT NULL 
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$ language 'plpgsql';

-- Function to generate sequential numbers
CREATE OR REPLACE FUNCTION generate_sequence_number(
    p_project_id UUID,
    p_type TEXT,
    p_prefix TEXT DEFAULT ''
)
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    sequence_name TEXT;
BEGIN
    sequence_name := 'seq_' || p_type || '_' || replace(p_project_id::text, '-', '_');
    
    -- Create sequence if it doesn't exist
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS %I', sequence_name);
    
    -- Get next number
    EXECUTE format('SELECT nextval(%L)', sequence_name) INTO next_number;
    
    RETURN p_prefix || lpad(next_number::text, 4, '0');
END;
$$ language 'plpgsql';

-- ===================================================================
-- VIEWS FOR COMMON QUERIES
-- ===================================================================

-- View for project dashboard
CREATE VIEW project_dashboard AS
SELECT 
    p.id,
    p.name,
    p.status,
    p.start_date,
    p.estimated_end_date,
    COUNT(DISTINCT d.id) as document_count,
    COUNT(DISTINCT CASE WHEN r.status = 'open' THEN r.id END) as open_rfis,
    COUNT(DISTINCT CASE WHEN i.status = 'open' THEN i.id END) as open_issues,
    COUNT(DISTINCT CASE WHEN t.status = 'open' THEN t.id END) as open_tasks,
    COUNT(DISTINCT pm.user_id) as member_count
FROM projects p
LEFT JOIN documents d ON p.id = d.project_id AND d.archived_at IS NULL
LEFT JOIN rfis r ON p.id = r.project_id
LEFT JOIN issues i ON p.id = i.project_id
LEFT JOIN tasks t ON p.id = t.project_id
LEFT JOIN project_members pm ON p.id = pm.project_id
GROUP BY p.id, p.name, p.status, p.start_date, p.estimated_end_date;

-- View for user activity feed
CREATE VIEW user_activity_feed AS
SELECT 
    al.id,
    al.action,
    al.description,
    al.created_at,
    al.target_type,
    al.target_id,
    u.first_name || ' ' || u.last_name as user_name,
    u.avatar_url,
    p.name as project_name,
    p.id as project_id
FROM activity_logs al
JOIN users u ON al.user_id = u.id
LEFT JOIN projects p ON al.project_id = p.id
ORDER BY al.created_at DESC;

-- View for document search
CREATE VIEW document_search AS
SELECT 
    d.id,
    d.project_id,
    d.name,
    d.description,
    d.document_type,
    d.status,
    d.created_at,
    d.updated_at,
    u.first_name || ' ' || u.last_name as uploaded_by_name,
    p.name as project_name,
    to_tsvector('english', d.name || ' ' || COALESCE(d.description, '') || ' ' || COALESCE(d.ocr_text, '')) as search_vector
FROM documents d
JOIN users u ON d.uploaded_by = u.id
JOIN projects p ON d.project_id = p.id
WHERE d.archived_at IS NULL;

-- ===================================================================
-- SAMPLE DATA FOR DEVELOPMENT
-- ===================================================================

-- Insert sample organization
INSERT INTO organizations (id, name, slug, settings) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'ACME Construction', 'acme-construction', '{"theme": "construction", "timezone": "America/New_York"}');

-- Insert sample users
INSERT INTO users (id, organization_id, email, first_name, last_name, role, status) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'sarah.chen@acme.construction', 'Sarah', 'Chen', 'project_manager', 'online'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'mike.rodriguez@acme.construction', 'Mike', 'Rodriguez', 'field_engineer', 'idle'),
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', 'chris.johnson@acme.construction', 'Chris', 'Johnson', 'contractor', 'offline'),
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440000', 'ai@teambeam.app', 'AI', 'Assistant', 'admin', 'online');

-- Insert sample project
INSERT INTO projects (id, organization_id, name, description, status, project_manager_id, created_by) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440000', 'Downtown Office Complex', 'Modern 12-story office building with retail ground floor', 'construction', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001');

-- Insert project members
INSERT INTO project_members (project_id, user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001', 'project_manager'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440002', 'field_engineer'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440003', 'contractor'),
('550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440004', 'admin');

-- ===================================================================
-- PERFORMANCE OPTIMIZATIONS
-- ===================================================================

-- Note: VACUUM cannot be run inside a transaction block
-- Run these commands manually after schema deployment if needed:
-- VACUUM ANALYZE;

-- Update table statistics (can be run in transaction)
ANALYZE;

-- ===================================================================
-- SCHEMA COMPLETE
-- ===================================================================
-- This schema provides a comprehensive foundation for:
-- - Multi-tenant construction project management
-- - Real-time collaboration and communication
-- - Document management with versioning
-- - Issue tracking and RFI management
-- - AI-powered analysis and insights
-- - Comprehensive audit trails
-- - Role-based access control
-- - Extensible integration system
-- - Future-ready architecture
-- ===================================================================