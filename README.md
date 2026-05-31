

## Data Flow Diagram (DFD)

This app is a **voice-notes + translator** system:

- **Frontend**: React (Vite) UI, browser SpeechRecognition/SpeechSynthesis, PDF/TXT export
- **Backend**: FastAPI + SQLite (users + notes) + JWT auth
- **External API**: LibreTranslate for translation

### DFD Level 0 (Context)

```mermaid
flowchart LR
  U[User] -->|login/register, speak, save notes,\ntranslate, export| SYS[Voxora.ai System\n(Frontend + Backend)]
  SYS -->|UI pages, transcripts, notes,\ntranslations, downloads| U

  SYS <-->|audio → transcript| SR[Browser SpeechRecognition]
  SYS <-->|text → audio| SS[Browser SpeechSynthesis]
  SYS <-->|translate request/response| LT[LibreTranslate API]
```

### DFD Level 1 (Decomposition)

```mermaid
flowchart TB
  %% External entities
  U[User]
  SR[Browser SpeechRecognition]
  SS[Browser SpeechSynthesis]
  LT[LibreTranslate API]

  %% Data store
  DB[(SQLite DB\napp.db\nusers, notes)]

  %% Processes
  P1[Auth\n/register /login /me]
  P2[Voice Capture &\nTranscription]
  P3[Notes Management\nlist/create/delete]
  P4[Translation\n/api/translate]
  P5[Summarization\n(client)]
  P6[Export\nPDF/TXT (client)]

  %% Flows
  U -->|email/password| P1
  P1 -->|JWT token + user| U
  P1 <--> DB

  U -->|start/stop mic| P2
  P2 <--> SR
  P2 -->|transcript text| U
  U -->|speak text| SS

  U -->|save/list/delete notes| P3
  P3 <--> DB
  P3 -->|notes list + status| U

  U -->|text + target_lang| P4
  P4 <--> LT
  P4 -->|translated text| U

  U -->|text| P5
  P5 -->|summary| U

  U -->|export note| P6
  P6 -->|downloaded PDF/TXT| U
```

