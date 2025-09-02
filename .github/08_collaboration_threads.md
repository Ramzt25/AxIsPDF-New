08_collaboration_threads.md
Collaboration Review System Prompt
Features

Pinned chat threads tied to sheet regions

Threads include messages, mentions, attachments, markups

Left panel: thread list; right panel: active thread

Exportable minutes (JSON/CSV/PDF)

Revision Awareness

Threads tied to project, sheet, revision, bbox

Auto-carry threads to new revisions if region unchanged

If region changed, flag as check against Rev X

AI suggests obsolete/duplicate threads

Integration

Promote thread → Task or RFI

Tasks/RFIs sync with project dashboard

Schema
{
  "id": "uuid",
  "projectId": "uuid",
  "sheetId": "uuid",
  "revision": "string",
  "bbox": [x,y,w,h],
  "status": "open|resolved|obsolete",
  "messages": [ ... ]
}
Acceptance Criteria

Create and reply to threads

Sync across collaborators

Revision updates carry or flag threads

Exported minutes match thread states

AI suggestions previewed before apply

Tasks/RFIs generated correctly