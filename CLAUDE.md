# CLAUDE.md - Transcript Editor Project Guide

This file provides coding agents with essential information about the Transcript Editor project, following Anthropic's best practices for AI assistant collaboration.

## Product Description

A React application designed to help clean up and shorten interview transcripts using Large Language Models (LLMs), with painless verification of edits. It provides an intuitive interface for uploading, transcribing, and refining interview recordings using AI-transcription and LLM editing.

Key features:

- Audio file upload and transcription via Deepgram
- AI-powered transcript refinement using Google Gemini
- Nice audio-synced UI for verifying LLM output
- Recent transcripts management

## Tech Stack

### Frontend

- **React 19** with **TypeScript** - Modern React with latest features
- **Mantine** - UI component library for consistent design
- **Vite** - Fast build tool and dev server
- **TanStack Query** - Server state management and caching
- **React Context** - Local state management

### Backend & Infrastructure

- **PocketBase** - Embedded database for data persistence
- **Cloudflare Workers** - Serverless functions for AI processing
- **Deepgram SDK** - Audio transcription with speaker diarization
- **(DEPRECATED) OpenAI Whisper** - Alternative transcription service
- **Google Gemini** - AI model for text refinement

### Development & Testing

- **Vitest** - Unit and integration testing framework
- **Testing Coverage** - Comprehensive test coverage tracking
- **Pre-commit hooks** - Automated testing and build validation
- **GitHub Actions** - CI/CD pipeline

## Project Structure

```
/
├── src/                    # Main React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Route components
│   ├── services/          # API and external service integrations
├── worker/                # Cloudflare Workers for AI processing
├── shared/                # Shared TypeScript interfaces and utilities
│   ├── interfaces/        # Common type definitions
│   └── utils/            # Shared utility functions
├── tests/                 # Test files
├── .github/               # GitHub workflows and issue templates
└── public/                # Static assets
```

## Architecture & Design Patterns

### Frontend Architecture

- **Component-based architecture** with functional React components
- **Context + TanStack Query pattern** for state management
- **Custom hooks** for reusable logic encapsulation
- **Interface-based design** for type safety and maintainability

### Backend Architecture

- **Embedded database** pattern with PocketBase for simplified deployment
- **Serverless functions** for AI processing via Cloudflare Workers
- **Shared interfaces** between frontend and backend for type consistency

### Data Flow

1. User uploads audio file through React frontend
2. File is processed by Cloudflare Workers using Deepgram/Whisper
3. Transcription results stored in PocketBase
4. AI refinement processed through Google Gemini
5. Real-time updates via TanStack Query invalidation

## Code Style Guidelines

### TypeScript

- Use **strict TypeScript** configuration
- Define **interfaces** for all data structures
- Prefer **interface over type** for object definitions
- Export interfaces from shared locations

### React Components

- Use **functional components** with hooks
- Follow **interface-based prop definitions**
- Implement **proper error boundaries**
- Use **Mantine components** for UI consistency

### File Organization

- Group related files in feature-based folders
- Use **index.ts** files for clean imports
- Keep **shared utilities** in dedicated folders
- Maintain **consistent naming conventions**

### Testing

- Write tests for all components and utilities
- Use **Vitest** for testing framework
- Maintain **high test coverage**
- Include integration tests for critical paths

## Development Workflow

### Before Starting Work

1. Check existing components and patterns
2. Verify dependencies in package.json
3. Run tests to ensure clean starting state
4. Review recent commits for context

### During Development

1. Follow existing code patterns and conventions
2. Use TypeScript interfaces for type safety
3. Implement proper error handling
4. Add appropriate tests for new functionality

### Before Committing

1. Run `npm test` to verify all tests pass
2. Run `npm run build` to ensure clean build
3. Check for TypeScript errors
4. Verify no secrets or sensitive data are included

## Common Commands

```bash
# Development
npm run dev          # Start development server
npm run test            # Run tests
npm run build       # Build for production

# Database
npm run pocketbase  # Start PocketBase server

# Deployment
npm run deploy      # Deploy to Cloudflare
```

## Best Practices for AI Assistants

### Code Analysis

- Always read existing files before making changes
- Understand the current codebase patterns
- Check for existing similar implementations
- Verify dependencies are already installed

### Implementation

- Prefer editing existing files over creating new ones
- Follow established naming conventions
- Use existing UI components (Mantine)
- Implement proper TypeScript typing

### Testing

- Run tests after making changes
- Add tests for new functionality
- Ensure builds pass before completion
- Verify no regressions introduced

### Security

- Never commit API keys or secrets
- Use environment variables for configuration
- Follow secure coding practices
- Validate all user inputs

## Integration Points

### External Services

- **Deepgram API** - Audio transcription
- **OpenAI Whisper** - Alternative transcription (deprecated)
- **Google Gemini** - Text refinement
- **Cloudflare Workers** - Serverless processing

### Database Schema

Our database uses a pocketbase instance to handle file upload as well as database entries.

Our database consists of three main objects: TranscriptMeta, TranscriptData, and a File.

#### TranscriptMeta

This object stores the high-level metadata for a transcript. It includes details like the title, created_at, updated_at, and a file_id that points to the associated media file. Each TranscriptMeta record has a one-to-many relationship with TranscriptData entries and one-to-one relationship with a file.

#### File

This is a database record that corresponds to the original audio file. The file_id in the TranscriptMeta object establishes a one-to-one relationship with a File record.

#### TranscriptData

This object holds the actual content of a transcript at a specific point in time. It contains the segments of the transcript. The meta_id field links each TranscriptData record back to its parent TranscriptMeta. The previous_did allows for versioning by pointing to the preceding TranscriptData entry.

This document should be updated as the project evolves to maintain accuracy for future AI assistant collaborations.
