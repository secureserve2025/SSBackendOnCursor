# EmailJS Setup Guide

## To enable actual email sending, follow these steps:

### 1. Sign up for EmailJS
- Go to [EmailJS.com](https://www.emailjs.com/)
- Create a free account
- Verify your email address

### 2. Create an Email Service
- In EmailJS dashboard, go to "Email Services"
- Click "Add New Service"
- Choose your email provider (Gmail, Outlook, etc.)
- Connect your email account
- Note down the **Service ID**

### 3. Create an Email Template
- Go to "Email Templates"
- Click "Create New Template"
- Use this template:

```html
Subject: New Contact Form Message from {{from_name}}

Name: {{from_name}}
Email: {{from_email}}
Message: {{message}}

This message was sent from the SecureServe contact form.
```

- Save the template and note down the **Template ID**

### 4. Get Your Public Key
- Go to "Account" → "API Keys"
- Copy your **Public Key**

### 5. Update the Component
Replace the placeholder values in `src/components/CTASection.tsx`:

```typescript
const serviceId = 'YOUR_EMAILJS_SERVICE_ID'; // Replace with your actual service ID
const templateId = 'YOUR_EMAILJS_TEMPLATE_ID'; // Replace with your actual template ID
const publicKey = 'YOUR_EMAILJS_PUBLIC_KEY'; // Replace with your actual public key
```

### 6. Test the Form
- Fill out the contact form with valid data
- Click "Send Message"
- Check your email (secureserve2025@gmail.com) for the message

## Alternative: Quick Test Setup

For immediate testing, you can use these demo credentials (replace in the component):

```typescript
const serviceId = 'service_123456789'; // Replace with actual
const templateId = 'template_123456789'; // Replace with actual  
const publicKey = 'public_key_123456789'; // Replace with actual
```

## Notes:
- EmailJS free plan allows 200 emails per month
- For production, consider upgrading to a paid plan
- The form will work with the current setup but will log email data to console for manual sending 