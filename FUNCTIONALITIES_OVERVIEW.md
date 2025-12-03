# GEOCONNECT - Complete Functionality Overview

## Application Overview
GEOCONNECT is a comprehensive job portal platform built with Django that connects employers with job seekers. The system has three main user types: **Employees** (job seekers), **Employers** (companies), and **Admins** (system administrators).

---

## 1. EMPLOYEE FUNCTIONALITIES

### Authentication & Account Management
- **Sign Up**: Create account with username, email, password, and optional document upload
- **Login**: Secure login with session management
- **Logout**: Session termination
- **Password Reset**: Email-based password reset functionality
- **Account Approval**: Accounts require admin approval before activation
- **Account Status**: Accounts can be active/inactive

### Profile Management
- **Profile View**: View personal profile information
- **Profile Update**: Update profile details including:
  - Full name, bio, phone, location
  - Skills, education, work experience
  - Certifications, preferred job type
  - Avatar/Profile picture upload
  - Resume upload/removal
  - LinkedIn, GitHub, Portfolio URLs
- **Profile Settings**: Comprehensive profile settings page

### Job Search & Discovery
- **Job Browsing**: Browse all active job listings
- **Job Filtering**: Filter jobs by:
  - Search query (title, description)
  - Category/Job type
  - Location/Work setup
- **Job Details**: View detailed job information including:
  - Job description, requirements
  - Salary range, experience level
  - Company information
  - Application statistics
  - Reviews and ratings
- **Job Mapping**: Interactive map view of job locations
- **Saved Jobs**: Save/unsave jobs for later viewing
- **Applied Jobs Tracking**: Track which jobs have been applied to

### Job Application
- **Apply for Jobs**: Submit job applications with:
  - Resume upload (required)
  - Cover letter (optional)
  - Unique filename generation for resumes
- **Application Status Tracking**: View application status (pending, hired, rejected)
- **Application History**: View all past applications with status

### Job Preferences & Matching
- **Job Preferences Setup**: Configure job preferences including:
  - Industry preference
  - Job type (full-time, part-time, etc.)
  - Work arrangement (on-site, hybrid, remote)
  - Skills list
  - Experience level
  - Education level
  - Certifications
  - Languages
  - Salary range (min/max)
  - Availability
- **Get Job Preferences**: Retrieve saved preferences via API

### Resume Tools
- **Resume Analyzer**: Upload and analyze resume to:
  - Extract skills
  - Categorize skills
  - Extract education information
  - Extract experience
  - Match with job listings
- **Resume Builder**: Build professional resumes with:
  - Personal information
  - Work experience entries
  - Education entries
  - Skills list
  - Projects
  - Certifications
- **Resume PDF Generation**: Generate downloadable PDF resumes using ReportLab

### Notifications
- **Notification Center**: View all notifications
- **Notification Filtering**: Filter by read/unread status
- **Notification Search**: Search notifications by message content
- **Mark as Read**: Mark notifications as read
- **Delete Notifications**: Remove notifications
- **Unread Count**: Track unread notification count

### Feedback & Reviews
- **Job Feedback**: Submit feedback for jobs/employers with:
  - Overall rating (1-5 stars)
  - Work environment rating
  - Management rating
  - Compensation rating
  - Work-life balance rating
  - Written comment
  - Recommendation flag
- **Employer Reviews**: Submit company/employer reviews
- **View Reviews**: View all reviews for a specific job
- **Feedback Statistics**: View aggregated feedback statistics

### Messaging System
- **Messages List**: View all conversations with employers
- **Conversation Detail**: View and participate in conversations
- **Send Messages**: Send messages to employers via AJAX
- **Unread Count**: Track unread messages
- **Mark Messages Read**: Mark employer messages as read

### Contact & Support
- **Contact Form**: Send contact messages to admin
- **Email Notifications**: Receive email notifications for various events

---

## 2. EMPLOYER FUNCTIONALITIES

### Authentication & Account Management
- **Sign Up**: Create company account with:
  - Username, email, password
  - Company information
  - Business documents upload (multiple types):
    - Business permit
    - Registration documents (SEC/DTI)
    - Barangay clearance
    - Mayor's permit
    - BIR certificate
    - Sanitary permit
    - FDA permit
    - Labeling compliance
  - Registration number and date
- **Login**: Secure login with session management
- **Logout**: Session termination
- **Password Reset**: Email-based password reset
- **Account Approval**: Accounts require admin approval
- **Account Status**: Accounts can be active/inactive

### Profile Management
- **Get Profile**: Retrieve company profile information
- **Update Profile**: Update company details:
  - Company name, description
  - Company website
  - Company location (with latitude/longitude)
  - Industry
  - Email
- **Change Password**: Update account password

### Job Posting & Management
- **Create Job**: Post new job listings with:
  - Job title, location (with coordinates)
  - Job type (full-time, part-time, contract, internship, freelance)
  - Work setup (on-site, hybrid, remote)
  - Description and requirements
  - Salary range
  - Experience level
  - Automatic notification to all active employees
- **Search Jobs**: Search and filter own job postings by:
  - Search query
  - Status (active/closed)
  - Sort options (newest, oldest, title)
- **Get Job Details**: Retrieve specific job information
- **Edit Job**: Update existing job postings
- **Job Status Management**: Activate or close job postings

### Application Management
- **View Applications**: View all job applications with filtering:
  - Filter by job
  - Filter by status
- **Application Details**: View detailed application information:
  - Employee information
  - Application date
  - Cover letter
  - Resume download
  - Interview date and location
- **Update Application Status**: Change application status:
  - Pending Review
  - Under Review
  - Shortlisted
  - Rejected
  - Interview Scheduled
  - Interviewed
  - Job Offered
  - Hired
  - Declined
- **Application Notes**: Add employer notes to applications
- **Interview Scheduling**: Schedule interviews with date and location
- **Email Notifications**: Automatic email notifications to applicants on status changes

### Candidate Recommendations
- **Candidate Search**: AI-powered candidate recommendation system with:
  - Industry filtering
  - Job type filtering
  - Work arrangement filtering
  - Skills matching
  - Experience level matching
  - Education matching
  - Certifications matching
  - Languages matching
  - Salary range matching
  - Availability matching
- **Match Scoring**: View candidate match percentages with detailed breakdown:
  - NLP score
  - Experience score
  - Education score
  - Skills match count
- **Candidate Profiles**: View detailed candidate profiles
- **Job Preferences Display**: View candidate job preferences

### Employee Profile Viewing
- **View Employee Profile**: View detailed employee profiles from applications or recommendations

### Messaging System
- **Messages List**: View all conversations with employees
- **Conversation Detail**: View and participate in conversations
- **Send Messages**: Send messages to employees via AJAX
- **Start Conversation**: Initiate conversation from application
- **Unread Count**: Track unread messages
- **Mark Messages Read**: Mark employee messages as read

### Contact & Support
- **Contact Form**: Send contact messages to admin

### Dashboard & Statistics
- **Home Dashboard**: View:
  - Total jobs posted
  - Total applications received
  - Job listings with application counts
  - Quick statistics

---

## 3. ADMIN FUNCTIONALITIES

### Authentication
- **Admin Login**: Secure admin login
- **Admin Logout**: Session termination
- **Access Control**: Role-based access control for admin functions

### User Management
- **Dashboard**: Main admin dashboard with:
  - Employee and employer listings
  - Search functionality
  - Status filtering (active, inactive, pending, approved, rejected)
- **User Details**: View detailed user information
- **Toggle User Status**: Activate/deactivate user accounts
- **Delete Users**: Remove users from system

### Employee Approval System
- **Approval Dashboard**: View employees by status:
  - Pending employees
  - Approved employees
  - Rejected employees
- **View Employee Details**: View complete employee information including documents
- **Approve Employee**: Approve employee accounts with email notification
- **Reject Employee**: Reject employee accounts with reason and email notification
- **Reconsider Employee**: Move rejected employees back to pending

### Employer Approval System
- **Approval Dashboard**: View employers by status:
  - Pending employers
  - Approved employers
  - Rejected employers
- **View Employer Details**: View complete employer information including:
  - Company details
  - All uploaded documents (business permit, registration, etc.)
  - Registration types
- **Approve Employer**: Approve employer accounts with email notification
- **Reject Employer**: Reject employer accounts with reason and email notification
- **Reconsider Employer**: Move rejected employers back to pending
- **Toggle Verification**: Toggle employer verification status

### Job Monitoring
- **Jobs Dashboard**: Monitor all job postings with:
  - Search functionality
  - Status filtering (active/closed)
  - Job type filtering
  - Work setup filtering
  - Experience level filtering
  - Employer filtering
  - Application counts
- **Job Details**: View detailed job information
- **Job Statistics**: View total, active, and closed job counts

### Application Monitoring
- **Applications Dashboard**: Monitor all job applications with:
  - Search functionality
  - Status filtering
  - Job filtering
  - Application statistics
- **Application Details**: View detailed application information

### User Monitoring
- **User Monitoring Dashboard**: Comprehensive user activity monitoring:
  - Total employees and employers
  - Active users count
  - Pending approvals count
  - Recent registrations
  - Job statistics
  - Application statistics

### System Reports
- **System Reports**: Generate comprehensive system reports including:
  - User registration statistics (last 30 days)
  - Approval statistics
  - Job statistics
  - Application statistics
  - Status breakdowns
  - Top employers by job count
  - Top employees by application count
- **Export Reports**: Export reports as CSV files for:
  - Users report
  - Jobs report
  - Applications report

---

## 4. TECHNICAL FEATURES

### AI & Machine Learning
- **Candidate Recommender**: Advanced recommendation system using:
  - TF-IDF vectorization
  - Cosine similarity
  - String similarity matching
  - Weighted scoring algorithm
  - Profile completeness analysis
- **Resume Analyzer**: NLP-based resume analysis:
  - Skill extraction
  - Education extraction
  - Experience extraction
  - Job matching

### Email System
- **Email Notifications**: Automated email notifications for:
  - Password reset links
  - Account approval/rejection
  - Application status updates
  - New job postings
  - Contact form submissions
- **Email Templates**: HTML and text email templates
- **Email Timeout Handling**: Robust email sending with timeout protection

### File Management
- **File Uploads**: Support for multiple file types:
  - PDF, JPG, JPEG, PNG
  - File size validation (10MB limit)
  - Secure file storage
- **Resume Management**: Resume upload, storage, and download
- **Document Management**: Business document storage and retrieval

### Geographic Features
- **Location Services**: 
  - Latitude/longitude storage
  - Interactive job mapping
  - Location-based job filtering

### Security Features
- **Password Hashing**: Secure password storage using Django's password hashers
- **Session Management**: Secure session-based authentication
- **CSRF Protection**: Cross-site request forgery protection
- **Access Control**: Role-based access control
- **File Validation**: File type and size validation

### Data Management
- **Database Models**: Comprehensive data models for:
  - Users (Employee, Employer, Admin)
  - Jobs
  - Applications
  - Notifications
  - Messages/Conversations
  - Feedback/Reviews
  - Job Preferences
  - Saved Jobs
- **Data Relationships**: Proper foreign key relationships
- **Data Validation**: Form and model validation

### API Endpoints
- **RESTful APIs**: JSON-based API endpoints for:
  - Profile management
  - Job operations
  - Application management
  - Messaging
  - Notifications
  - Search and filtering

### Frontend Features
- **Responsive Design**: Mobile-friendly interface
- **AJAX Operations**: Asynchronous operations for better UX
- **Real-time Updates**: Real-time notification and message counts
- **Interactive Maps**: Job location visualization
- **PDF Generation**: Client-side and server-side PDF generation

---

## 5. DATA MODELS

### Employee Models
- **Employee**: User profile with skills, experience, education
- **JobPreferences**: Detailed job preference settings
- **Notification**: Employee notifications
- **SavedJob**: Saved job bookmarks
- **EmployeeFeedback**: Job/employer feedback
- **EmployerFeedback**: Company reviews
- **Conversation**: Messaging conversations
- **Message**: Individual messages

### Employer Models
- **Employer**: Company profile with business documents
- **Job**: Job postings with full details
- **JobApplication**: Job applications with status tracking

### Admin Models
- **AdminUser**: Admin user accounts

---

## 6. WORKFLOWS

### Employee Workflow
1. Sign up → Wait for approval → Login
2. Complete profile → Set job preferences
3. Browse/search jobs → View job details
4. Apply for jobs → Track application status
5. Receive notifications → Respond to messages
6. Submit feedback after job experience

### Employer Workflow
1. Sign up with documents → Wait for approval → Login
2. Complete company profile
3. Post job listings → Receive applications
4. Review applications → Use candidate recommendations
5. Update application status → Schedule interviews
6. Communicate with candidates via messaging

### Admin Workflow
1. Login to admin panel
2. Review pending users → Approve/reject
3. Monitor jobs and applications
4. Generate reports → Export data
5. Manage user accounts

---

## 7. INTEGRATION FEATURES

### External Services
- **Email Service**: SMTP email integration
- **File Storage**: Media file handling
- **Map Services**: Location-based features

### Third-party Libraries
- **scikit-learn**: Machine learning for recommendations
- **ReportLab**: PDF generation
- **NumPy**: Numerical computations

---

## Summary

GEOCONNECT is a full-featured job portal platform with:
- **3 user types** (Employee, Employer, Admin)
- **50+ major features** across all modules
- **AI-powered recommendations** for candidate matching
- **Comprehensive messaging system** for communication
- **Robust approval workflow** for user verification
- **Advanced search and filtering** capabilities
- **Real-time notifications** and updates
- **Feedback and review system** for quality assurance
- **Geographic features** for location-based matching
- **Admin dashboard** for system management

The platform provides a complete solution for connecting job seekers with employers while maintaining quality through approval processes and feedback systems.

