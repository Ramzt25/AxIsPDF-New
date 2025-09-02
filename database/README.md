# TeamBeam Database Schema

This directory contains the complete database schema for the TeamBeam Construction Platform.

## Overview

The schema provides a comprehensive foundation for a construction management platform with:

- **Multi-tenant architecture** with organizations and role-based access control
- **Real-time collaboration** with live document sharing and messaging
- **Document management** with versioning and AI-powered analysis
- **Issue tracking** including RFIs, deficiencies, and task management
- **Meeting scheduling** and team collaboration features
- **Comprehensive audit trails** and activity logging
- **Future-ready architecture** for integrations and extensibility

## Files

- `complete-schema.sql` - Full database schema with tables, indexes, RLS policies, triggers, and sample data
- `migrations.sql` - Incremental migration script for schema updates
- `maintenance.sql` - Database maintenance operations (VACUUM, ANALYZE, etc.)

## Database Structure

### Core Tables

1. **Organizations** - Multi-tenant support
2. **Users** - User management with comprehensive profiles
3. **Projects** - Project management with location and status tracking
4. **Project Members** - Role-based project access control
5. **Documents** - Document management with versioning
6. **Document Sheets** - Multi-page document support
7. **Markups** - Annotations and comments on documents
8. **RFIs** - Request for Information workflow
9. **Issues** - Deficiency and issue tracking
10. **Tasks** - Task assignment and progress tracking
11. **Meetings** - Meeting scheduling and management
12. **Chat Messages** - Project communication
13. **Notifications** - User notification system
14. **Activity Logs** - Comprehensive audit trail

### Advanced Features

- **Collaboration Sessions** - Real-time document collaboration
- **AI Analyses** - AI-powered document analysis results
- **Integrations** - Third-party system integrations
- **File Uploads** - File upload tracking and processing
- **Document Templates** - Reusable document templates
- **Saved Views** - Custom user views and filters

### Security

- **Row Level Security (RLS)** policies on all tables
- **Storage bucket policies** for file access control
- **Role-based permissions** throughout the system
- **Audit logging** for all critical operations

## Setup Instructions

### 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new project
2. Note your project URL and anon key
3. Go to the SQL Editor in your Supabase dashboard

### 2. Run the Schema

1. Copy the contents of `complete-schema.sql`
2. Paste into the Supabase SQL Editor
3. Run the script to create all tables, policies, and initial data

**Note**: If you encounter a VACUUM error (25001), this is normal. The schema creation will complete successfully, and you can run database maintenance operations separately using `maintenance.sql`.

### 3. Configure Storage

The schema automatically creates storage buckets:
- `documents` - Project documents
- `images` - Image files
- `videos` - Video files
- `avatars` - User profile pictures
- `thumbnails` - Document thumbnails
- `exports` - Generated exports
- `templates` - Document templates
- `temp` - Temporary files

### 4. Environment Configuration

Update your application environment variables:

```bash
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

## Sample Data

The schema includes sample data for development:

- **Organization**: ACME Construction
- **Users**: Sarah Chen (PM), Mike Rodriguez (Engineer), Chris Johnson (Contractor), AI Assistant
- **Project**: Downtown Office Complex
- **Project Members**: All users assigned to the sample project

## Key Features

### Multi-Tenancy
- Organizations can have multiple projects
- Users belong to organizations
- Data is isolated by organization

### Role-Based Access Control
- Super Admin, Admin, Project Manager, Field Engineer, Architect, Contractor, Subcontractor, Inspector, Client, Guest roles
- Granular permissions per project
- RLS policies enforce access control

### Real-Time Collaboration
- Live document viewing sessions
- Real-time cursor tracking
- User presence indicators
- Live chat and messaging

### Document Management
- Version control with full history
- OCR text extraction
- AI-powered analysis
- Multi-page document support
- Annotation and markup system

### Issue Tracking
- RFI workflow management
- Issue/deficiency tracking
- Task assignment and progress
- Priority and status management

### Audit and Compliance
- Complete activity logging
- User action tracking
- Change history
- Compliance reporting

## Extensibility

The schema is designed for future growth:

- **Integration framework** for third-party systems
- **Webhook system** for real-time notifications
- **Custom fields** via JSONB metadata columns
- **Plugin architecture** support
- **API-first design** for mobile and web clients

## Performance Optimizations

- **Comprehensive indexing** strategy
- **Full-text search** capabilities
- **Optimized queries** for common operations
- **Automatic cleanup** functions for expired data
- **Efficient pagination** support

## Maintenance

### Regular Tasks

1. **Backup**: Supabase provides automatic backups
2. **Cleanup**: Run `cleanup_expired_data()` function regularly
3. **Monitoring**: Track query performance and storage usage
4. **Updates**: Apply schema migrations as needed
5. **Performance**: Run `maintenance.sql` weekly for optimal performance (VACUUM, ANALYZE)

**Important**: Database maintenance operations in `maintenance.sql` must be run outside of transaction blocks. Use a direct database connection or psql client for these operations.

### Functions Available

- `cleanup_expired_data()` - Remove expired sessions and temp files
- `generate_sequence_number()` - Generate sequential document/RFI numbers
- `send_notification()` - Send notifications to users
- `update_updated_at_column()` - Automatic timestamp updates

## Support

For questions about the database schema or setup, please refer to:

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/) (for location features)

## License

This schema is part of the TeamBeam Construction Platform project.