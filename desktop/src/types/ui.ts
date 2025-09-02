// UI Component Types
export interface ThemeContextType {
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  isDark: boolean;
}

export interface StampToolboxProps {
  dock: 'left' | 'right' | 'bottom' | 'float';
  onDockChange: (position: 'left' | 'right' | 'bottom' | 'float') => void;
  className?: string;
}

export interface BaseModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
}

export interface ActivityItemData {
  who: string;
  what: string;
  file: string;
  when: string;
}

export interface PersonData {
  name: string;
  status: 'online' | 'idle' | 'offline';
}

export interface MessageData {
  from: string;
  text: string;
  mine?: boolean;
  ai?: boolean;
  timestamp?: string;
}

export interface DocumentViewerProps {
  documentUrl?: string;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export interface StampData {
  id: string;
  category: 'Approval' | 'Review' | 'Safety' | 'MEP' | 'Custom';
  label: string;
  icon?: string;
  color?: string;
}

export interface ChatChannelData {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  unread?: number;
  active?: boolean;
}

export interface AIInsightData {
  type: 'analysis' | 'suggestion' | 'warning';
  title: string;
  description: string;
  action?: string;
  confidence?: number;
}

// Component State Types
export type ViewType = 'dashboard' | 'documents' | 'viewer' | 'annotations' | 'measurements' | 'collaboration';
export type DockPosition = 'left' | 'right' | 'bottom' | 'float';
export type TabType = 'insights' | 'layers' | 'comments' | 'history';

// Event Handler Types
export type ViewChangeHandler = (view: ViewType) => void;
export type DockChangeHandler = (position: DockPosition) => void;
export type TabChangeHandler = (tab: TabType) => void;