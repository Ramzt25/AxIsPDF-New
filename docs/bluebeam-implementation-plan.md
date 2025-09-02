# TeamBeam Professional PDF Platform - Implementation Plan

## Executive Summary

This document outlines the implementation strategy for building a comprehensive Bluebeam competitor ("AxIs") with enhanced AI features and light Microsoft Teams integration. The platform aims to deliver professional-grade PDF markup, collaboration, and project management tools for the construction industry.

## 1. Feature Parity & Enhancement Matrix

### Core Bluebeam Features (Must Have)

| Feature Category | Bluebeam Capability | Our Implementation | Enhancement |
|------------------|--------------------|--------------------|-------------|
| **Tool Chest & Markups** | Custom tool sets; custom statuses | User/company tool sets; status models; sharing | AI Tool Wizard: auto-build from last 20 markups |
| **Markups List & Reports** | CSV/XML/PDF summaries | JSON/CSV/PDF exports + database views | Live BI cards + Teams filtering |
| **Measurement & Scale** | Calibrate; viewports; Dynamic Fill; Spaces; Legends | Two-point calibration; viewport awareness; live legends | Auto-calibrate from scale bars; CV-Fill for faint lines |
| **Compare/Overlay** | Diff clouds; color overlays | GPU-accelerated visual diff; semantic diff | AI Change Explain: "Door resized +1'-6"" |
| **Sets + Batch Link** | Sets, auto labels, batch linking | Smart set builder; regex/AI sheet parsing | Auto batch-link across revisions |
| **Slip Sheeting** | Batch/slip sheet preserve markups | Auto pairing by sheet number/date | Confidence scores + preview |
| **Studio vs Projects** | Real-time sessions vs DMS | Live collab sessions; project storage | Comment replay + Teams recap |
| **Excel Integration** | Quantity Link (Complete) | Export to CSV + optional Excel add-in | Live sync via webhook |

### Microsoft Teams Integration (Light Touch)

| Component | Implementation | Purpose |
|-----------|----------------|---------|
| **Message Posting** | Graph API chatMessage POST | Post activity updates to channels |
| **Webhooks** | Incoming webhooks + Adaptive Cards | Simple notifications with action buttons |
| **Message Extensions** | Link unfurling for AxIs URLs | Rich cards with sheet preview, status |
| **Tab Integration** | Read-only viewer with SSO | Embedded viewer in Teams tabs |
| **Change Notifications** | Webhooks for chat/channel activity | React to Teams activity |

## 2. Architecture Overview

### Frontend Stack
- **React + TypeScript** - Modern UI framework
- **PDF.js** - Vector-true PDF rendering
- **Canvas API** - Overlay markup rendering
- **WebSockets** - Real-time collaboration
- **Vite** - Fast development and building

### Backend Stack
- **Supabase** - Database, auth, real-time subscriptions
- **Node.js/Express** - API services
- **WebSocket Server** - Real-time collaboration
- **Bull Queue** - Background job processing
- **Sharp/ImageMagick** - Image processing

### AI/ML Services
- **OpenCV.js** - Computer vision for Dynamic Fill
- **Tesseract.js** - OCR for scale detection
- **OpenAI API** - AI explanations and insights
- **Custom ML Models** - Document comparison, symbol detection

### Integration Layer
- **Microsoft Graph API** - Teams integration
- **Webhooks** - External notifications
- **REST API** - Third-party integrations

## 3. Data Model (Supabase Schema)

### Core Tables

```sql
-- Projects and Documents
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  source TEXT, -- 'upload', 'teams', 'sharepoint'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  rev TEXT NOT NULL, -- 'A', 'B', 'C', etc.
  sheet_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sheets and Spatial Data
CREATE TABLE sheets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_version_id UUID NOT NULL REFERENCES document_versions(id) ON DELETE CASCADE,
  sheet_no TEXT NOT NULL,
  name TEXT,
  index_text TEXT, -- Searchable text content
  width NUMERIC,
  height NUMERIC,
  dpi NUMERIC DEFAULT 72,
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE viewports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  scale_ratio NUMERIC NOT NULL, -- pixels per unit
  units TEXT NOT NULL DEFAULT 'inches',
  locked BOOLEAN DEFAULT FALSE,
  calibration_points JSONB -- [{x, y, real_value}, ...]
);

CREATE TABLE spaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  polygon GEOMETRY(POLYGON) NOT NULL, -- PostGIS geometry
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE layers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  visible BOOLEAN DEFAULT TRUE,
  color TEXT DEFAULT '#000000',
  metadata JSONB DEFAULT '{}'
);

-- Tools and Markups
CREATE TABLE tool_sets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope TEXT NOT NULL CHECK (scope IN ('user', 'company')),
  name TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tool_set_id UUID NOT NULL REFERENCES tool_sets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'rectangle', 'circle', 'text', 'measure', etc.
  style JSONB NOT NULL DEFAULT '{}', -- colors, line weights, etc.
  payload_schema JSONB DEFAULT '{}' -- validation schema for tool-specific data
);

CREATE TABLE markups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_id UUID NOT NULL REFERENCES sheets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  tool_id UUID REFERENCES tools(id),
  geometry GEOMETRY NOT NULL, -- PostGIS geometry (point, line, polygon)
  props JSONB DEFAULT '{}', -- tool-specific properties
  status_model TEXT DEFAULT 'default',
  status TEXT DEFAULT 'open',
  layer_id UUID REFERENCES layers(id),
  space_id UUID REFERENCES spaces(id),
  quantity NUMERIC,
  measure JSONB, -- measurement data (length, area, etc.)
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collaboration and Sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  started_by UUID NOT NULL REFERENCES auth.users(id),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  record JSONB DEFAULT '[]' -- activity log
);

CREATE TABLE session_participants (
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (session_id, user_id)
);

-- RFIs and Tasks
CREATE TABLE rfi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_markup_id UUID REFERENCES markups(id),
  title TEXT NOT NULL,
  summary TEXT,
  assignee_id UUID REFERENCES auth.users(id),
  cc JSONB DEFAULT '[]', -- array of user IDs
  pdf_path TEXT, -- generated PDF report
  status TEXT DEFAULT 'open',
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE punch_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  space_id UUID REFERENCES spaces(id),
  title TEXT NOT NULL,
  description TEXT,
  photo_paths JSONB DEFAULT '[]',
  assignee_id UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'open',
  due_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams Integration
CREATE TABLE teams_bindings (
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  tab_url TEXT,
  webhook_url TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (project_id, team_id, channel_id)
);

-- Activity and Events
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- 'markup_added', 'rfi_created', 'session_started', etc.
  payload JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 4. Implementation Phases

### Phase 1: Foundation (MVP - 8 weeks)
- [ ] Basic PDF viewer with zoom/pan
- [ ] Simple markup tools (rectangle, circle, text)
- [ ] Markups list with export to CSV/JSON
- [ ] Basic calibration and measurement
- [ ] User authentication and project management
- [ ] Real-time collaboration via WebSockets

### Phase 2: Professional Tools (12 weeks)
- [ ] Complete tool chest with custom tool sets
- [ ] Advanced measurement and takeoff tools
- [ ] Dynamic Fill (CV-based area detection)
- [ ] Spaces and layers management
- [ ] Compare/overlay documents
- [ ] Slip-sheet with markup preservation

### Phase 3: Collaboration & Integration (8 weeks)
- [ ] Studio Sessions with activity recording
- [ ] Microsoft Teams integration (webhooks, cards)
- [ ] RFI and punch item workflows
- [ ] Batch linking and set management
- [ ] Advanced reporting and exports

### Phase 4: AI Enhancement (12 weeks)
- [ ] AI Tool Wizard
- [ ] Auto-calibration from scale bars
- [ ] AI-powered change detection and explanation
- [ ] Intelligent batch linking
- [ ] Smart document comparison

### Phase 5: Enterprise Features (8 weeks)
- [ ] Advanced permissions and roles
- [ ] Enterprise SSO integration
- [ ] Custom branding and white-labeling
- [ ] Advanced analytics and reporting
- [ ] API for third-party integrations

## 5. Technical Architecture Details

### Markup Engine Design
```typescript
interface MarkupObject {
  id: string;
  type: 'rectangle' | 'circle' | 'text' | 'measure' | 'area' | 'count';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon';
    coordinates: number[][];
  };
  style: {
    stroke: string;
    strokeWidth: number;
    fill: string;
    opacity: number;
  };
  properties: Record<string, any>;
  metadata: {
    toolId: string;
    authorId: string;
    layerId?: string;
    spaceId?: string;
    status: string;
    timestamps: {
      created: string;
      updated: string;
    };
  };
}
```

### Real-time Collaboration Protocol
```typescript
interface CollaborationEvent {
  type: 'cursor' | 'markup_add' | 'markup_update' | 'markup_delete' | 'user_join' | 'user_leave';
  sessionId: string;
  userId: string;
  timestamp: string;
  data: {
    cursor?: { x: number; y: number; sheetId: string };
    markup?: MarkupObject;
    changes?: Partial<MarkupObject>;
  };
}
```

### Teams Integration API
```typescript
interface TeamsWebhookPayload {
  type: 'rfi_created' | 'markup_added' | 'session_started' | 'review_requested';
  project: { id: string; name: string };
  data: {
    title: string;
    description: string;
    assignee?: string;
    dueDate?: string;
    axisUrl: string; // Deep link to AxIs viewer
  };
  adaptiveCard: AdaptiveCard;
}
```

## 6. AI/ML Components

### Computer Vision Pipeline
- **Scale Detection**: OCR + pattern matching for scale bars
- **Dynamic Fill**: Edge detection + flood fill for irregular areas
- **Symbol Recognition**: Object detection for common construction symbols
- **Change Detection**: Image comparison + semantic analysis

### Natural Language Processing
- **Change Explanation**: Generate human-readable change summaries
- **RFI Generation**: Auto-generate RFI text from markup context
- **Document Search**: Semantic search across drawings and annotations

## 7. Performance Considerations

### PDF Rendering Optimization
- Progressive loading for large documents
- Viewport-based rendering (only visible areas)
- Canvas pooling for markup overlays
- Worker threads for heavy processing

### Real-time Collaboration Scaling
- WebSocket connection pooling
- Event batching and debouncing
- Optimistic UI updates
- Conflict resolution strategies

### Database Optimization
- Spatial indexing for geometry queries
- Partitioning for large markup datasets
- Read replicas for reporting queries
- Caching layer for frequent lookups

## 8. Testing Strategy

### Unit Testing
- Markup geometry calculations
- Measurement accuracy
- Data model integrity
- API endpoint functionality

### Integration Testing
- PDF processing pipeline
- Real-time collaboration flows
- Teams integration workflows
- Document comparison accuracy

### User Acceptance Testing
- Construction professional feedback
- Performance benchmarking against Bluebeam
- Workflow compatibility verification
- Feature completeness validation

## 9. Deployment Architecture

### Production Infrastructure
- **Frontend**: Vercel/Netlify CDN deployment
- **Backend**: AWS ECS/EKS containerized services
- **Database**: Supabase managed PostgreSQL with PostGIS
- **File Storage**: AWS S3 with CloudFront CDN
- **WebSockets**: AWS Application Load Balancer with sticky sessions

### Development Environment
- Docker Compose for local development
- GitHub Actions for CI/CD
- Feature branch deployments
- Automated testing pipelines

## 10. Success Metrics

### Technical KPIs
- PDF rendering performance: <2s for 100-page documents
- Real-time latency: <100ms for collaboration events
- Markup accuracy: 99.9% geometric precision
- Uptime: 99.9% availability SLA

### Business KPIs
- User adoption rate vs. Bluebeam
- Feature usage analytics
- Customer satisfaction scores
- Revenue per user metrics

## Next Steps

1. **Immediate (Week 1)**:
   - Set up development environment
   - Initialize Supabase project with schema
   - Create basic React + PDF.js viewer
   - Implement basic markup tools

2. **Short-term (Weeks 2-4)**:
   - Build markup engine with geometric calculations
   - Implement real-time collaboration
   - Create user authentication system
   - Set up CI/CD pipelines

3. **Medium-term (Weeks 5-12)**:
   - Complete MVP feature set
   - Implement measurement and calibration
   - Add Teams integration
   - Begin user testing with construction professionals

This comprehensive plan provides the roadmap for building a professional-grade Bluebeam competitor that not only matches existing capabilities but exceeds them with AI-enhanced features and seamless collaboration tools.