# SecureServe - Freelancer-Client Project Management Platform

A comprehensive web application for managing freelance projects with AI-powered verification, automated email notifications, and secure payment processing.

## 🚀 Features

### **Core Functionality**
- **User Authentication**: Secure login/signup for clients and freelancers
- **Project Management**: Create, assign, and track projects with detailed requirements
- **Deliverable Management**: Define and track project deliverables with checklists
- **AI-Powered Verification**: Automated project verification using Gemini Pro 2.5
- **Payment Processing**: Integrated Stripe payment system for secure transactions
- **Real-time Notifications**: Email notifications for all major project events

### **Email Notification System**
- **Project Assignment**: Notifies freelancers when projects are assigned
- **Checklist Sign-off**: Confirms when deliverables are agreed upon
- **AI Verification**: Sends verification results to both parties (≥90% score)
- **Manual Revision**: Triggers when AI verification score is <90%
- **Contact Form**: Client inquiry notifications

### **User Dashboards**
- **Client Dashboard**: Project creation, freelancer assignment, payment management
- **Freelancer Dashboard**: Project acceptance, deliverable submission, AI verification
- **Admin Dashboard**: User management, system monitoring, analytics

### **AI Verification System**
- **Automated Analysis**: Uses Gemini Pro 2.5 to verify project deliverables
- **Score-based Workflow**: 
  - ≥90%: Automatic approval with success notification
  - <90%: Manual revision process with revision notification
- **Detailed Reports**: Comprehensive verification reports with scores and feedback

## 🛠️ Technology Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Hook Form** for form management

### **Backend & Database**
- **Supabase** for database and authentication
- **PostgreSQL** database with RPC functions
- **Row Level Security (RLS)** for data protection

### **External Services**
- **EmailJS** for email notifications
- **Stripe** for payment processing
- **Google Gemini Pro 2.5** for AI verification
- **Vercel** for deployment

## 📧 Email Configuration

The application uses EmailJS with different service configurations for various notification types:

```env
# Project Assignment & Manual Revision (Original Account)
VITE_EMAILJS_PROJECT_SERVICE_ID=service_7fw63y9
VITE_EMAILJS_PROJECT_TEMPLATE_ID=template_uct3d5l
VITE_EMAILJS_PROJECT_PUBLIC_KEY=FczWejeDBjHh8k_5E

VITE_EMAILJS_MANUAL_REVISION_SERVICE_ID=service_7fw63y9
VITE_EMAILJS_MANUAL_REVISION_TEMPLATE_ID=template_kiyao93
VITE_EMAILJS_MANUAL_REVISION_PUBLIC_KEY=FczWejeDBjHh8k_5E

# Deliverables & AI Verification (New Account)
VITE_EMAILJS_DELIVERABLES_SERVICE_ID=service_uxdp209
VITE_EMAILJS_DELIVERABLES_TEMPLATE_ID=template_ophe9j8
VITE_EMAILJS_DELIVERABLES_PUBLIC_KEY=XeoTtUWpEbiTj3ouV

VITE_EMAILJS_AI_VERIFICATION_SERVICE_ID=service_uxdp209
VITE_EMAILJS_AI_VERIFICATION_TEMPLATE_ID=template_gsavks3
VITE_EMAILJS_AI_VERIFICATION_PUBLIC_KEY=XeoTtUWpEbiTj3ouV
```

## 🔧 Recent Fixes & Improvements

### **Database Cleanup & Maintenance (August 16, 2025)**
- ✅ **Comprehensive Data Cleanup**: Executed safe deletion of all records created on or before August 16, 2025
- ✅ **Multi-Table Cleanup**: Removed old data from all application tables including:
  - `freelancer_profiles`, `client_profiles`, `projects`
  - `transactions`, `messages`, `deliverables`
  - `work_products`, `verification_reports`, `project_files`
  - `project_status_history`
- ✅ **Safe Deletion Process**: Implemented table existence checks before deletion to prevent errors
- ✅ **Data Verification**: Created comprehensive verification scripts to confirm successful cleanup
- ✅ **Backup Strategy**: Prepared backup scripts for data recovery if needed
- ✅ **Foreign Key Compliance**: Maintained referential integrity during cleanup operations

### **Email Notification Fixes**
- ✅ Fixed AI verification and manual revision email notifications
- ✅ Corrected project data fetching to use proper profile tables
- ✅ Updated EmailJS configurations with correct template IDs
- ✅ Added EmailJS initialization in App.tsx
- ✅ Ensured all email notifications are properly enabled

### **UI/UX Improvements**
- ✅ Fixed "OK Checklist" button visibility in freelancer dashboard
- ✅ Button now properly disappears after project status changes to "Checklist Signed off"
- ✅ Improved project status workflow management
- ✅ Enhanced error handling and user feedback

### **Data Management**
- ✅ Optimized project data fetching with proper joins
- ✅ Fixed human-readable ID generation for emails
- ✅ Improved database query performance
- ✅ Enhanced data validation and error handling

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account
- EmailJS account
- Stripe account
- Google AI Studio account

### **Installation**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SSBackendOnCursor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file with your configuration:
   ```env
   # Supabase
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # OpenAI/Gemini
   VITE_OPENAI_API_KEY=your_openai_api_key
   
   # Stripe
   VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # EmailJS (see configuration above)
   VITE_EMAILJS_PROJECT_SERVICE_ID=service_7fw63y9
   VITE_EMAILJS_PROJECT_TEMPLATE_ID=template_uct3d5l
   VITE_EMAILJS_PROJECT_PUBLIC_KEY=FczWejeDBjHh8k_5E
   # ... (add all other EmailJS configurations)
   ```

4. **Database Setup**
   - Set up your Supabase project
   - Run the database migrations
   - Configure Row Level Security policies

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## 📦 Deployment

### **Vercel Deployment**
The application is configured for Vercel deployment with:
- ✅ Proper SPA routing configuration
- ✅ Build optimization
- ✅ Environment variable support
- ✅ Security headers

**Deploy to Vercel:**
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

## 🔐 Security Features

- **Row Level Security (RLS)** on all database tables
- **JWT-based authentication** via Supabase
- **Secure API key management** through environment variables
- **Input validation** and sanitization
- **CORS protection** and security headers

## 📊 Project Workflow

1. **Client creates project** with requirements and deliverables
2. **Project assigned to freelancer** → Email notification sent
3. **Freelancer reviews deliverables** and clicks "OK Checklist" → Email notification sent
4. **Freelancer submits work** for AI verification
5. **AI verification process**:
   - Score ≥90%: Automatic approval + success email
   - Score <90%: Manual revision + revision email
6. **Payment processing** via Stripe
7. **Project completion** and feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the documentation
- Review existing issues
- Create a new issue with detailed description

---

**Last Updated**: August 16, 2025
**Version**: 2.1.0
**Status**: Production Ready ✅