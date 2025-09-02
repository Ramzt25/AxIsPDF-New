# UI/UX Specification – Next Gen Construction Platform

## Tone & Style
- Primary theme: Dark mode, futuristic, professional, and minimalist.  
- Secondary theme: Light mode with consistent structure, warm gray/white surfaces, same blue/orange accent colors.  
- Layouts must feel smarter and more intelligent than Bluebeam, combining dense functionality with clarity.  
- Animations: smooth, subtle (Framer Motion style).  
- Icons: clean, geometric, modern SVGs.  

## Components & Views

### 1. Document Viewer & AI Insights
- Central PDF viewer with context-aware toolbar.  
- Left sidebar: navigation icons for Documents, Annotations, Measurements, Collaboration, Insights.  
- Right sidebar: tabs for AI Insights, Layers, Comments, History.  
- AI Insights panel: extracted info (e.g., rooms, dimensions, missing items) and suggested actions.  
- Bottom bar: timeline/version history + collaboration activity.  

### 2. Stamp Toolbox (Dockable/Floating)
- Dockable/floating panel with draggable header.  
- Sections: Approval, Review, Safety, MEP, Custom.  
- Large icon + label for each stamp.  
- Hover preview, click to place.  
- AI Suggestions row at bottom with context-aware stamps.  
- Orange = active, Blue = hover.  

### 3. Social Dashboard
- Left: Activity feed (updates, comments, RFIs, markups).  
- Center: Calendar + meeting scheduling.  
- Right: Collaborators (with presence indicators) + projects.  
- Recent Documents thumbnails.  
- Bottom quick actions: New Note, New RFI, New Meeting, Upload File.  
- AI Assistant prompts with summaries & scheduling.  

### 4. Base Modal
- Rounded, centered with header/footer.  
- Header: title, close, dock.  
- Body: forms, previews, or content.  
- Footer: cancel/back left, primary action (orange) right.  
- Variants: small, medium, large.  
- Dark theme = black/charcoal, Light theme = white/gray.  

### 5. Chat Interface
- Sidebar: DMs + Project Channels.  
- Main panel (right):  
  - Header with chat/project name, avatars, actions.  
  - Stream with bubbles, avatars, timestamps, inline previews.  
  - AI appears as participant.  
- Composer with emoji, attach, AI buttons.  
- Right-aligned chat panel when inside projects.  

## Theming
- Dark Mode: near-black background, electric blue accents, orange primary actions.  
- Light Mode: white/gray background, same accent palette.  
- Consistent typography, spacing, responsiveness.  

## JSON Specification
```json
{
  "tone": {
    "primary_theme": "dark",
    "secondary_theme": "light",
    "style": "futuristic, professional, minimalist",
    "animations": "smooth subtle transitions",
    "icons": "geometric svg"
  },
  "components": {
    "document_viewer": {
      "toolbar": "context-aware",
      "left_sidebar": ["documents", "annotations", "measurements", "collaboration", "insights"],
      "right_sidebar": ["ai_insights", "layers", "comments", "history"],
      "bottom_bar": ["timeline", "version_history", "collaboration"]
    },
    "stamp_toolbox": {
      "type": ["dockable", "floating"],
      "sections": ["approval", "review", "safety", "MEP", "custom"],
      "ai_suggestions": true,
      "active_state": "orange",
      "hover_state": "blue"
    },
    "social_dashboard": {
      "columns": {
        "left": "activity_feed",
        "center": "calendar + schedule_meeting",
        "right": ["collaborators_with_status", "projects"]
      },
      "recent_documents": true,
      "quick_actions": ["new_note", "new_rfi", "new_meeting", "upload_file"],
      "ai_assistant": true
    },
    "modal": {
      "variants": ["small", "medium", "large"],
      "header": ["title", "close", "dock"],
      "body": ["forms", "previews", "content"],
      "footer": {"left": ["cancel", "back"], "right": "primary_action"},
      "theme_support": ["dark", "light"]
    },
    "chat_interface": {
      "sidebar": ["direct_messages", "project_channels"],
      "main_panel": {
        "header": ["chat_name", "avatars", "actions"],
        "stream": ["bubbles", "avatars", "timestamps", "inline_previews", "ai_participant"]
      },
      "composer": ["emoji", "attach", "ai"],
      "alignment": "right_in_project_mode"
    }
  },
  "theming": {
    "dark": {
      "background": "#0c0a09",
      "accents": {"primary": "#3b82f6", "highlight": "#f97316"}
    },
    "light": {
      "background": "#f9fafb",
      "accents": {"primary": "#3b82f6", "highlight": "#f97316"}
    }
  }
}
```

## Design Tokens

### Colors
- **Backgrounds**: `#0c0a09` (page), `#1a1a1a` (panels)
- **Accents**: Blue `#3b82f6` (primary), Orange `#f97316` (primary action)
- **Borders**: `#27272a`
- **Text**: Zinc 100/200/300 in dark mode; Slate 800/600/500 in light mode

### Typography
- Primary font: System font stack
- Headings: Semi-bold, appropriate sizing scale
- Body: Regular weight, comfortable line height
- Code: Monospace, slightly smaller

### Spacing
- Base unit: 4px
- Component padding: 12px (3 units)
- Section spacing: 16px (4 units)
- Layout gaps: 24px (6 units)

## Accessibility Guidelines
- Focus states use high-contrast blue borders
- All icon-only buttons include title attributes
- Keyboard navigation: Escape closes modals, arrow keys for navigation
- Color contrast meets WCAG AA standards
- Screen reader friendly markup

## Component Architecture

### Agent Hooks (for AI assistance)
- `DocumentViewer` toolbar actions: "Select" | "Annotate" | "Measure" | "Review"
- `StampToolbox` props: `dock`, `onDockChange`
- Theme control: `ThemeContext` with `theme`, `setTheme("dark"|"light")`
- Modal: `<BaseModal title onClose>{children}</BaseModal>`
- Panels: `Dashboard`, `ChatPanel`, `RightPanel`

### Animation Guidelines
- Transitions: 150-300ms duration
- Easing: ease-out for entrances, ease-in for exits
- Hover states: immediate feedback
- Loading states: subtle pulse/shimmer
- Page transitions: slide/fade combinations

## Implementation Priority
1. **Theme system and base components** (Critical)
2. **Document Viewer** (Core functionality)
3. **Stamp Toolbox** (Key differentiator)
4. **Social Dashboard** (Collaboration)
5. **Chat Interface** (Real-time features)
6. **Modal system** (Supporting infrastructure)

## Performance Considerations
- Lazy load heavy components
- Virtualize long lists (activity feeds, file lists)
- Optimize SVG icons for bundling
- Use CSS transforms for animations
- Implement proper memoization for theme switching