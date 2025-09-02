# AxIs Desktop - Comprehensive Testing Guide

## 🚀 Quick Start Testing

### Prerequisites
- Windows 10/11 (primary platform)
- Node.js 18+ installed
- Git installed

### Setup for Testing
```bash
cd c:\Users\tramsey\Projects\TeamBeam\desktop
npm install
npm run build:main  # Build Electron main process
npm run dev        # Start full AxIs app
```

## 📋 Core Feature Tests

### 1. Application Launch & Developer Mode
**Test ID: APP-001**
- [ ] Application launches without errors
- [ ] Developer mode banner is visible at top
- [ ] Login modal appears on first launch
- [ ] Console shows no critical errors

**Steps:**
1. Run `npm run dev`
2. Verify Electron window opens
3. Check for developer mode banner: "🚀 DEVELOPER MODE ACTIVE"
4. Verify login modal is displayed

**Expected Results:**
- Clean application startup
- Developer features enabled
- Professional UI appearance

---

### 2. Authentication & Quick Login
**Test ID: AUTH-001**
- [ ] Quick login buttons work (Admin/User)
- [ ] Guest portal access functions
- [ ] Regular login form accepts input
- [ ] User state persists between sessions

**Steps:**
1. Click "Admin" quick login button
2. Verify immediate authentication
3. Check user status bar shows "ADMIN" badge
4. Restart app, verify admin state persists

**Expected Results:**
- Instant authentication for development
- Proper role-based access
- State persistence

---

### 3. Social Dashboard Functionality
**Test ID: SOCIAL-001**
- [ ] Dashboard loads with all sections
- [ ] Activity feed displays sample data
- [ ] Meeting invitations are interactive
- [ ] Search functionality works
- [ ] Filter buttons respond correctly

**Steps:**
1. Navigate to `/#/social` or click social link
2. Verify all dashboard sections load
3. Test search box with "markup" keyword
4. Click different activity filters
5. Interact with meeting invitation cards

**Expected Results:**
- Complete dashboard renders
- Interactive elements respond
- Real-time UI updates
- Professional appearance

---

### 4. Guest Portal Experience
**Test ID: GUEST-001**
- [ ] Portal displays sample projects
- [ ] Feature comparisons are clear
- [ ] Pricing cards are attractive
- [ ] Upgrade CTAs are prominent
- [ ] Browser compatibility maintained

**Steps:**
1. Navigate to `/#/guest-portal`
2. Explore sample projects
3. Review feature comparison table
4. Test upgrade buttons
5. Verify responsive design

**Expected Results:**
- Compelling sales experience
- Clear value proposition
- Professional presentation
- Encourages subscription

---

### 5. Navigation & Routing
**Test ID: NAV-001**
- [ ] All routes work correctly
- [ ] Back/forward browser buttons function
- [ ] Sidebar navigation is responsive
- [ ] Menu items trigger correct actions

**Routes to test:**
- `/` - Main dashboard
- `/social` - Social dashboard
- `/guest-portal` - Guest experience
- `/pipeline-editor` - Pipeline tools
- `/batch-processor` - Batch operations
- `/fieldbeam-meetings` - Meeting management
- `/preferences` - Settings

---

### 6. Electron-Specific Features
**Test ID: ELECTRON-001**
- [ ] Window state persistence (size, position)
- [ ] Menu bar integration works
- [ ] File system access functions
- [ ] Local storage operations work
- [ ] System integration (notifications, taskbar)

**Steps:**
1. Resize application window
2. Move window to different position
3. Close and reopen application
4. Verify window state is restored
5. Test menu items (File, Edit, View, Tools)

---

### 7. Performance & Responsiveness
**Test ID: PERF-001**
- [ ] Application starts within 3 seconds
- [ ] UI interactions are smooth (60fps)
- [ ] Memory usage stays reasonable
- [ ] No memory leaks during extended use
- [ ] Responsive design works on different screen sizes

**Tools:**
- Task Manager for memory monitoring
- Chrome DevTools for performance profiling
- Multiple monitor setups for responsive testing

---

### 8. Error Handling & Edge Cases
**Test ID: ERROR-001**
- [ ] Graceful handling of network failures
- [ ] Proper error messages for user actions
- [ ] Recovery from unexpected states
- [ ] Console error logging is clean

**Steps:**
1. Disable internet connection
2. Try features that require network
3. Verify graceful degradation
4. Check error messages are user-friendly

---

## 🔧 Development Testing Tools

### Running Unit Tests
```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:coverage      # With coverage report
npm run test:watch         # Watch mode for development
```

### Manual Testing Checklist

#### Daily Development Testing
- [ ] `npm run dev` starts without errors
- [ ] Login modal appears and functions
- [ ] Quick admin login works
- [ ] Social dashboard loads completely
- [ ] No console errors during basic navigation

#### Pre-Release Testing
- [ ] All automated tests pass
- [ ] Full feature walkthrough completed
- [ ] Performance benchmarks met
- [ ] Cross-platform compatibility verified
- [ ] User feedback incorporated

#### Integration Testing
- [ ] WebSocket connections work
- [ ] Real-time collaboration features
- [ ] File operations (open/save)
- [ ] System integration points
- [ ] Teams integration (when available)

---

## 🐛 Known Issues & Workarounds

### Current Warnings (Non-blocking)
1. **Font Loading Warning**: `Failed to decode downloaded font: Roboto-Regular.ttf`
   - **Impact**: Cosmetic only, fallback fonts work
   - **Workaround**: System fonts are used instead

2. **React Router Future Flags**: Deprecation warnings
   - **Impact**: None, future compatibility flags added
   - **Status**: Fixed in latest version

3. **Browser Extension Messages**: Chrome extension conflicts
   - **Impact**: None on application functionality
   - **Workaround**: Disable non-essential browser extensions

### Debugging Tips
- Use Chrome DevTools for frontend debugging
- Check Electron main process logs in terminal
- Monitor WebSocket connections in Network tab
- Use React Developer Tools for component inspection

---

## 🎯 Success Criteria

### Minimum Viable Product (MVP)
- ✅ Application launches reliably
- ✅ Authentication system works
- ✅ Social dashboard displays correctly
- ✅ Guest portal encourages upgrades
- ✅ Navigation between features works
- ✅ Desktop integration functions

### Production Ready
- [ ] All automated tests pass (>90% coverage)
- [ ] Performance benchmarks met
- [ ] User acceptance testing completed
- [ ] Security audit passed
- [ ] Cross-platform testing completed
- [ ] Documentation comprehensive

---

## 📊 Testing Metrics

### Coverage Targets
- Unit Tests: >80% line coverage
- Integration Tests: All major user flows
- Manual Tests: 100% feature coverage
- Performance: <3s startup, <100ms interactions

### Quality Gates
- No critical bugs
- No console errors during normal use
- Professional UI/UX throughout
- Reliable desktop integration
- Scalable architecture foundation

---

## 🚀 Next Phase Testing

### When PDF Engine is Added
- PDF loading and rendering tests
- Markup tool functionality
- Real-time collaboration on documents
- Performance with large PDF files

### When Teams Integration is Live
- Microsoft Graph API integration
- Webhook handling
- Adaptive Cards functionality
- Real-time synchronization

### When AI Features are Added
- ML model integration tests
- AI-powered markup detection
- Performance with AI processing
- Accuracy metrics for AI features

---

**Happy Testing! 🎉**

This comprehensive testing approach ensures AxIs Desktop is ready for professional use while maintaining high quality standards.