# SecureServe Platform

A modern, secure freelancing platform built with React, TypeScript, and Supabase that connects clients with skilled freelancers for secure project collaboration.

## 🚀 Features

### **Core Platform Features**
- **Dual User System**: Separate interfaces for clients and freelancers
- **Secure Authentication**: Supabase-powered user authentication with role-based access
- **Profile Management**: Comprehensive profile system with validation
- **Project Management**: Create, track, and manage projects with AI-powered deliverables
- **Email Notifications**: Automated email notifications for project assignments using EmailJS
- **Real-time Messaging**: Built-in communication system
- **Escrow Transaction System**: Secure payment processing with auto-calculated fees
- **Transaction Tracking**: Monitor payments and project finances with role-based access
- **Responsive Design**: Modern UI with dark mode support
- **Freelancer ID Validation**: Real-time validation of freelancer IDs in project creation

### **Client Features**
- **Advanced Project Creation**: Detailed project forms with file uploads and AI deliverables
- **Project Workflow Management**: Track project status through multiple stages
- **Freelancer Discovery**: Browse and select skilled professionals with ID validation
- **Project Tracking**: Monitor project progress and deliverables
- **Escrow Payment System**: Secure fund escrow with automatic project status updates
- **Transaction Management**: Create and track escrow transactions with auto-calculated fees
- **Communication**: Direct messaging with freelancers
- **File Upload System**: Drag-and-drop file uploads with progress tracking
- **Email Notifications**: Automatic email notifications to freelancers when projects are created

### **Freelancer Features**
- **Profile Showcase**: Professional profile with skills and portfolio
- **Project Bidding**: Apply for relevant projects
- **Work Management**: Track active projects and deadlines
- **Earnings Tracking**: Monitor income and payment history with status-based filtering
- **Transaction Monitoring**: View escrow transactions in read-only mode
- **Client Communication**: Direct messaging with clients
- **Email Notifications**: Receive email notifications for new project assignments
- **Deliverables Management**: Review and agree to project deliverables with status updates
- **Client Notifications**: Automatically notify clients when deliverables are signed off

## 🛠️ Technology Stack

### **Frontend**
- **React 18.3.1**: Modern UI library with hooks
- **TypeScript 5.5.3**: Type-safe development
- **Vite 5.4.2**: Fast build tool and development server
- **React Router DOM 7.7.0**: Client-side routing
- **Tailwind CSS 3.4.1**: Utility-first CSS framework
- **Lucide React 0.344.0**: Beautiful icons

### **Backend & Database**
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Row Level Security (RLS)**: Secure data access with public read policies for validation
- **Real-time Subscriptions**: Live data updates
- **Authentication**: Built-in user management with automatic profile creation

### **Email & Communication**
- **EmailJS**: Automated email notifications for project assignments and status updates
- **Email Templates**: Professional HTML email templates with dynamic content
- **Project Notifications**: Real-time email alerts to freelancers when projects are created
- **Deliverables Signed Off Notifications**: Email alerts to clients when freelancers agree to deliverables

### **Additional Tools**
- **ESLint**: Code quality and consistency
- **PostCSS & Autoprefixer**: CSS processing

## 📁 Project Structure

```
SSBackendOnCursor/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── HeroSection.tsx  # Landing page hero
│   │   ├── BenefitsSection.tsx
│   │   ├── SecureServeBenefits.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── FAQsSection.tsx
│   │   ├── CTASection.tsx   # Contact form & footer
│   │   ├── AddProjectForm.tsx # Advanced project creation form
│   │   └── EmailTest.tsx    # Email notification testing
│   ├── pages/               # Route components
│   │   ├── FreelancerLogin.tsx
│   │   ├── ClientLogin.tsx
│   │   ├── FreelancerSignup.tsx
│   │   ├── ClientSignup.tsx
│   │   ├── FreelancerDashboard.tsx
│   │   └── ClientDashboard.tsx
│   ├── lib/
│   │   └── supabase.ts      # Enhanced Supabase client & functions
│   ├── emails/
│   │   ├── emailService.ts  # Email notification service
│   │   └── templates/       # Email templates
│   ├── types/
│   │   └── project.ts       # Project-related TypeScript interfaces
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── database_schema.sql      # Complete database schema
├── projects_schema.sql      # Project-related database schema
├── update_projects_and_add_new_tables.sql # Project workflow tables
├── fix_client_profiles_constraint.sql # Database constraint fixes
├── fix_generate_project_id_function.sql # Project ID function fixes
├── test_database_tables.sql # Database testing scripts
├── profile_tables_only.sql  # Profile tables only
├── comprehensive_supabase_fix.sql # Complete database setup
├── fix_freelancer_validation.sql # Freelancer ID validation fixes
├── fix_signup_triggers.sql  # Signup trigger fixes
├── restore_freelancer_profile.sql # Profile restoration
├── check_and_restore_client_profile.sql # Client profile fixes
├── test_all_freelancer_ids.sql # Validation testing
├── quick_validation_test.sql # Quick validation tests
├── quick_client_test.sql    # Client profile testing
├── diagnose_signup_issue.sql # Signup diagnostics
├── test_supabase_connection.sql # Connection testing
├── setup_complete_database.sql # Complete database setup with transactions and messages
├── PROFILE_SETUP_GUIDE.md   # Profile system guide
├── PROFILE_SAVE_FIX.md      # Troubleshooting guide
└── EMAILJS_SETUP.md         # Email setup guide
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- EmailJS account (for email notifications)

### **1. Clone and Install**
   ```bash
cd SSBackendOnCursor
npm install
```

### **2. Environment Setup**
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_OPENAI_API_KEY=your-openai-api-key
VITE_RESEND_API_KEY=your-resend-api-key
```

### **3. Database Setup**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run `setup_complete_database.sql` for complete database setup including transactions and messages
4. For specific issues, use targeted scripts:
   - `comprehensive_supabase_fix.sql` - Legacy complete setup
   - `projects_schema.sql` - Project-related database schema
   - `update_projects_and_add_new_tables.sql` - Project workflow tables
   - `fix_freelancer_validation.sql` - Freelancer ID validation
   - `fix_signup_triggers.sql` - Signup trigger fixes
   - `restore_freelancer_profile.sql` - Profile restoration

### **4. Email Setup**
1. Create an EmailJS account
2. Set up email service and templates
3. Configure email notifications for project assignments
4. Test email functionality using `EmailTest.tsx` component

### **5. Start Development Server**
```bash
npm run dev
```
Visit `http://localhost:5173`

## 🗄️ Database Schema

### **Core Tables**
- **`freelancer_profiles`**: Freelancer information with system-generated IDs
- **`client_profiles`**: Client information with business details
- **`projects`**: Project details with workflow status tracking
- **`project_files`**: File uploads linked to projects
- **`deliverables`**: Project deliverables with validation
- **`work_products`**: Final work products from freelancers
- **`verification_reports`**: Project verification and quality reports
- **`transactions`**: Escrow payment records with auto-calculated fees and status tracking
- **`messages`**: Communication between users with auto-generated message IDs

### **Project Workflow System**
- **Project Status Tracking**: 9-stage workflow from creation to completion
- **Auto-generated Project IDs**: V+4 digits format (V1001, V1002, etc.)
- **File Management**: Supabase Storage integration with metadata tracking
- **Deliverables Management**: Dynamic deliverables with validation
- **Work Products**: Final deliverables tracking
- **Verification Reports**: Quality assurance and verification

### **Escrow Transaction System**
- **Auto-generated Transaction IDs**: 10-digit incremental format (1000000001, 1000000002...)
- **Automatic Fee Calculation**: 3.5% fee for both client and freelancer, 93% to freelancer
- **Transaction Status Tracking**: Fund Secured → Successfully closed → Chargeback
- **Role-based Access**: Clients create transactions, freelancers view only
- **Project Status Automation**: Automatic update to "Production in Progress" on transaction creation
- **Human-readable Display**: Project IDs and client names instead of UUIDs in transaction tables

### **Key Features**
- **Automatic Profile Creation**: Triggers create profiles on signup with error handling
- **Row Level Security**: Public read access for validation, user-specific write access
- **System-generated IDs**: Unique identifiers (F123456789, C123456789, V1001)
- **Auto-generated Transaction IDs**: 10-digit incremental IDs (1000000001, 1000000002...)
- **Auto-generated Message IDs**: 3-digit incremental IDs (001, 002...)
- **Audit Trail**: Created and updated timestamps
- **Freelancer ID Validation**: Real-time validation with visual feedback
- **Email Notifications**: Automated email alerts for project assignments
- **Escrow Fee Calculation**: Automatic 3.5% fee calculation for both client and freelancer
- **Role-based Transaction Access**: Clients can create transactions, freelancers can only view

## 🔐 Security Features

### **Authentication & Authorization**
- **Supabase Auth**: Secure user authentication with enhanced error handling
- **Role-based Access**: Separate client/freelancer permissions
- **Session Management**: Automatic session handling

### **Data Protection**
- **Row Level Security (RLS)**: Database-level access control with public read policies
- **Input Validation**: Client-side and server-side validation with real-time feedback
- **Secure API**: Supabase handles API security
- **File Upload Security**: Secure file handling with size and type validation

### **Profile Security**
- **Encrypted Storage**: Sensitive data encryption
- **Masked Display**: Aadhar numbers masked for privacy
- **Secure Validation**: Robust input validation with visual indicators

## 🎨 UI/UX Features

### **Design System**
- **Dark Mode**: Modern dark theme throughout
- **Responsive Design**: Mobile-first approach with comprehensive responsive classes
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Smooth loading indicators with spinners

### **Advanced Components**
- **Form Validation**: Real-time validation with success/error states
- **File Upload**: Drag-and-drop file handling with progress tracking
- **Progress Tracking**: Visual progress indicators
- **Modal Dialogs**: Confirmation and information modals
- **Freelancer ID Validation**: Visual feedback with icons and colors
- **Email Notifications**: Professional email templates with dynamic content

### **Project Creation Features**
- **System-generated Project IDs**: Auto-generated V+4 digits format
- **Freelancer ID Validation**: Real-time database validation
- **File Upload System**: Multi-file support with size limits (10MB each)
- **AI Deliverables**: AI-powered deliverable generation
- **Mobile Responsive**: Comprehensive mobile optimization
- **Email Notifications**: Automatic email alerts to freelancers
- **Project Workflow**: 9-stage status tracking system

## 📱 Pages & Routes

### **Public Pages**
- `/` - Landing page with platform overview
- `/login/freelancer` - Freelancer login
- `/login/client` - Client login
- `/signup/freelancer` - Freelancer registration
- `/signup/client` - Client registration

### **Protected Pages**
- `/freelancer/dashboard` - Freelancer dashboard with profile management
- `/client/dashboard` - Client dashboard with project creation and management

## 🔧 Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### **Code Quality**
- **TypeScript**: Strict type checking
- **ESLint**: Code linting and formatting
- **React Hooks**: Modern React patterns
- **Component Structure**: Reusable component architecture

## 🚀 Deployment

### **Build for Production**
```bash
npm run build
```

### **Deploy Options**
- **Vercel**: Recommended for React apps
- **Netlify**: Static site hosting
- **Supabase Edge Functions**: Serverless backend
- **Traditional Hosting**: Any static hosting service

## 📊 Performance

### **Optimizations**
- **Vite**: Fast development and build times
- **Code Splitting**: Automatic route-based splitting
- **Lazy Loading**: Component lazy loading
- **Image Optimization**: Optimized asset delivery

### **Monitoring**
- **Console Logging**: Detailed error tracking with enhanced debugging
- **Performance Metrics**: Build-time optimizations
- **Error Boundaries**: Graceful error handling

## 🤝 Contributing

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### **Code Standards**
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Add comprehensive comments

## 📚 Documentation

### **Setup Guides**
- `PROFILE_SETUP_GUIDE.md` - Profile system setup
- `PROFILE_SAVE_FIX.md` - Troubleshooting guide
- `EMAILJS_SETUP.md` - Email functionality setup

### **Email Templates**
- `src/emails/templates/projectNotification.html` - Project assignment notifications
- `src/emails/templates/deliverablesSignedOffNotification.html` - Deliverables signed off notifications

### **Database Scripts**
- `comprehensive_supabase_fix.sql` - Complete database setup
- `projects_schema.sql` - Project-related database schema
- `update_projects_and_add_new_tables.sql` - Project workflow tables
- `fix_freelancer_validation.sql` - Freelancer ID validation fixes
- `fix_signup_triggers.sql` - Signup trigger fixes
- `restore_freelancer_profile.sql` - Profile restoration
- `check_and_restore_client_profile.sql` - Client profile fixes

### **Testing Scripts**
- `test_database_tables.sql` - Database table testing
- `test_all_freelancer_ids.sql` - Freelancer ID validation testing
- `quick_validation_test.sql` - Quick validation tests
- `quick_client_test.sql` - Client profile testing
- `diagnose_signup_issue.sql` - Signup diagnostics
- `test_supabase_connection.sql` - Connection testing

## 🐛 Troubleshooting

### **Common Issues**

**Freelancer ID Validation Fails**
- Run `fix_freelancer_validation.sql` in Supabase
- Check RLS policies allow public read access
- Verify freelancer profiles exist in database

**Profile Save Fails**
- Check `.env` file exists with correct credentials
- Run `comprehensive_supabase_fix.sql` for complete setup
- Check browser console for detailed errors

**Signup Issues**
- Run `fix_signup_triggers.sql` to fix trigger functions
- Check Supabase logs for trigger errors
- Verify environment variables are correct

**Project Creation Issues**
- Run `projects_schema.sql` for project tables
- Run `update_projects_and_add_new_tables.sql` for workflow tables
- Check file upload permissions in Supabase Storage

**Email Notification Issues**
- Verify EmailJS configuration in `emailService.ts`
- Check EmailJS template variables match code parameters
- Test email functionality using `EmailTest.tsx` component

**Database Connection Issues**
- Run `test_supabase_connection.sql` to diagnose issues
- Verify RLS policies are enabled
- Check user authentication status

**Development Server Issues**
- Clear node_modules and reinstall
- Check port 5173 is available
- Verify all dependencies are installed

### **Recent Fixes Applied**
- ✅ **Escrow Transaction System**: Complete transaction management with auto-calculated fees
- ✅ **Role-based Transaction Access**: Clients can create transactions, freelancers can only view
- ✅ **Auto-generated IDs**: Transaction IDs (10-digit) and Message IDs (3-digit) with triggers
- ✅ **Project Status Automation**: Automatic project status update to "Production in Progress" on transaction creation
- ✅ **Transaction Display Fixes**: Human-readable project IDs and client names instead of UUIDs
- ✅ **Earnings Calculation**: Status-based filtering for freelancer earnings (only "Successfully closed" transactions)
- ✅ **Database Schema Optimization**: Updated RLS policies for existing projects table structure
- ✅ **Email Notification System**: Automated email alerts to freelancers for new projects
- ✅ **Project Workflow Management**: 9-stage project status tracking system
- ✅ **Enhanced Project Creation**: Advanced form with file uploads and AI deliverables
- ✅ **Database Schema Updates**: New tables for project workflow, work products, and verification
- ✅ **Freelancer ID Validation**: Real-time database validation with visual feedback
- ✅ **File Upload System**: Secure file handling with Supabase Storage integration
- ✅ **Email Templates**: Professional HTML email templates with dynamic content
- ✅ **Project Status Tracking**: Comprehensive workflow from creation to completion
- ✅ **Enhanced Error Handling**: Detailed logging and user-friendly error messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service
- **Vite** for the fast build tool
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icon set
- **EmailJS** for the email notification system

---

**SecureServe Platform** - Connecting talent with opportunity, securely.