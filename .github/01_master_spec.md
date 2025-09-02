01_master_spec.md
FieldBeam Master Spec — Local Bluebeam with Brains

This document defines the master build specification for FieldBeam, the desktop-first, offline-capable PDF collaboration and construction intelligence platform.

Architecture

Core app: Electron + React.

Rendering: PDFium/MuPDF for smooth zoom/pan.

Annotations: JSON overlay, flatten on export.

OCR & Vision: Tesseract + OpenCV/ONNX.

Storage: SQLite (offline-first).

Scripting: YAML/DSL with safe API (open, ocr, findText, placeStamp, export, save).

Modules

Viewer/editor

Annotation tools

RFI/submittals/punchlist workflows

AI extraction (title block, symbols, revisions)

Toolbox (parametric tools)

Meetings (waiting room, shared sheet, recording, AI minutes)

Calendar integration (Google/Outlook)

Sync engine (offline-first)

Placeholder tracking (see 03)

Deliverables

Fully functional desktop app (mobile stubbed).

Docs, schemas, pipeline DSL, placeholder tracker.