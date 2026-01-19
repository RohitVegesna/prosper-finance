# Prosper - Personal Finance & Legacy Management Platform

## Overview

Prosper is a multi-tenant personal finance web application that helps users manage insurance policies and investments. The platform is designed to be maintained during a user's lifetime and eventually passed on to dependents. It supports multiple customers (tenants) separated by domain or subdomain, allowing independent use of the same platform.

**Core Features:**
- Dashboard with financial metrics and policy expiration tracking
- Insurance policy management with document uploads
- Investment tracking across multiple platforms
- Multi-tenant architecture with admin and user roles
- Secure username/password authentication with domain-based tenancy

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with custom design tokens
- **UI Components**: shadcn/ui (Radix primitives) with "new-york" style
- **Animations**: Framer Motion for page transitions
- **Forms**: React Hook Form with Zod validation

The frontend follows a pages-based structure in `client/src/pages/` with shared components in `client/src/components/`. Custom hooks in `client/src/hooks/` abstract data fetching logic.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints under `/api/`
- **Build Tool**: Vite for development, esbuild for production server bundling

The server uses a middleware pattern with authentication, tenant resolution, and route handlers. Routes are defined in `server/routes.ts` with typed API contracts in `shared/routes.ts`.

### Database Layer
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` and `shared/models/auth.ts`
- **Connection**: Connection pooling via `pg` driver

Key tables:
- `tenants`: Multi-tenant isolation
- `users`: User accounts with tenant association
- `policies`: Insurance policies per tenant
- `investments`: Investment records per tenant
- `sessions`: Session storage for authentication

### Authentication
- **Method**: Username/password with bcrypt hashing
- **Session Storage**: PostgreSQL-backed sessions via connect-pg-simple
- **Implementation**: Express middleware with session-based auth
- **Routes**: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/user`, `/api/auth/change-password`
- First user in a domain automatically becomes admin
- **Password Management**: 
  - Users can change their own password via Settings page (requires current password)
  - Admins can reset any user's password in their organization via Access Management page

### Multi-Tenancy Pattern
- Domain-based organization: users register with a domain identifier to join/create organizations
- Tenant ID stored on all major tables
- Tenant resolution happens via user's assigned tenant
- Admin users can manage tenant members

### File Storage
- **Provider**: Google Cloud Storage via Replit Object Storage
- **Upload Pattern**: Presigned URL flow (client uploads directly to storage)
- **Client Component**: Uppy for file upload UI
- Located in `server/replit_integrations/object_storage/`

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless Postgres, connection via `DATABASE_URL` or `NEON_DATABASE_URL` environment variable

### Authentication
- **Session Secret**: Requires `SESSION_SECRET` environment variable for session signing
- **Password Hashing**: Uses bcrypt with 10 salt rounds

### File Storage
- **Replit Object Storage**: Google Cloud Storage integration
- Accessed via sidecar endpoint at `http://127.0.0.1:1106`
- Optional `PUBLIC_OBJECT_SEARCH_PATHS` for public file access

### Key npm Dependencies
- `drizzle-orm` + `drizzle-kit`: Database ORM and migrations
- `@tanstack/react-query`: Server state management
- `@uppy/core` + `@uppy/dashboard`: File upload handling
- `@radix-ui/*`: Accessible UI primitives
- `bcrypt`: Password hashing
- `connect-pg-simple`: PostgreSQL session store
- `date-fns`: Date manipulation for policy expiration tracking
- `framer-motion`: Animations
- `zod`: Runtime type validation