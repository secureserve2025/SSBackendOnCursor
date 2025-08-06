# Notifications Feature

## Overview
The Notifications feature provides a mobile-responsive page for both client and freelancer dashboards that displays projects requiring attention. It shows projects with status "Under Manual Revision" or "AI Verified" in an accordion-style interface.

## Features

### Mobile-Responsive Design
- Clean, readable interface optimized for mobile devices
- Accordion-style tabs to manage space efficiently
- Touch-friendly buttons and interactions
- Responsive grid layout for project cards

### Project Status Tracking
- **Under Manual Revision**: Projects that need manual review
- **AI Verified**: Projects that have been verified by AI and may require action

### Client Dashboard Notifications
For each project, displays:
1. Project ID
2. Project Name
3. Freelancer ID
4. Freelancer's last login time
5. Last time a work product was uploaded by freelancer
6. Last message timestamp
7. Action due (for AI Verified projects only)

### Freelancer Dashboard Notifications
For each project, displays:
1. Project ID
2. Project Name
3. Client ID
4. Client's last login time
5. Last time the client viewed work product
6. Last message timestamp
7. Action due (for AI Verified projects only)

### Action Due Logic
For AI Verified projects, the system calculates and displays appropriate action messages:

- **Fund transfer due**: When verification score > 90% and within 24 hours of verification
- **Fund transfer on hold**: When within 72 hours of verification (resubmission period)
- **Fund ready to chargeback**: When 72 hours have passed since verification

## Technical Implementation

### Database Functions
- `getClientNotifications(clientId)`: Fetches client notifications with project details
- `getFreelancerNotifications(freelancerId)`: Fetches freelancer notifications with project details

### Component Structure
- `Notifications.tsx`: Reusable component for both dashboards
- Integrated into both `ClientDashboard.tsx` and `FreelancerDashboard.tsx`
- Added as a new tab in both dashboards

### Styling
- Follows existing dashboard color themes
- Uses Tailwind CSS for responsive design
- Consistent with existing UI patterns

## Usage

1. Navigate to the dashboard (client or freelancer)
2. Click on the "Notifications" tab
3. Expand either "Under Manual Revision" or "AI Verified" sections
4. View project details and required actions

## Error Handling
- Graceful loading states
- Error messages for failed data fetches
- Empty state when no notifications exist
- Console error suppression for expected auth errors

## Mobile Optimization
- Touch-friendly accordion buttons
- Readable font sizes on small screens
- Proper spacing for mobile interaction
- Responsive grid layouts that stack on mobile 