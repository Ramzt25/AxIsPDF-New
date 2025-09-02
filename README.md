# TeamBeam - Local Bluebeam with Brains

A local, offline-first, scriptable PDF construction tool for Windows that rivals core Bluebeam workflows and adds real automation/intelligence plus construction meeting capabilities.

## 🚧 Project Status: Phase 1 Development

This is an active construction project. Current focus: **Headless PDF Robot** (Phase 1).

## 🎯 Vision

- **Local & Offline**: All core features work without internet
- **Windows-first**: PowerShell build/run scripts, native performance  
- **Performance**: Handle 500–1,000 page PDFs smoothly with tiled rendering
- **Determinism**: Batch pipelines produce consistent output across machines
- **Security**: Sandboxed scripting, no arbitrary shell unless explicitly enabled
- **AI-Enhanced**: Local + cloud models for intelligent document processing
- **Meeting-Native**: WebRTC rooms built for construction workflows

## 📋 Roadmap

### Phase 1 - Headless "PDF Robot" ✅ *In Progress*
- [x] Project structure and build system
- [ ] Batch PDF processing (glob patterns)
- [ ] Text extraction + OCR for scanned pages
- [ ] Simple stamping (text/image) at coordinates
- [ ] CLI + YAML pipeline runner
- [ ] Save/SaveAs, page range, rotate, insert/extract

### Phase 2 - Viewer + Annotation Layer
- Electron + React viewer with fast zoom/pan
- Annotation tools (rectangle, ellipse, arrow, text, stamps)
- Undo/redo, layer toggles
- Flatten annotations to PDF

### Phase 3 - Scripting Engine  
- JavaScript (Node VM) scripting with safe API
- YAML Pipeline DSL
- Sandboxed execution environment

### Phase 4 - Intelligence
- Title block reader with configurable templates
- Page labeler (A-101, E-201 auto-detection)
- Symbol detection for electrical symbols
- Structured exports (CSV/JSON)

### Phase 5 - Meeting Features & Pro Tools
- WebRTC construction meeting rooms
- AI note-taking and action item extraction
- Measurement tools with calibration
- Watermarking, password protection
- Customer profiles and cached thumbnails

## 🛠️ Quick Start

### Prerequisites
```powershell
# Install Scoop (package manager)
irm https://get.scoop.sh | iex

# Install dependencies
scoop install nodejs-lts python tesseract
```

### Setup
```powershell
git clone <repo> TeamBeam
cd TeamBeam
corepack enable
pnpm install
```

### Development
```powershell
# Start development environment
pwsh .\scripts\run.ps1

# Run CLI pipeline
pwsh .\scripts\build.ps1
node .\dist\cli\index.js run --pipeline .\configs\pipeline-examples\approve-and-label.yml

# Package application
pwsh .\scripts\pack.ps1
```

## 🏗️ Architecture

### Tech Stack
- **Desktop**: Electron 30+ + React + Vite + Tailwind
- **PDF Engine**: PDFium bindings (high-performance render/text extraction)
- **OCR**: Tesseract via tesseract.js + native binary
- **Vision**: OpenCV (opencv4nodejs) + optional ONNX Runtime
- **Scripting**: Node VM (isolated context) + optional Lua
- **Storage**: SQLite (better-sqlite3) for job history and caching
- **Config**: YAML with JSON Schema validation (AJV)
- **Meeting**: WebRTC + SFU for construction meetings

### Key Components
```
/app          - Electron application (renderer + main process)
/core         - Business logic (PDF, OCR, Vision, Pipeline, AI)
/cli          - Command-line interface
/configs      - YAML pipelines, templates, stamps
/scripts      - PowerShell build/run/test scripts
/tests        - Unit and E2E tests
```

## 📖 Pipeline Example

```yaml
# configs/pipeline-examples/approve-and-label.yml
foreach:
  files: "C:/Drawings/**/*.pdf"
  steps:
    - open: "${file.path}"
    - ocr:
        pages: "scanned|auto"
        lang: "eng"
        psm: 3
    - find_text:
        name: "sheet_no"
        query: ["SHEET NO:", "SHT NO:"]
        region: { anchor: "top-right", width: 0.28, height: 0.25 }
        regex_after: "\\b([A-Z]-\\d{2,3})\\b"
    - stamp:
        template: "Approved.png"
        position: { anchor: "bottom-right", dx: -36, dy: -36 }
        opacity: 0.9
    - save_as: "C:/Output/${file.name}.approved.pdf"
```

## 🔒 Security & Privacy

- **Local-first**: Everything works offline; cloud sync is opt-in
- **Sandboxed scripting**: No file system or network access by default
- **Encrypted storage**: Local DB encrypted at rest
- **Meeting privacy**: E2E encryption for control data, explicit recording consent

## 🎯 Performance Targets

- **Render**: 45+ FPS while panning/zooming
- **Memory**: <2.5GB peak for 1000-page PDFs  
- **OCR**: 6+ pages per minute on 8-core laptop
- **Precision**: Stamps within ±1px at 300 DPI

## 📝 Contributing

See [Development Guide](./docs/DEVELOPMENT.md) for setup instructions, coding standards, and testing procedures.

## 📄 License

[License TBD - Commercial/Open Source Hybrid]

---

**Built for the field. Engineered for the office. Intelligent by design.**