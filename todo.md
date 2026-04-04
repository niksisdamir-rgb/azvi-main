# AzVirt Document Management System - TODO

## 🏗️ Core Infrastructure & Layout
- [x] Create documents table with file metadata
- [x] Create materials table for inventory management
- [x] Create deliveries table for tracking concrete deliveries
- [x] Create quality_tests table for QC records
- [x] Create projects table for construction projects
- [x] Set up global theme with construction background image
- [x] Create dashboard layout with sidebar navigation
- [x] Implement responsive header component
- [x] Add user authentication UI
- [x] Update color scheme to AzVirt brand (Orange #FF6C0E, Dark #222222)
- [x] Add Rethink Sans (Primary) and Arial (Secondary) fonts

## 📄 Document Management
- [x] Document upload procedure with S3 integration
- [x] Document list/search/filters with drag-and-drop upload
- [x] Document preview/download/delete functionality
- [x] Document categorization (by project, type, date)

## 📊 Dashboard & Analytics
- [x] Dashboard statistics cards and recent activity feed
- [x] Quick actions panel and inventory overview
- [x] Backend procedures for delivery trends and material consumption
- [x] Monthly delivery trends and material consumption charts
- [x] Clickable data cards with drill-down to detail pages
- [x] Status indicators (green/yellow/red) for system health
- [x] Real-time alerts for critical issues
- [x] Advanced filtering and search across all items
- [x] Dashboard widget customization (drag-and-drop, resize, hide/show)
- [x] Performance optimization and caching

## 👷 Workforce & Timesheets
- [x] Create employees and work_hours tables
- [x] Employee management interface (add, edit, list)
- [x] Timesheet entry with clock in/out functionality
- [x] Work hours calculation with overtime logic
- [x] Manager approval interface and status tracking
- [x] Weekly and monthly timesheet summaries
- [x] Printable timesheet reports with PDF export

## 🏭 Concrete Base & Equipment
- [x] Create concrete_bases, machines, and maintenance tables
- [x] Concrete base dashboard and aggregate input tracking
- [x] Machine working hours tracking and maintenance records
- [x] Printable maintenance reports with cost summaries
- [x] Service intervals and next maintenance date tracking

## 🚚 Delivery Tracking (Feature 1)
- [x] Delivery status workflow (loaded, en_route, arrived, delivered, etc.)
- [x] GPS location capture and real-time tracking map
- [x] ETA calculation based on distance and traffic
- [x] Driver mobile-responsive interface with one-tap status updates
- [x] Photo evidence upload and driver notes (voice-to-text)
- [x] Delivery timeline view and performance analytics
- [x] Customer SMS notifications for status changes and delays
- [x] Project-level notification preferences

## 📉 Inventory Forecasting & Reordering (Feature 2)
- [x] Create suppliers, consumption history, and purchase order tables
- [x] AI-powered consumption rate calculation (30/60/90 days)
- [x] Linear regression for stockout date prediction
- [x] Optimal reorder point and EOQ calculation
- [x] Inventory forecasting dashboard with 30-day projections
- [x] Purchase order system with email/SMS integration to suppliers
- [x] Automated PO generation when stock hits threshold
- [x] Supplier performance scorecard and cost analysis
- [x] Scheduled daily stock checks (8 AM) and low-stock alerts
- [x] Daily production reports (6 PM) with material usage stats

## 🧪 Quality Control (Feature 3)
- [x] Mobile-responsive QC inspection forms
- [x] Photo documentation for test records
- [x] Digital signatures for inspectors and supervisors
- [x] Offline mode with localStorage caching and background sync
- [x] GPS-stamped test locations and compliance standards (EN 206, etc.)
- [x] QC trends dashboard (pass/fail rates over time)
- [x] Auto-generated compliance certificate PDFs
- [x] Failed test alerts notification system

## 🤖 AI Assistant & Integration
- [x] Local Ollama integration (llama3.2, mistral, llava)
- [x] Streaming chat interface with thinking process visualization
- [x] Agentic tools for searching materials, deliveries, documents, and QC
- [x] Voice transcription using Whisper API integration
- [x] OCR and Vision processing for documents and images
- [x] AI Prompt Templates system (20+ pre-built templates)
- [x] AI Data Manipulation tools (create materials, log hours, etc.)
- [x] Bulk import feature (CSV/Excel) with AI processing
- [x] AI Voice Activation button with Web Speech API
- [-] Vitest tests for voice transcription (In Progress)

## 📧 Communication & Branding
- [x] SendGrid email integration with error handling
- [x] SMS service module (Critical stock alerts, Customer updates)
- [x] Email template management system with visual editor
- [x] Custom branding (Logo, colors, footer) for all system emails
- [x] Multi-language support (Bosnian/Serbian, English, Azerbaijani)
- [x] Language preference persistence and default settings

## 🛠️ Maintenance & DevOps
- [x] Vitest test suites for all critical procedures and services
- [x] Project checkpointing and automated backups
- [x] Responsive layout testing across mobile/tablet/desktop
- [ ] Final production deployment configuration
- [ ] Documentation of API endpoints and tool schemas
