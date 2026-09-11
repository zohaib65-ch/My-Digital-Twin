# Ask My Digital Twin

An AI-powered personal knowledge system for **Muhammad Zohaib** — built with a production-quality **Retrieval-Augmented Generation (RAG)** pipeline.

Visitors can ask questions about Zohaib's skills, projects, experience, services, and more. Every answer is grounded in a real knowledge base, not fabricated by AI.

---

## What is RAG?

**Retrieval-Augmented Generation** is an architecture that combines:

1. **Retrieval** — finding relevant documents from a knowledge base using semantic search
2. **Generation** — using an LLM to produce a grounded answer from the retrieved context

This prevents hallucination by ensuring the AI only speaks from verified information.

```
User Question → Embedding → Vector Search → Relevant Context → LLM → Grounded Answer
```

---

## Architecture

```mermaid
graph TD
    subgraph "Ingestion Pipeline (npm run ingest)"
        A["Knowledge Markdown Files"] --> B["Document Processor"]
        B --> C["Text Extraction & Cleaning"]
        C --> D["Chunking (800 chars, 200 overlap)"]
        D --> E["Metadata Generation"]
        E --> F["Gemini Embeddings (gemini-embedding-001)"]
        F --> G["MongoDB Atlas Storage"]
    end

    subgraph "Query Pipeline (Runtime)"
        H["User Question"] --> I["Query Embedding (same model)"]
        I --> J["MongoDB Atlas $vectorSearch"]
        J --> K["Optional Metadata Filter"]
        K --> L["Similarity Threshold (≥ 0.65)"]
        L --> M{"Chunks found?"}
        M -->|Yes| N["RAG Prompt Construction"]
        M -->|No| O["Grounded Fallback"]
        N --> P["Gemini 2.5 Flash (Streaming)"]
        P --> Q["Answer + Source Citations"]
    end

    subgraph "Frontend"
        R["Chat UI"] --> H
        Q --> R
        O --> R
    end

    G -.-> J
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Lucide React |
| Embeddings | Google Gemini (`gemini-embedding-001`) |
| Generation | Google Gemini (`gemini-3.6-flash`) |
| Database | MongoDB Atlas |
| Vector Search | MongoDB Atlas Vector Search |
| SDK | `@google/genai` |

---

## Gemini Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key
3. Add it to `.env.local`:

```env
GEMINI_API_KEY=your-api-key-here
```

The project uses two Gemini capabilities:
- **`gemini-embedding-001`** — generates 768-dimensional embeddings for semantic search
- **`gemini-3.6-flash`** — generates streaming answers from retrieved context

---

## MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a database user
3. Whitelist your IP
4. Get the connection string and add to `.env.local`:

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
```

### Vector Search Index

After running ingestion, create a Vector Search index in the Atlas UI:

1. Go to your cluster → **Atlas Search** → **Create Search Index**
2. Select **JSON Editor**
3. Database: `ask-my-twin`, Collection: `chunks`
4. Index name: `vector_index`
5. Paste this definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "metadata.category"
    },
    {
      "type": "filter",
      "path": "metadata.source"
    }
  ]
}
```

> **⚠️ IMPORTANT — Embedding Dimensions**
>
> The `numDimensions` value in the vector index **MUST** match the actual embedding dimensions returned by Gemini.
>
> The project is configured with `embeddingDimensions = 768` in `lib/config.ts`. The embedding module validates at runtime that Gemini actually returns vectors of this length. If there is a mismatch, the ingestion script will throw an error with instructions.
>
> If you change `embeddingDimensions` in `lib/config.ts`, you **MUST** also:
> 1. Delete all existing chunks from MongoDB
> 2. Recreate the vector index with the new `numDimensions`
> 3. Re-run ingestion

---

## Environment Variables

Create `.env.local` in the project root:

```env
GEMINI_API_KEY=your-gemini-api-key
MONGODB_URI=your-mongodb-connection-string
ADMIN_SECRET=your-admin-secret
```

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key (server-side only) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `ADMIN_SECRET` | Yes | Secret for admin API authentication |

> **Security**: These are never exposed to the browser. All Gemini and MongoDB calls run server-side.

---

## Installation

```bash
# Clone the repository
git clone <repo-url>
cd My-Digital-Twin

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your actual keys
```

---

## Knowledge Base Structure

The knowledge base lives in the `knowledge/` directory as Markdown files:

```
knowledge/
├── personal.md       # Bio, summary, location
├── skills.md         # Programming languages, frameworks, tools
├── projects.md       # Portfolio projects
├── experience.md     # Work history
├── services.md       # Freelance/consulting offerings
├── education.md      # Degrees, institutions
├── certifications.md # Professional certifications
├── achievements.md   # Awards, recognitions
├── contact.md        # Email, LinkedIn, GitHub
└── faq.md            # Common questions
```

Each file contains `[PLACEHOLDER]` markers that should be replaced with real information. The filename (without `.md`) becomes the chunk's `category` metadata.

---

## Running Ingestion

```bash
npm run ingest
```

This runs the full ingestion pipeline:

1. Reads all `.md` files from `knowledge/`
2. Cleans markdown formatting
3. Chunks text (~800 chars with 200 char overlap)
4. Generates metadata (category, source, title)
5. Creates content hashes for deduplication
6. Generates Gemini embeddings (768 dimensions)
7. Validates embedding dimensions match configuration
8. Stores chunks + embeddings in MongoDB Atlas

The script is **idempotent** — unchanged documents are skipped via content hashing.

---

## Starting the Application

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Visit:
- **Landing page**: http://localhost:3000
- **Chat**: http://localhost:3000/chat
- **Admin**: http://localhost:3000/admin

---

## How Retrieval Works

When a user asks a question:

1. **Embedding**: The question is embedded using `gemini-embedding-001` (same model as ingestion)
2. **Vector Search**: MongoDB Atlas `$vectorSearch` finds the most semantically similar chunks
3. **Metadata Filtering**: If the question clearly targets a specific category (≥2 keyword hits), a pre-filter is applied inside `$vectorSearch`
4. **Fallback**: If filtered search returns too few results, an unfiltered search runs automatically
5. **Similarity Threshold**: Only chunks with score ≥ 0.65 are kept
6. **No-Context Guard**: If zero chunks pass the threshold, Gemini is NOT called — a grounded fallback message is returned instead

---

## How the RAG Prompt Works

The system prompt instructs Gemini to act as Zohaib's "digital twin":

- Answer **only** from the retrieved context
- Never invent or assume information
- Clearly state when information is unavailable
- Keep answers concise (1-4 sentences)
- Do not expose internal implementation details

Retrieved chunks are formatted with source attribution:
```
[Source 1: skills.md (skills)]
<chunk content>

---

[Source 2: projects.md (projects)]
<chunk content>
```

---

## How Source Citations Work

Every RAG response includes source citations:

```json
[
  { "source": "skills.md", "category": "skills", "score": 0.87 },
  { "source": "projects.md", "category": "projects", "score": 0.82 }
]
```

- **source**: The knowledge base file that contributed to the answer
- **category**: The knowledge category
- **score**: Highest similarity score for chunks from that source

Sources are displayed as color-coded badges below each AI response.

---

## How Debug Mode Works

Toggle the **Debug** switch in the chat header to see:

- **Embedding time**: How long query embedding took
- **Retrieval time**: How long vector search took
- **Total time**: Full pipeline duration
- **Detected category**: Whether a metadata filter was applied
- **Retrieved chunks**: Each chunk with its content and similarity score
- **Assembled context**: The exact context sent to Gemini

Debug mode **never** exposes `GEMINI_API_KEY`, `MONGODB_URI`, or `ADMIN_SECRET`.

---

## SSE Streaming Format

The `/api/chat` endpoint uses proper Server-Sent Events:

```
event: token
data: {"text":"Zohaib"}

event: token
data: {"text":" is a full-stack developer."}

event: sources
data: [{"source":"skills.md","category":"skills","score":0.87}]

event: done
data: {}
```

Error events:
```
event: error
data: {"message":"..."}
```

---

## Project Structure

```
app/
├── page.tsx              # Landing page
├── layout.tsx            # Root layout (dark theme)
├── globals.css           # Tailwind + custom animations
├── chat/
│   └── page.tsx          # Chat interface
├── admin/
│   └── page.tsx          # Admin dashboard
└── api/
    ├── chat/
    │   └── route.ts      # POST — streaming RAG chat
    ├── ingest/
    │   └── route.ts      # POST — trigger ingestion (protected)
    └── admin/
        └── stats/
            └── route.ts  # GET — knowledge base stats (protected)

components/
├── chat/
│   ├── chat-container.tsx   # Main chat orchestrator
│   ├── chat-input.tsx       # Input with auto-resize
│   ├── message-bubble.tsx   # User/assistant messages
│   ├── welcome-screen.tsx   # Initial suggested questions
│   ├── typing-indicator.tsx # Loading animation
│   └── debug-panel.tsx      # RAG pipeline inspector
├── sources/
│   └── source-list.tsx      # Citation badges
├── admin/
│   └── admin-dashboard.tsx  # Stats + ingestion controls
└── ui/                      # shadcn/ui components

lib/
├── config.ts       # Centralized configuration
├── types.ts        # TypeScript interfaces
├── mongodb.ts      # MongoDB connection singleton
├── gemini.ts       # Gemini generation (streaming + non-streaming)
├── embeddings.ts   # Embedding generation with dimension validation
├── documents.ts    # Document processing pipeline
├── retrieval.ts    # Vector search + metadata filtering
├── prompt.ts       # System prompt + context formatting
├── rag.ts          # RAG orchestration (main entry point)
└── utils.ts        # shadcn/ui utilities

knowledge/          # Markdown knowledge base (10 files)
scripts/
└── ingest.ts       # CLI ingestion script
```

---

## Configuration Reference

All RAG parameters are centralized in `lib/config.ts`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `embedding.model` | `gemini-embedding-001` | Embedding model |
| `embedding.dimensions` | `768` | Output vector dimensions |
| `generation.model` | `gemini-3.6-flash` | Generation model |
| `chunking.chunkSize` | `800` | Target chunk size (chars) |
| `chunking.chunkOverlap` | `200` | Overlap between chunks |
| `retrieval.topK` | `5` | Number of chunks to retrieve |
| `retrieval.similarityThreshold` | `0.65` | Minimum similarity score |
| `mongodb.database` | `ask-my-twin` | Database name |
| `mongodb.collection` | `chunks` | Collection name |
| `mongodb.vectorIndex` | `vector_index` | Vector search index name |

---

## License

MIT
