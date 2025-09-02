// Database service for connecting React components to Supabase
// Note: Install @supabase/supabase-js when ready to use real database
// import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key';

// export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types from our schema
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'project_manager' | 'field_engineer' | 'contractor' | 'guest';
  avatar_url?: string;
  status: 'online' | 'idle' | 'offline';
  last_seen_at: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  location?: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'archived';
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  project_id: string;
  user_id: string;
  action_type: 'upload' | 'comment' | 'markup' | 'approval' | 'mention' | 'ai_detection';
  description: string;
  target_type?: 'document' | 'markup' | 'rfi' | 'project';
  target_id?: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  message_type: 'text' | 'ai_response' | 'system';
  reply_to?: string;
  created_at: string;
}

// Mock data service for development
export class MockDataService {
  static async getUsers(): Promise<User[]> {
    return [
      {
        id: 'user-1',
        email: 'sarah.chen@construction.com',
        first_name: 'Sarah',
        last_name: 'Chen',
        role: 'project_manager',
        avatar_url: null,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-2',
        email: 'mike.rodriguez@construction.com',
        first_name: 'Mike',
        last_name: 'Rodriguez',
        role: 'field_engineer',
        avatar_url: null,
        status: 'idle',
        last_seen_at: new Date(Date.now() - 30000).toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'user-3',
        email: 'chris.johnson@construction.com',
        first_name: 'Chris',
        last_name: 'Johnson',
        role: 'contractor',
        avatar_url: null,
        status: 'offline',
        last_seen_at: new Date(Date.now() - 7200000).toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ai-assistant',
        email: 'ai@teambeam.app',
        first_name: 'AI',
        last_name: 'Assistant',
        role: 'admin',
        avatar_url: null,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    ];
  }

  static async getProjects(): Promise<Project[]> {
    return [
      {
        id: 'project-1',
        name: 'Downtown Office Complex',
        description: 'Modern 12-story office building with retail ground floor',
        location: 'Downtown District',
        status: 'active',
        start_date: '2024-01-15',
        end_date: '2025-06-30',
        created_by: 'user-1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'project-2',
        name: 'Residential Tower B',
        description: '24-story residential high-rise with amenities',
        location: 'Riverside District',
        status: 'active',
        start_date: '2024-03-01',
        end_date: '2025-12-15',
        created_by: 'user-1',
        created_at: '2024-02-15T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
      {
        id: 'project-3',
        name: 'Industrial Facility',
        description: 'Manufacturing and warehouse complex',
        location: 'Industrial Park',
        status: 'planning',
        start_date: '2024-06-01',
        end_date: '2025-08-30',
        created_by: 'user-2',
        created_at: '2024-03-01T00:00:00Z',
        updated_at: new Date().toISOString(),
      },
    ];
  }

  static async getDocuments(projectId: string): Promise<Document[]> {
    return [
      {
        id: 'doc-1',
        project_id: projectId,
        name: 'Architectural Floor Plans',
        file_path: '/projects/project-1/floor-plans-v3.pdf',
        file_size: 15728640,
        mime_type: 'application/pdf',
        version: 3,
        status: 'approved',
        uploaded_by: 'user-1',
        created_at: '2024-01-15T00:00:00Z',
        updated_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'doc-2',
        project_id: projectId,
        name: 'Structural Plans',
        file_path: '/projects/project-1/structural-plans-v2.pdf',
        file_size: 22134784,
        mime_type: 'application/pdf',
        version: 2,
        status: 'review',
        uploaded_by: 'user-2',
        created_at: '2024-01-20T00:00:00Z',
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'doc-3',
        project_id: projectId,
        name: 'MEP Systems Layout',
        file_path: '/projects/project-1/mep-layout-v1.pdf',
        file_size: 18906112,
        mime_type: 'application/pdf',
        version: 1,
        status: 'draft',
        uploaded_by: 'user-3',
        created_at: '2024-01-25T00:00:00Z',
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];
  }

  static async getRecentActivity(projectId: string): Promise<Activity[]> {
    return [
      {
        id: 'activity-1',
        project_id: projectId,
        user_id: 'ai-assistant',
        action_type: 'ai_detection',
        description: 'detected issues in Structural Plans',
        target_type: 'document',
        target_id: 'doc-2',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'activity-2',
        project_id: projectId,
        user_id: 'user-1',
        action_type: 'approval',
        description: 'approved Architectural Floor Plans v3',
        target_type: 'document',
        target_id: 'doc-1',
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'activity-3',
        project_id: projectId,
        user_id: 'user-2',
        action_type: 'upload',
        description: 'uploaded Structural Plans v2',
        target_type: 'document',
        target_id: 'doc-2',
        created_at: new Date(Date.now() - 10800000).toISOString(),
      },
    ];
  }

  static async getChatMessages(projectId: string): Promise<ChatMessage[]> {
    return [
      {
        id: 'msg-1',
        project_id: projectId,
        user_id: 'user-1',
        content: 'The new floor plans look great! Just a few minor adjustments needed.',
        message_type: 'text',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'msg-2',
        project_id: projectId,
        user_id: 'ai-assistant',
        content: "I've detected 3 potential conflicts in the MEP layout. Would you like me to highlight them?",
        message_type: 'ai_response',
        created_at: new Date(Date.now() - 900000).toISOString(),
      },
    ];
  }
}

// Real database service (to be implemented when Supabase is configured)
export class DatabaseService {
  static async getUsers(): Promise<User[]> {
    // TODO: Implement when Supabase is configured
    // const { data, error } = await supabase
    //   .from('users')
    //   .select('*')
    //   .order('created_at', { ascending: false });
    // 
    // if (error) throw error;
    // return data || [];
    
    // For now, return mock data
    return MockDataService.getUsers();
  }

  static async getProjects(): Promise<Project[]> {
    // TODO: Implement when Supabase is configured
    // const { data, error } = await supabase
    //   .from('projects')
    //   .select('*')
    //   .order('updated_at', { ascending: false });
    // 
    // if (error) throw error;
    // return data || [];
    
    // For now, return mock data
    return MockDataService.getProjects();
  }

  static async getDocuments(projectId: string): Promise<Document[]> {
    // TODO: Implement when Supabase is configured
    // const { data, error } = await supabase
    //   .from('documents')
    //   .select('*')
    //   .eq('project_id', projectId)
    //   .order('updated_at', { ascending: false });
    // 
    // if (error) throw error;
    // return data || [];
    
    // For now, return mock data
    return MockDataService.getDocuments(projectId);
  }

  static async getRecentActivity(projectId: string): Promise<Activity[]> {
    // TODO: Implement when Supabase is configured
    // const { data, error } = await supabase
    //   .from('activity_logs')
    //   .select(`
    //     *,
    //     user:users(first_name, last_name)
    //   `)
    //   .eq('project_id', projectId)
    //   .order('created_at', { ascending: false })
    //   .limit(10);
    // 
    // if (error) throw error;
    // return data || [];
    
    // For now, return mock data
    return MockDataService.getRecentActivity(projectId);
  }

  static async getChatMessages(projectId: string): Promise<ChatMessage[]> {
    // TODO: Implement when Supabase is configured
    // const { data, error } = await supabase
    //   .from('chat_messages')
    //   .select(`
    //     *,
    //     user:users(first_name, last_name)
    //   `)
    //   .eq('project_id', projectId)
    //   .order('created_at', { ascending: false })
    //   .limit(50);
    // 
    // if (error) throw error;
    // return data || [];
    
    // For now, return mock data
    return MockDataService.getChatMessages(projectId);
  }
}

// Export the service to use (switch between mock and real)
export const dataService = process.env.NODE_ENV === 'development' 
  ? MockDataService 
  : DatabaseService;