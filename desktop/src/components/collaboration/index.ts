// src/components/collaboration/index.ts
// Collaboration components exports

export { CollaborationPanel } from './CollaborationPanel';
export { ThreadList } from './ThreadList';
export { ChatView } from './ChatView';
export { ThreadPin } from './ThreadPin';
export { NewThreadModal } from './NewThreadModal';

// Re-export types from the service
export type { Thread, ThreadMessage, TaskPromotion, RFIPromotion } from '../../services/collaboration';