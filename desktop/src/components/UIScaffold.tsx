import { useState, useMemo, createContext, useContext } from "react";

// Theme Context
const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  
  const value = useMemo(() => ({
    theme,
    setTheme: (newTheme) => setTheme(newTheme),
    isDark: theme === "dark"
  }), [theme]);

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// Main App Component
export default function App() {
  const [view, setView] = useState("dashboard");
  const [stampDock, setStampDock] = useState("left");
  const [showStamps, setShowStamps] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showModal, setShowModal] = useState(false);

  return (
    <ThemeProvider>
      <AppShell 
        view={view} 
        onViewChange={setView}
        stampDock={stampDock}
        onStampDockChange={setStampDock}
        showStamps={showStamps}
        onToggleStamps={() => setShowStamps(!showStamps)}
        showChat={showChat}
        onToggleChat={() => setShowChat(!showChat)}
        showModal={showModal}
        onToggleModal={() => setShowModal(!showModal)}
      />
    </ThemeProvider>
  );
}

function AppShell({ 
  view, onViewChange, 
  stampDock, onStampDockChange,
  showStamps, onToggleStamps,
  showChat, onToggleChat,
  showModal, onToggleModal
}) {
  const { theme, setTheme, isDark } = useTheme();

  return (
    <div className="h-screen bg-stone-950 dark:bg-stone-950 light:bg-gray-50 text-zinc-100 dark:text-zinc-100 light:text-slate-800 flex overflow-hidden">
      {/* Left Navigation Rail */}
      <div className="w-16 bg-zinc-900 dark:bg-zinc-900 light:bg-white border-r border-zinc-800 dark:border-zinc-800 light:border-gray-200 flex flex-col items-center py-4 gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 grid place-items-center text-white font-bold text-sm">T</div>
        
        <div className="flex flex-col gap-2">
          {[
            { id: "dashboard", icon: "■", label: "Dashboard" },
            { id: "documents", icon: "📄", label: "Documents" },
            { id: "viewer", icon: "👁", label: "Viewer" },
            { id: "annotations", icon: "✏️", label: "Annotations" },
            { id: "measurements", icon: "📏", label: "Measurements" },
            { id: "collaboration", icon: "👥", label: "Collaboration" }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              title={item.label}
              className={`w-10 h-10 rounded-lg grid place-items-center text-lg transition-colors ${
                view === item.id 
                  ? "bg-blue-600 text-white" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-gray-100"
              }`}
            >
              {item.icon}
            </button>
          ))}
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button 
            onClick={onToggleStamps}
            title="Toggle Stamps"
            className={`w-10 h-10 rounded-lg grid place-items-center transition-colors ${
              showStamps ? "bg-orange-500 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            🏷️
          </button>
          
          <button 
            onClick={onToggleChat}
            title="Toggle Chat"
            className={`w-10 h-10 rounded-lg grid place-items-center transition-colors ${
              showChat ? "bg-blue-600 text-white" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            💬
          </button>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Theme"
            className="w-10 h-10 rounded-lg grid place-items-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-gray-100 transition-colors"
          >
            {isDark ? "☀️" : "🌙"}
          </button>
        </div>
      </div>

      {/* Stamp Toolbox - Conditionally positioned */}
      {showStamps && (
        <StampToolbox 
          dock={stampDock} 
          onDockChange={onStampDockChange}
          className={
            stampDock === "left" ? "order-1" :
            stampDock === "right" ? "order-3" :
            stampDock === "bottom" ? "order-4" :
            "fixed z-50 top-20 left-20"
          }
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 order-2">
        {view === "dashboard" && <Dashboard />}
        {view === "viewer" && <DocumentViewer />}
        {view === "documents" && <DocumentViewer />}
        {view === "annotations" && <DocumentViewer />}
        {view === "measurements" && <DocumentViewer />}
        {view === "collaboration" && <Dashboard />}
      </div>

      {/* Right Panel - AI Insights */}
      <RightPanel />

      {/* Chat Panel - Conditionally shown */}
      {showChat && <ChatPanel />}

      {/* Modal System */}
      {showModal && (
        <BaseModal title="Example Modal" onClose={() => onToggleModal()}>
          <div className="space-y-4">
            <LabeledInput label="Project Name" placeholder="Enter project name" />
            <LabeledInput label="Description" placeholder="Brief description" />
            <div className="flex gap-2 justify-end">
              <GhostButton onClick={() => onToggleModal()}>Cancel</GhostButton>
              <PrimaryButton onClick={() => onToggleModal()}>Create Project</PrimaryButton>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
}

function Dashboard() {
  return (
    <div className="flex-1 p-6 bg-stone-950 dark:bg-stone-950 light:bg-gray-50">
      <div className="grid grid-cols-3 gap-6 h-full">
        {/* Left Column - Activity Feed */}
        <Card title="Recent Activity" className="space-y-2">
          <ActivityItem who="Sarah" what="approved" file="Floor Plan A-101" when="2m ago" />
          <ActivityItem who="Mike" what="commented on" file="MEP Schedule" when="15m ago" />
          <ActivityItem who="AI Assistant" what="detected issues in" file="Structural Plans" when="1h ago" />
          <ActivityItem who="Chris" what="uploaded" file="RFI-024.pdf" when="2h ago" />
          <ActivityItem who="Team" what="completed review of" file="Permit Set" when="3h ago" />
        </Card>

        {/* Center Column - Calendar & Actions */}
        <div className="space-y-6">
          <Card title="Today's Schedule" className="space-y-3">
            <div className="text-sm space-y-2">
              <div className="flex justify-between items-center p-2 rounded bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100">
                <span>Design Review Meeting</span>
                <span className="text-zinc-400">2:00 PM</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded bg-zinc-800/50 dark:bg-zinc-800/50 light:bg-gray-50">
                <span>Client Presentation</span>
                <span className="text-zinc-400">4:30 PM</span>
              </div>
            </div>
            <PrimaryButton className="w-full">Schedule Meeting</PrimaryButton>
          </Card>

          <Card title="Quick Actions" className="grid grid-cols-2 gap-2">
            <GhostButton>New Note</GhostButton>
            <GhostButton>New RFI</GhostButton>
            <GhostButton>Upload File</GhostButton>
            <GhostButton>AI Analysis</GhostButton>
          </Card>

          <Card title="Recent Documents" className="grid grid-cols-2 gap-3">
            <Thumb label="Floor Plans" />
            <Thumb label="MEP Drawings" />
            <Thumb label="Specifications" />
            <Thumb label="RFI Package" />
          </Card>
        </div>

        {/* Right Column - Team & Projects */}
        <div className="space-y-6">
          <Card title="Team Status" className="space-y-2">
            <Person name="Sarah Chen" status="online" />
            <Person name="Mike Rodriguez" status="idle" />
            <Person name="Chris Johnson" status="offline" />
            <Person name="AI Assistant" status="online" />
          </Card>

          <Card title="Active Projects" className="space-y-2">
            <div className="space-y-2">
              {["Downtown Office Complex", "Residential Tower B", "Industrial Facility"].map(project => (
                <div key={project} className="flex justify-between items-center text-sm">
                  <span>{project}</span>
                  <Badge>Active</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DocumentViewer() {
  return (
    <div className="flex-1 bg-zinc-900 dark:bg-zinc-900 light:bg-white">
      {/* Toolbar */}
      <div className="h-12 bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 border-b border-zinc-700 dark:border-zinc-700 light:border-gray-200 flex items-center px-4 gap-2">
        {["Select", "Annotate", "Measure", "Review"].map(tool => (
          <button key={tool} className="px-3 py-1 rounded text-sm bg-zinc-700 dark:bg-zinc-700 light:bg-white hover:bg-zinc-600 dark:hover:bg-zinc-600 light:hover:bg-gray-50 transition-colors">
            {tool}
          </button>
        ))}
        <div className="ml-auto text-sm text-zinc-400">Page 1 of 24</div>
      </div>

      {/* PDF Viewer Area */}
      <div className="flex-1 p-4 grid place-items-center">
        <div className="w-full max-w-4xl aspect-[8.5/11] bg-white rounded-lg shadow-lg grid place-items-center text-gray-400">
          PDF Document Content
          <div className="text-sm mt-2">Click toolbar actions to interact</div>
        </div>
      </div>

      {/* Bottom Timeline */}
      <div className="h-16 bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 border-t border-zinc-700 dark:border-zinc-700 light:border-gray-200 flex items-center px-4">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span>Version 2.1</span>
          <span>•</span>
          <span>Last modified 2h ago by Sarah Chen</span>
          <span>•</span>
          <span>3 collaborators active</span>
        </div>
      </div>
    </div>
  );
}

function StampToolbox({ dock, onDockChange, className = "" }) {
  const stamps = [
    { category: "Approval", items: ["Approved", "Rejected", "Pending"] },
    { category: "Review", items: ["Reviewed", "Needs Changes", "Final"] },
    { category: "Safety", items: ["Hazard", "PPE Required", "Safe"] },
    { category: "MEP", items: ["Electrical", "Plumbing", "HVAC"] }
  ];

  const dockClass = 
    dock === "left" ? "w-64 h-full" :
    dock === "right" ? "w-64 h-full" :
    dock === "bottom" ? "w-full h-48" :
    "w-80 h-96 rounded-2xl";

  return (
    <div className={`bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-gray-200 ${dockClass} ${className} flex flex-col`}>
      {/* Header */}
      <div className="p-3 border-b border-zinc-800 dark:border-zinc-800 light:border-gray-200 flex justify-between items-center">
        <span className="font-semibold text-sm">Stamp Toolbox</span>
        <div className="flex gap-1">
          {["left", "right", "bottom", "float"].map(position => (
            <button
              key={position}
              onClick={() => onDockChange(position)}
              className={`w-6 h-6 rounded text-xs grid place-items-center transition-colors ${
                dock === position 
                  ? "bg-orange-500 text-white" 
                  : "bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {position === "left" ? "←" : position === "right" ? "→" : position === "bottom" ? "↓" : "⌂"}
            </button>
          ))}
        </div>
      </div>

      {/* Stamps */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div className="space-y-4">
          {stamps.map(section => (
            <div key={section.category}>
              <div className="text-xs font-semibold text-zinc-400 mb-2">{section.category}</div>
              <div className={dock === "bottom" ? "flex gap-2" : "grid grid-cols-2 gap-2"}>
                {section.items.map(stamp => (
                  <button
                    key={stamp}
                    className="p-2 rounded-lg bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 hover:bg-blue-600 dark:hover:bg-blue-600 light:hover:bg-blue-500 hover:text-white transition-colors text-xs text-center"
                  >
                    {stamp}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* AI Suggestions */}
        <div className="mt-4 pt-4 border-t border-zinc-800 dark:border-zinc-800 light:border-gray-200">
          <div className="text-xs font-semibold text-zinc-400 mb-2">AI Suggestions</div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs hover:bg-blue-600/30 transition-colors">
              Auto-Approve
            </button>
            <button className="px-3 py-2 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-300 text-xs hover:bg-blue-600/30 transition-colors">
              Flag Issues
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RightPanel() {
  const [activeTab, setActiveTab] = useState("insights");
  const tabs = [
    { id: "insights", label: "AI Insights", icon: "🤖" },
    { id: "layers", label: "Layers", icon: "📄" },
    { id: "comments", label: "Comments", icon: "💬" },
    { id: "history", label: "History", icon: "⏱️" }
  ];

  return (
    <div className="w-80 bg-zinc-900 dark:bg-zinc-900 light:bg-white border-l border-zinc-800 dark:border-zinc-800 light:border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-zinc-800 dark:border-zinc-800 light:border-gray-200">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-blue-500 text-blue-400"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span className="block">{tab.icon}</span>
            <span className="text-xs mt-1">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {activeTab === "insights" && (
          <div className="space-y-4">
            <Card title="Document Analysis" className="space-y-3">
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Rooms Detected:</span>
                  <span className="font-mono">24</span>
                </div>
                <div className="flex justify-between">
                  <span>Dimensions Found:</span>
                  <span className="font-mono">156</span>
                </div>
                <div className="flex justify-between">
                  <span>Issues Found:</span>
                  <span className="text-orange-400 font-mono">3</span>
                </div>
              </div>
            </Card>

            <Card title="Suggested Actions" className="space-y-2">
              <button className="w-full p-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-300 text-sm hover:bg-blue-600/30 transition-colors text-left">
                Review dimension conflicts in Grid A
              </button>
              <button className="w-full p-2 rounded bg-orange-600/20 border border-orange-500/40 text-orange-300 text-sm hover:bg-orange-600/30 transition-colors text-left">
                Missing fire exits on Floor 2
              </button>
              <button className="w-full p-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-300 text-sm hover:bg-blue-600/30 transition-colors text-left">
                Generate room schedule
              </button>
            </Card>
          </div>
        )}

        {activeTab === "layers" && (
          <div className="space-y-2">
            {["Architecture", "Structure", "MEP", "Annotations"].map(layer => (
              <div key={layer} className="flex items-center justify-between p-2 rounded hover:bg-zinc-800 dark:hover:bg-zinc-800 light:hover:bg-gray-100">
                <span className="text-sm">{layer}</span>
                <input type="checkbox" defaultChecked className="accent-blue-500" />
              </div>
            ))}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100">
                <div className="font-semibold text-zinc-200">Sarah Chen</div>
                <div className="text-zinc-400 text-xs">2 hours ago</div>
                <div className="mt-1">Please review the electrical layout on page 12.</div>
              </div>
              <div className="p-2 rounded bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100">
                <div className="font-semibold text-zinc-200">Mike Rodriguez</div>
                <div className="text-zinc-400 text-xs">4 hours ago</div>
                <div className="mt-1">HVAC ductwork conflicts with structural beam.</div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span>Version 2.1</span>
              <span className="text-zinc-400">Current</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Version 2.0</span>
              <span className="text-zinc-400">2h ago</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Version 1.9</span>
              <span className="text-zinc-400">1d ago</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatPanel() {
  const [activeChannel, setActiveChannel] = useState("general");
  
  return (
    <div className="w-80 bg-zinc-900 dark:bg-zinc-900 light:bg-white border-l border-zinc-800 dark:border-zinc-800 light:border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 dark:border-zinc-800 light:border-gray-200">
        <div className="font-semibold">Project Chat</div>
        <div className="text-sm text-zinc-400">Downtown Office Complex</div>
      </div>

      {/* Channels */}
      <div className="p-3 border-b border-zinc-800 dark:border-zinc-800 light:border-gray-200">
        <div className="space-y-1">
          {["general", "design-review", "field-updates"].map(channel => (
            <button
              key={channel}
              onClick={() => setActiveChannel(channel)}
              className={`w-full text-left text-sm p-2 rounded transition-colors ${
                activeChannel === channel
                  ? "bg-blue-600 text-white"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
              }`}
            >
              # {channel}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3">
        <Message from="Sarah" text="The new floor plans look great! Just a few minor adjustments needed." />
        <Message from="AI Assistant" ai text="I've detected 3 potential conflicts in the MEP layout. Would you like me to highlight them?" />
        <Message from="You" mine text="Yes, please show the conflicts." />
        <Message from="Mike" text="I'll be on site tomorrow to verify the dimensions." />
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-zinc-800 dark:border-zinc-800 light:border-gray-200">
        <div className="flex gap-2">
          <input 
            placeholder="Type a message..."
            className="flex-1 bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 border border-zinc-700 dark:border-zinc-700 light:border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
          <button className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function BaseModal({ title, onClose, children, size = "medium" }) {
  const sizeClasses = {
    small: "max-w-md",
    medium: "max-w-2xl", 
    large: "max-w-4xl"
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className={`bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-gray-200 rounded-2xl ${sizeClasses[size]} w-full m-4`}>
        <div className="flex justify-between items-center p-4 border-b border-zinc-800 dark:border-zinc-800 light:border-gray-200">
          <div className="font-semibold">{title}</div>
          <button className="text-zinc-400 hover:text-zinc-200 transition-colors" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

function Card({ title, children, className = "" }) {
  return (
    <div className={`bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-800 dark:border-zinc-800 light:border-gray-200 rounded-2xl p-3 ${className}`}>
      {title && <div className="text-sm font-semibold mb-2 text-zinc-200 dark:text-zinc-200 light:text-slate-700">{title}</div>}
      {children}
    </div>
  );
}

function Badge({ children }) {
  return <span className="inline-flex items-center px-2 py-1 rounded-lg bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 border border-zinc-700 dark:border-zinc-700 light:border-gray-300 text-xs">{children}</span>;
}

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button className={`px-3 py-2 rounded-lg bg-orange-500 text-white font-medium hover:bg-orange-400 transition-colors ${className}`} {...props}>
      {children}
    </button>
  );
}

function GhostButton({ children, className = "", ...props }) {
  return (
    <button className={`px-2 py-1 rounded border border-zinc-700 dark:border-zinc-700 light:border-gray-300 bg-zinc-800/60 dark:bg-zinc-800/60 light:bg-gray-50 hover:bg-zinc-700 dark:hover:bg-zinc-700 light:hover:bg-gray-100 transition-colors ${className}`} {...props}>
      {children}
    </button>
  );
}

function LabeledInput({ label, ...props }) {
  return (
    <label className="grid gap-1 text-sm">
      <span className="text-zinc-300 dark:text-zinc-300 light:text-slate-600">{label}</span>
      <input className="bg-zinc-900 dark:bg-zinc-900 light:bg-white border border-zinc-700 dark:border-zinc-700 light:border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 transition-colors" {...props} />
    </label>
  );
}

function ActivityItem({ who, what, file, when }) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-zinc-700 dark:bg-zinc-700 light:bg-gray-300" />
        <span className="text-zinc-300 dark:text-zinc-300 light:text-slate-600">
          <strong className="text-zinc-100 dark:text-zinc-100 light:text-slate-800">{who}</strong> {what} {file}
        </span>
      </div>
      <span className="text-zinc-500">{when}</span>
    </div>
  );
}

function Person({ name, status }) {
  const dot = status === "online" ? "bg-emerald-500" : status === "idle" ? "bg-amber-500" : "bg-zinc-600";
  return (
    <div className="flex items-center justify-between text-sm py-1.5">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-zinc-700 dark:bg-zinc-700 light:bg-gray-300" />
        <span className="text-zinc-200 dark:text-zinc-200 light:text-slate-700">{name}</span>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
    </div>
  );
}

function Thumb({ label }) {
  return (
    <div className="rounded-xl border border-zinc-700 dark:border-zinc-700 light:border-gray-300 bg-zinc-900 dark:bg-zinc-900 light:bg-white p-2">
      <div className="h-24 rounded bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 grid place-items-center text-xs text-zinc-400">thumb</div>
      <div className="mt-2 text-xs text-zinc-300 dark:text-zinc-300 light:text-slate-600">{label}</div>
    </div>
  );
}

function Message({ from, text, mine, ai }) {
  const bubble = mine
    ? "bg-blue-600 text-white ml-auto"
    : ai
    ? "border border-blue-500/60 bg-zinc-900 dark:bg-zinc-900 light:bg-blue-50 dark:text-zinc-100 light:text-blue-900"
    : "bg-zinc-800 dark:bg-zinc-800 light:bg-gray-100 text-zinc-100 dark:text-zinc-100 light:text-slate-800";
    
  return (
    <div className={`max-w-[70%] w-fit rounded-2xl px-3 py-2 ${bubble}`}> 
      <div className="text-[11px] opacity-70 mb-0.5">{from}</div>
      <div className="text-sm leading-relaxed">{text}</div>
    </div>
  );
}