# SecureServe Platform

A comprehensive freelancer-client platform for secure project management, video production, and AI-powered verification.

## 🏗️ Project Architecture

This is a **monorepo** with integrated frontend and backend components:

```
SSBackendOnCursor/
├── src/                    # Frontend (React/TypeScript)
│   ├── components/         # React UI components
│   ├── pages/             # Route components (dashboards)
│   ├── lib/               # Frontend utilities & Supabase client
│   ├── api/               # API endpoints
│   ├── types/             # TypeScript interfaces
│   ├── emails/            # Email templates
│   ├── App.tsx            # Main React app
│   └── main.tsx           # Entry point
├── supabase/              # Backend (Supabase Edge Functions)
│   └── functions/
│       ├── ai-chat/       # AI chat function
│       ├── send-email/    # Email notification function
│       └── verify-project/ # Project verification function
├── services/              # Backend services
│   ├── aiVideoAgent.js    # AI video processing
│   └── aiVideoAgent.test.js
├── utils/                 # Backend utilities
│   ├── fileAnalyzer.js    # File processing utilities
│   └── projectSummary.js  # Project summary generation
├── *.sql                  # Database schema files
├── package.json           # Frontend dependencies
├── vite.config.ts         # Frontend build config
└── tailwind.config.js     # Frontend styling
```

## 🚀 Key Features

### **Authentication & User Management**
- **Dual User Types**: Separate signup/login for clients and freelancers
- **Profile Management**: Complete profile setup with verification
- **Secure Authentication**: Supabase Auth with Row Level Security (RLS)
- **Session Management**: Persistent login with refresh tokens

### **Project Management System**
- **Project Creation**: Advanced form with AI-powered deliverables generation
- **Project Assignment**: Automatic freelancer assignment with validation
- **Status Workflow**: Comprehensive project status tracking
- **Project History**: Complete audit trail of status changes
- **Project Deletion**: Secure deletion with cascade cleanup

### **Work Product Upload System**
- **Secure Video Upload**: Upload final video work to `work-products` storage bucket
- **File Validation**: Size limits (50MB for work products, 5MB for project files), format validation (MP4, AVI, MOV, WMV, FLV, WebM)
- **Project Mapping**: Automatic linking to project IDs with detailed metadata
- **Progress Tracking**: Real-time upload progress with visual indicators
- **Re-upload Support**: Version control with file archiving
- **Video Playback**: Integrated video player with metadata display

### **AI-Powered Verification System**
- **Automated Analysis**: AI verification of uploaded work products
- **Quality Assessment**: Comprehensive quality metrics and scoring
- **Verification Reports**: Detailed reports with match percentages
- **Manual Review**: Fallback to manual verification when needed
- **Status Updates**: Automatic project status updates based on verification

### **Notifications System**
- **Real-time Notifications**: Display projects requiring attention
- **Status-based Filtering**: "Under Manual Revision" and "AI Verified" projects
- **Accordion Interface**: Mobile-responsive notification display
- **Action Due Tracking**: Automatic calculation of pending actions
- **Cross-platform**: Available for both client and freelancer dashboards

### **Transaction Management**
- **Escrow System**: Secure fund management with automatic calculations
- **Fee Structure**: 3.5% fee from both client and freelancer
- **Payment Tracking**: Complete transaction history and status
- **Automatic Calculations**: Freelancer receives 93% of project value
- **Status Integration**: Transaction status linked to project workflow

### **Communication System**
- **In-app Messaging**: Real-time messaging between clients and freelancers
- **Project-specific**: Messages linked to specific projects
- **Read Status**: Message read/unread tracking
- **Notification Integration**: Message timestamps in notifications

### **File Management**
- **Multi-format Support**: PDF, DOC, DOCX, JPG, PNG, MP4, AVI, MOV, WMV, FLV, WebM
- **Size Limits**: 50MB for work products, 5MB for project files
- **Secure Storage**: Supabase storage with access controls
- **Metadata Tracking**: File size, type, upload date, and user info
- **Version Control**: File history and re-upload capabilities

## 🛠️ Technology Stack

### **Frontend**
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with comprehensive interfaces
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **React Router**: Client-side routing

### **Backend**
- **Supabase**: Backend-as-a-Service with PostgreSQL database
- **Edge Functions**: Serverless functions for AI processing
- **Row Level Security**: Database-level access control
- **Real-time Subscriptions**: Live data updates
- **Storage**: Secure file storage with access policies

### **AI & Processing**
- **OpenAI API**: AI-powered content generation and analysis
- **Google Generative AI**: Alternative AI processing
- **Video Processing**: Metadata extraction and validation
- **File Analysis**: Document and video content analysis

### **Development Tools**
- **ESLint**: Code linting and formatting
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

## 📋 Database Schema

### **Core Tables**
- `freelancer_profiles`: Freelancer user data and verification
- `client_profiles`: Client user data and company information
- `projects`: Project details with status workflow
- `work_products`: Uploaded video files and metadata
- `transactions`: Payment and escrow management
- `messages`: In-app communication
- `verification_reports`: AI verification results
- `project_status_history`: Complete audit trail

### **Key Features**
- **UUID Primary Keys**: Secure, unique identifiers
- **Foreign Key Relationships**: Proper data integrity
- **Timestamps**: Created/updated tracking
- **Status Workflows**: Comprehensive state management
- **Indexes**: Optimized query performance

## 🚀 Getting Started

### **Prerequisites**
- Node.js >= 18.0.0
- npm >= 8.0.0
- Supabase account and project

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
   ```bash
   # Create .env file with your Supabase credentials
   cp .env.example .env
   ```

4. **Database Setup**
   ```sql
   -- Run the complete database setup
   -- Execute setup_complete_database.sql in Supabase SQL Editor
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

### **Environment Variables**

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Services
VITE_OPENAI_API_KEY=your_openai_api_key
VITE_GEMINI_API_KEY=your_gemini_api_key

# Email Services
VITE_EMAILJS_PUBLIC_KEY=your_emailjs_key
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
```

## 📱 User Interfaces

### **Client Dashboard**
- **Project Management**: Create, view, and manage projects
- **Freelancer Assignment**: Assign projects to verified freelancers
- **Work Product Review**: View and approve uploaded work
- **Transaction Management**: Fund escrow and release payments
- **Notifications**: Real-time project status updates
- **Messaging**: Communicate with assigned freelancers

### **Freelancer Dashboard**
- **Project Overview**: View assigned projects and requirements
- **Work Upload**: Upload final video work products
- **Status Tracking**: Monitor project progress and feedback
- **Payment Tracking**: View transaction status and earnings
- **Notifications**: Project updates and action items
- **Profile Management**: Complete profile setup and verification

### **Landing Page**
- **Hero Section**: Platform overview and value proposition
- **Benefits**: Key features and advantages
- **How It Works**: Step-by-step process explanation
- **FAQ Section**: Common questions and answers
- **Contact Form**: Lead capture and support

## 🔧 Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm start            # Start production server
```

### **File Structure**
```
src/
├── components/       # Reusable UI components
├── pages/           # Route components
├── lib/             # Utilities and Supabase client
├── api/             # API endpoints
├── types/           # TypeScript interfaces
├── emails/          # Email templates
├── App.tsx          # Main app component
└── main.tsx         # Entry point
```

### **Key Components**
- `AddProjectForm.tsx`: Advanced project creation with AI
- `ClientDashboard.tsx`: Client project management interface
- `FreelancerDashboard.tsx`: Freelancer work management interface
- `Notifications.tsx`: Real-time notification system
- `AIDeliverableChat.jsx`: AI-powered deliverable generation

## 🧪 Testing

### **Manual Testing**
- User registration and authentication
- Project creation and assignment
- File upload and validation
- AI verification process
- Transaction management
- Notification system

### **Automated Testing**
```bash
# Run test scripts
node test_freelancer_upload_requirements.js
node test_work_product_upload.sql
node test_supabase_connection.sql
```

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **Deployment Options**
- **Vercel**: Frontend deployment with serverless functions
- **Netlify**: Static site hosting with form handling
- **Supabase**: Backend hosting and database management
- **Custom Server**: Node.js server deployment

### **Environment Configuration**
- Set production environment variables
- Configure Supabase production project
- Set up custom domains
- Configure SSL certificates

## 🔒 Security Features

### **Authentication & Authorization**
- **Supabase Auth**: Secure user authentication
- **Row Level Security**: Database-level access control
- **JWT Tokens**: Secure session management
- **Role-based Access**: Client vs freelancer permissions

### **Data Protection**
- **Input Validation**: Client and server-side validation
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization
- **File Upload Security**: Type and size validation

### **File Security**
- **Secure Storage**: Supabase storage with access policies
- **File Type Validation**: Whitelist of allowed formats
- **Size Limits**: Prevent storage abuse
- **Access Control**: User-specific file access

## 📊 Performance Optimizations

### **Frontend**
- **Code Splitting**: Dynamic imports for better loading
- **Lazy Loading**: Components load as needed
- **Image Optimization**: Compressed images and lazy loading
- **Bundle Optimization**: Tree shaking and minification

### **Backend**
- **Database Indexes**: Optimized query performance
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis caching for frequently accessed data
- **CDN**: Global content delivery network

## 🐛 Troubleshooting

### **Common Issues**

**Authentication Problems**
- Verify Supabase credentials in environment variables
- Check RLS policies are properly configured
- Ensure user profiles are created correctly

**File Upload Issues**
- Verify `work-products` storage bucket exists in Supabase
- Check file size limits (50MB maximum for work products, 5MB for project files)
- Ensure supported video formats (MP4, AVI, MOV, WMV, FLV, WebM)
- Run `test_work_product_upload.sql` to verify database structure

**AI Integration Issues**
- Verify OpenAI API key is configured
- Check API rate limits and quotas
- Ensure internet connection for AI services
- Review AI service configuration

**Database Connection Issues**
- Verify Supabase project URL and keys
- Check database permissions and RLS policies
- Run `test_supabase_connection.sql` to verify connection
- Review database schema and table structure

### **Debug Information**
- Check browser console for JavaScript errors
- Verify Supabase dashboard for database issues
- Review network tab for API call failures
- Check environment variable configuration

## 📈 Monitoring & Analytics

### **Performance Monitoring**
- **Vite Build Analysis**: Bundle size and loading times
- **Database Performance**: Query execution times
- **API Response Times**: Function execution monitoring
- **Error Tracking**: Comprehensive error logging

### **User Analytics**
- **Page Views**: User navigation patterns
- **Feature Usage**: Most used platform features
- **Error Rates**: User experience issues
- **Conversion Tracking**: Signup and project completion rates

## 🔄 Version Control

### **Git Workflow**
- **Feature Branches**: Isolated development
- **Pull Requests**: Code review process
- **Semantic Versioning**: Clear version numbering
- **Changelog**: Detailed release notes

### **Deployment Pipeline**
- **Automated Testing**: Pre-deployment validation
- **Build Verification**: Production build testing
- **Environment Promotion**: Staging to production
- **Rollback Capability**: Quick issue resolution

## 📞 Support

### **Documentation**
- **API Documentation**: Comprehensive endpoint documentation
- **User Guides**: Step-by-step platform usage
- **Developer Docs**: Technical implementation details
- **Troubleshooting**: Common issues and solutions

### **Contact Information**
- **Technical Support**: Development and deployment issues
- **User Support**: Platform usage and feature questions
- **Feature Requests**: New functionality suggestions
- **Bug Reports**: Issue reporting and tracking

---

## 🎯 Project Status

### ✅ **Completed Features**
- ✅ **User Authentication**: Complete signup/login system
- ✅ **Profile Management**: Comprehensive profile setup
- ✅ **Project Creation**: Advanced form with AI integration
- ✅ **Work Product Upload**: Secure video upload system (50MB limit)
- ✅ **AI Verification**: Automated quality assessment
- ✅ **Transaction Management**: Complete escrow system
- ✅ **Messaging System**: Real-time communication
- ✅ **Notifications**: Status-based notification system
- ✅ **File Management**: Multi-format support with validation
- ✅ **Mobile Responsive**: Comprehensive mobile optimization
- ✅ **Error Handling**: Detailed logging and user feedback
- ✅ **Security Implementation**: RLS policies and access controls

### 🚧 **In Development**
- Enhanced AI video processing
- Advanced analytics dashboard
- Mobile app development
- Additional payment gateways

### 📋 **Planned Features**
- Video editing tools
- Advanced project templates
- Multi-language support
- Advanced reporting system

---

**Built with ❤️ using React, TypeScript, Supabase, and AI technologies**