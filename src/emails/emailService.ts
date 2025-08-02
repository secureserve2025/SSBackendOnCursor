import emailjs from '@emailjs/browser';

// ⚠️ TEMPORARILY DISABLED - Email notifications are disabled during development
// to prevent hitting EmailJS service limits. All email functions will log what
// would be sent but won't actually send emails.
// 
// To re-enable emails: Uncomment the original email sending code in each function
// and remove the "TEMPORARILY DISABLED" return statements.

// EmailJS configuration for project notifications (Original account)
const EMAILJS_CONFIG = {
  serviceId: 'service_7fw63y9', // Same service as landing page
  templateId: 'template_uct3d5l', // Template for project notifications
  publicKey: 'FczWejeDBjHh8k_5E' // Same public key as landing page
};

// EmailJS configuration for deliverables signed off notifications (New account)
const DELIVERABLES_SIGNED_OFF_CONFIG = {
  serviceId: 'service_uxdp209', // New EmailJS service ID
  templateId: 'template_ophe9j8', // New EmailJS template ID
  publicKey: 'XeoTtUWpEbiTj3ouV' // New EmailJS public key
};

export interface EmailData {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface ProjectNotificationData {
  freelancerEmail: string;
  freelancerName: string;
  projectId: string;
  projectName: string;
  clientId: string;
  clientName: string;
  projectRequirement: string;
  deliverables: string[];
  completionDate: string;
}

export interface DeliverablesSignedOffData {
  clientEmail: string;
  clientName: string;
  projectId: string;
  projectName: string;
  freelancerId: string;
  freelancerName: string;
  projectRequirement: string;
  deliverables: string[];
  completionDate: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export class EmailService {
  private static instance: EmailService;

  constructor() {
    // No initialization needed for Edge Function approach
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }



  async sendProjectNotification(data: ProjectNotificationData): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 EmailService: Starting sendProjectNotification (TEMPORARILY DISABLED)');
    console.log('🔍 EmailService: Email data:', data);
    
    // TEMPORARILY DISABLED - Email notifications disabled during development
    console.log('📧 EMAIL NOTIFICATION DISABLED: Project notification would be sent to:', data.freelancerEmail);
    console.log('📧 EMAIL NOTIFICATION DISABLED: Project ID:', data.projectId);
    console.log('📧 EMAIL NOTIFICATION DISABLED: Project Name:', data.projectName);
    
    // Return success to prevent errors in the application
    return { success: true, error: 'Email notifications temporarily disabled during development' };
  }

  async sendDeliverablesSignedOffNotification(data: DeliverablesSignedOffData): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 EmailService: Starting sendDeliverablesSignedOffNotification (TEMPORARILY DISABLED)');
    console.log('🔍 EmailService: Email data:', data);
    
    // TEMPORARILY DISABLED - Email notifications disabled during development
    console.log('📧 EMAIL NOTIFICATION DISABLED: Deliverables signed off notification would be sent to:', data.clientEmail);
    console.log('📧 EMAIL NOTIFICATION DISABLED: Project ID:', data.projectId);
    console.log('📧 EMAIL NOTIFICATION DISABLED: Project Name:', data.projectName);
    
    // Return success to prevent errors in the application
    return { success: true, error: 'Email notifications temporarily disabled during development' };
  }

  async sendContactFormEmail(data: ContactFormData): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 EmailService: Starting sendContactFormEmail (TEMPORARILY DISABLED)');
    console.log('🔍 EmailService: Contact form data:', data);
    
    // TEMPORARILY DISABLED - Email notifications disabled during development
    console.log('📧 EMAIL NOTIFICATION DISABLED: Contact form email would be sent from:', data.email);
    console.log('📧 EMAIL NOTIFICATION DISABLED: Contact name:', data.name);
    console.log('📧 EMAIL NOTIFICATION DISABLED: Message:', data.message);
    
    // Return success to prevent errors in the application
    return { success: true, error: 'Email notifications temporarily disabled during development' };
  }

}

export default EmailService; 