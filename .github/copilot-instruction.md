# Copilot Instructions for FieldBeam

This file defines how agents and developers must use the **project prompts** stored in `.github/prompts/`.  

## Source of Truth
- **All prompts are stored under**:  
  `.github/prompts/`  

- **Each prompt file is a self-contained specification**. Examples include:  
  - `01_master_spec.md`  
  - `02_copilot_instruction.md`  
  - `03_placeholder_tracking.md`  
  - `04_calendar_meetings.md`  
  - `05_toolbox_spec.md`  
  - `06_features_vs_bluebeam.md`  
  - `07_roadmap_prompt.md`  
  - `08_collaboration_threads.md`

- Additional prompts may be added in the future. **Always scan this folder for new or updated files** before running or generating code.

## Required Behavior
1. **Reference before action**  
   - Before implementing or modifying any feature, read the relevant `.md` file(s) in `.github/prompts/`.  
   - If multiple prompts overlap, defer to the most recent file by `last modified` date.  

2. **Check for updates**  
   - On every build, pipeline, or agent run, check `.github/prompts/` for new prompt files.  
   - If a new file exists, include it in the knowledge context.  

3. **Do not hardcode** instructions inside agents or workflows. Always **pull live from the `.github/prompts/` directory**.  

4. **Placeholder tracking**  
   - Follow the instructions in `03_placeholder_tracking.md` to ensure all stubs/mocks are logged.  
   - This applies across all code generated from other prompts.  

5. **Reporting**  
   - Weekly, generate a summary of all prompts in `.github/prompts/` and note any unresolved placeholders, TODOs, or open items.  
   - Save this summary under `/docs/prompt-report.md`.  

## Purpose
This ensures:
- **Consistency**: all contributors (AI or human) follow the same instructions.  
- **Traceability**: every decision is linked to a versioned prompt file.  
- **Extensibility**: adding a new feature is as easy as dropping a new `.md` spec into `.github/prompts/`.

---
