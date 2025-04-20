# Transcript Editor

An application that uses LLM to edit interview transcripts through a three-stage process.

## Project Overview

The Transcript Editor is designed to help users edit interview transcripts using AI assistance. The editing process consists of three stages:

1. **Light Touch Edit**: Initial cleanup of raw transcript, removing speech artifacts while maintaining original content
2. **Content Refinement**: Improving readability while preserving the speaker's voice and important content
3. **Review**: Side-by-side comparison of original and final versions

## Technical Stack

### Frontend

- React with TypeScript
- Tailwind CSS
- Monaco Editor
- React Split Pane

### Backend

- FastAPI
- SQLite/PostgreSQL
- OpenAI API integration

## Project Structure

```
transcript_editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── public/
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── tests/
│   └── requirements.txt
└── README.md
```

## Implementation Phases

1. **Phase 1: Setup and Basic Infrastructure**

   - Project initialization
   - Basic frontend and backend setup
   - File upload and storage

2. **Phase 2: Core Editing Features**

   - LLM integration
   - Light touch editing implementation
   - Basic UI for editing

3. **Phase 3: Advanced Features**

   - Content refinement
   - Version comparison
   - Export functionality

4. **Phase 4: Polish and Optimization**
   - UI/UX improvements
   - Performance optimization
   - Error handling
   - Documentation

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- Python (v3.8 or higher)
- OpenAI API key

### Installation

1. Clone the repository
2. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Install backend dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

### Running the Application

1. Start the backend server:

   ```bash
   cd backend
   uvicorn app.main:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

## Development

- Frontend runs on http://localhost:3000
- Backend runs on http://localhost:8000
- API documentation available at http://localhost:8000/docs

## License

MIT
