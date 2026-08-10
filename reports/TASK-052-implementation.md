# TASK-052 Implementation Report

## Outcome

`VERIFIED`. PDF extraction now imports the native canvas package explicitly,
installs the Node.js canvas globals before loading `pdf-parse`, and keeps the
parser behind the existing extraction-only dynamic import.

## Changes

- Declared `@napi-rs/canvas@0.1.80` as a direct production dependency.
- Made the native dependency statically visible to Next.js file tracing.
- Deferred `pdf-parse` loading until `DOMMatrix`, `ImageData`, and `Path2D` exist.
- Added a deterministic, valid PDF with a real text layer to the extractor test.
- Preserved TXT, Markdown, DOCX, chunking, API, database, auth, and AI contracts.

## Runtime evidence

The final production build trace for the extraction route contains five canvas
package files, one platform native `.node` binary, and twenty `pdf-parse` files.
The existing service regression confirms unrelated content APIs do not execute the
document extractor eagerly.

## Release scope

No database change, push, deployment, environment update, or production mutation
was performed.
