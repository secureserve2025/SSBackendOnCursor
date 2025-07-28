# SecureServe Platform

A modern, secure freelancing platform built with React, TypeScript, and Supabase that connects clients with skilled freelancers for secure project collaboration.

## 🚀 Features

### **Core Platform Features**
- **Dual User System**: Separate interfaces for clients and freelancers
- **Secure Authentication**: Supabase-powered user authentication with role-based access
- **Profile Management**: Comprehensive profile system with validation
- **Project Management**: Create, track, and manage projects
- **Real-time Messaging**: Built-in communication system
- **Transaction Tracking**: Monitor payments and project finances
- **Responsive Design**: Modern UI with dark mode support

### **Client Features**
- **Project Creation**: Detailed project forms with file uploads
- **Freelancer Discovery**: Browse and select skilled professionals
- **Project Tracking**: Monitor project progress and deliverables
- **Payment Management**: Secure payment processing
- **Communication**: Direct messaging with freelancers

### **Freelancer Features**
- **Profile Showcase**: Professional profile with skills and portfolio
- **Project Bidding**: Apply for relevant projects
- **Work Management**: Track active projects and deadlines
- **Earnings Tracking**: Monitor income and payment history
- **Client Communication**: Direct messaging with clients

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
- **Row Level Security (RLS)**: Secure data access
- **Real-time Subscriptions**: Live data updates
- **Authentication**: Built-in user management

### **Additional Tools**
- **EmailJS**: Contact form email functionality
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
│   │   └── AddProjectForm.tsx # Project creation form
│   ├── pages/               # Route components
│   │   ├── FreelancerLogin.tsx
│   │   ├── ClientLogin.tsx
│   │   ├── FreelancerSignup.tsx
│   │   ├── ClientSignup.tsx
│   │   ├── FreelancerDashboard.tsx
│   │   └── ClientDashboard.tsx
│   ├── lib/
│   │   └── supabase.ts      # Supabase client & functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── database_schema.sql      # Complete database schema
├── profile_tables_only.sql  # Profile tables only
├── check_and_fix_tables.sql # Database setup & fixes
├── test_profile_system.sql  # System verification
├── PROFILE_SETUP_GUIDE.md   # Profile system guide
├── PROFILE_SAVE_FIX.md      # Troubleshooting guide
└── EMAILJS_SETUP.md         # Email setup guide
```

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Supabase account

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
```

### **3. Database Setup**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the content from `profile_tables_only.sql`
4. If tables already exist, run `check_and_fix_tables.sql`

### **4. Start Development Server**
```bash
npm run dev
```
Visit `http://localhost:5173`

## 🗄️ Database Schema

### **Core Tables**
- **`freelancer_profiles`**: Freelancer information and credentials
- **`client_profiles`**: Client information and business details
- **`projects`**: Project details and status tracking
- **`transactions`**: Payment and financial records
- **`messages`**: Communication between users

### **Key Features**
- **Automatic Profile Creation**: Triggers create profiles on signup
- **Row Level Security**: Users can only access their own data
- **System-generated IDs**: Unique identifiers for users
- **Audit Trail**: Created and updated timestamps

## 🔐 Security Features

### **Authentication & Authorization**
- **Supabase Auth**: Secure user authentication
- **Role-based Access**: Separate client/freelancer permissions
- **Session Management**: Automatic session handling

### **Data Protection**
- **Row Level Security (RLS)**: Database-level access control
- **Input Validation**: Client-side and server-side validation
- **Secure API**: Supabase handles API security

### **Profile Security**
- **Encrypted Storage**: Sensitive data encryption
- **Masked Display**: Aadhar numbers masked for privacy
- **Secure Validation**: Robust input validation

## 🎨 UI/UX Features

### **Design System**
- **Dark Mode**: Modern dark theme throughout
- **Responsive Design**: Mobile-first approach
- **Accessibility**: ARIA labels and keyboard navigation
- **Loading States**: Smooth loading indicators

### **Components**
- **Form Validation**: Real-time validation with error messages
- **File Upload**: Drag-and-drop file handling
- **Progress Tracking**: Visual progress indicators
- **Modal Dialogs**: Confirmation and information modals

## 📱 Pages & Routes

### **Public Pages**
- `/` - Landing page with platform overview
- `/login/freelancer` - Freelancer login
- `/login/client` - Client login
- `/signup/freelancer` - Freelancer registration
- `/signup/client` - Client registration

### **Protected Pages**
- `/freelancer/dashboard` - Freelancer dashboard
- `/client/dashboard` - Client dashboard

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
- **Console Logging**: Detailed error tracking
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

### **Database Scripts**
- `profile_tables_only.sql` - Core profile tables
- `check_and_fix_tables.sql` - Database fixes
- `test_profile_system.sql` - System verification

## 🐛 Troubleshooting

### **Common Issues**

**Profile Save Fails**
- Check `.env` file exists with correct credentials
- Verify database tables are created
- Check browser console for detailed errors

**Database Connection Issues**
- Run `check_and_fix_tables.sql` in Supabase
- Verify RLS policies are enabled
- Check user authentication status

**Development Server Issues**
- Clear node_modules and reinstall
- Check port 5173 is available
- Verify all dependencies are installed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Supabase** for the excellent backend-as-a-service
- **Vite** for the fast build tool
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icon set

---

**SecureServe Platform** - Connecting talent with opportunity, securely.