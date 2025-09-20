# Overview

Muzika is a comprehensive music distribution platform that enables artists, labels, and teams to upload, distribute, and track music releases across major streaming platforms like Spotify, Apple Music, and others. The application provides a complete workflow from release creation and quality control to revenue tracking and payout management.

The platform features a multi-step release wizard, comprehensive dashboard analytics, admin quality control workflows, and integrations with external services for file storage and payment processing.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **React + TypeScript**: Modern React application built with TypeScript for type safety
- **Vite**: Fast build tool and development server with hot module replacement
- **Wouter**: Lightweight client-side routing library for navigation
- **TanStack Query**: Server state management for API data fetching and caching
- **Shadcn/ui**: Component library built on Radix UI primitives with Tailwind CSS styling
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development

## Backend Architecture
- **Node.js + Express**: RESTful API server with middleware for logging, authentication, and error handling
- **TypeScript**: Full-stack type safety with shared schema definitions
- **Session-based Authentication**: Express sessions with PostgreSQL storage via connect-pg-simple
- **Modular Route Structure**: Clean separation of concerns with dedicated route handlers and storage layer

## Database Architecture
- **PostgreSQL**: Primary database using Neon serverless PostgreSQL
- **Drizzle ORM**: Type-safe database queries with schema-first approach
- **Schema Design**: Comprehensive data model including users, organizations, artists, releases, tracks, splits, quality control items, audit logs, and reporting data
- **Multi-tenancy**: Organization-based data isolation with role-based access control

## Authentication & Authorization
- **Replit Auth**: OpenID Connect integration for seamless authentication in Replit environment
- **Passport.js**: Authentication middleware with custom strategy implementation
- **Role-based Access**: Multiple user roles (ARTIST, LABEL, TEAM, ADMIN) with different permission levels
- **Session Management**: Secure session handling with PostgreSQL-backed session store

## File Management
- **Upload System**: Structured file upload handling for audio files (WAV/FLAC) and artwork (3000x3000px images)
- **File Validation**: Comprehensive validation for file types, sizes, and specifications
- **Storage Integration**: Prepared for cloud storage integration (S3-compatible)

## Quality Control System
- **Multi-stage Review**: Draft → In Review → Approved → Delivering → Delivered workflow
- **Admin Queue**: Centralized quality control interface for administrators
- **Issue Tracking**: Severity-based issue reporting (INFO, WARN, ERROR)
- **Audit Logging**: Comprehensive activity tracking for compliance and debugging

## Data Architecture
- **Shared Types**: Common TypeScript interfaces shared between frontend and backend
- **API Layer**: RESTful endpoints following consistent patterns
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Query Optimization**: Efficient database queries with proper indexing strategy

# External Dependencies

## Core Infrastructure
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Environment**: Development and hosting platform with built-in authentication

## Planned Integrations
- **Stripe Connect**: Payment processing and payout management for revenue distribution
- **Cloud Storage**: File storage service (AWS S3 or compatible) for audio and artwork files
- **Music Distribution APIs**: Integration with streaming platform APIs for release delivery
- **Analytics Services**: Third-party analytics for detailed streaming and revenue insights

## Development Tools
- **Drizzle Kit**: Database migration and schema management
- **ESBuild**: Fast JavaScript bundling for production builds
- **PostCSS**: CSS processing with Tailwind CSS compilation

## UI Dependencies
- **Radix UI**: Accessible component primitives for complex UI patterns
- **Lucide React**: Comprehensive icon library
- **React Hook Form**: Form state management with validation
- **Date-fns**: Date manipulation and formatting utilities

The system is architected for scalability with clear separation between presentation, business logic, and data layers, making it easy to extend with additional features and integrations.