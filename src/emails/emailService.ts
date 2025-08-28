import emailjs from '@emailjs/browser';

// EmailJS configuration for project notifications (Original account)
const EMAILJS_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_PROJECT_SERVICE_ID || 'service_7fw63y9',
  templateId: import.meta.env.VITE_EMAILJS_PROJECT_TEMPLATE_ID || 'template_uct3d5l',
  publicKey: import.meta.env.VITE_EMAILJS_PROJECT_PUBLIC_KEY || 'FczWejeDBjHh8k_5E'
};

// EmailJS configuration for deliverables signed off notifications (New account)
const DELIVERABLES_SIGNED_OFF_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_DELIVERABLES_SERVICE_ID || 'service_uxdp209',
  templateId: import.meta.env.VITE_EMAILJS_DELIVERABLES_TEMPLATE_ID || 'template_ophe9j8',
  publicKey: import.meta.env.VITE_EMAILJS_DELIVERABLES_PUBLIC_KEY || 'XeoTtUWpEbiTj3ouV'
};

// EmailJS configuration for AI verification notifications
const AI_VERIFICATION_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_AI_VERIFICATION_SERVICE_ID || 'service_uxdp209',
  templateId: import.meta.env.VITE_EMAILJS_AI_VERIFICATION_TEMPLATE_ID || 'template_gsavks3',
  publicKey: import.meta.env.VITE_EMAILJS_AI_VERIFICATION_PUBLIC_KEY || 'XeoTtUWpEbiTj3ouV'
};

// EmailJS configuration for manual revision notifications
const MANUAL_REVISION_CONFIG = {
  serviceId: import.meta.env.VITE_EMAILJS_MANUAL_REVISION_SERVICE_ID || 'service_7fw63y9',
  templateId: import.meta.env.VITE_EMAILJS_MANUAL_REVISION_TEMPLATE_ID || 'template_kiyao93',
  publicKey: import.meta.env.VITE_EMAILJS_MANUAL_REVISION_PUBLIC_KEY || 'FczWejeDBjHh8k_5E'
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

export interface AIVerificationData {
  freelancerEmail: string;
  freelancerName: string;
  clientEmail: string;
  clientName: string;
  projectId: string;
  projectName: string;
  verificationScore: number;
}

export interface ManualRevisionData {
  freelancerEmail: string;
  freelancerName: string;
  clientEmail: string;
  clientName: string;
  projectId: string;
  projectName: string;
  verificationScore: number;
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
    console.log('🔍 EmailService: Starting sendProjectNotification');
    console.log('🔍 EmailService: Email data:', data);
    
    try {
      const templateParams = {
        to_email: data.freelancerEmail,
        to_name: data.freelancerName,
        project_id: data.projectId,
        project_name: data.projectName,
        client_id: data.clientId,
        client_name: data.clientName,
        project_requirement: data.projectRequirement,
        deliverables: data.deliverables.join(', '),
        completion_date: data.completionDate
      };

      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      console.log('✅ Project notification email sent successfully:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending project notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendDeliverablesSignedOffNotification(data: DeliverablesSignedOffData): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 EmailService: Starting sendDeliverablesSignedOffNotification');
    console.log('🔍 EmailService: Email data:', data);
    
    try {
      const templateParams = {
        to_email: data.clientEmail,
        to_name: data.clientName,
        project_id: data.projectId,
        project_name: data.projectName,
        freelancer_id: data.freelancerId,
        freelancer_name: data.freelancerName,
        project_requirement: data.projectRequirement,
        deliverables: data.deliverables.join(', '),
        completion_date: data.completionDate
      };

      const response = await emailjs.send(
        DELIVERABLES_SIGNED_OFF_CONFIG.serviceId,
        DELIVERABLES_SIGNED_OFF_CONFIG.templateId,
        templateParams,
        DELIVERABLES_SIGNED_OFF_CONFIG.publicKey
      );

      console.log('✅ Deliverables signed off notification email sent successfully:', response);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending deliverables signed off notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
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

  async sendAIVerificationNotification(data: AIVerificationData): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 EmailService: Starting sendAIVerificationNotification');
    console.log('🔍 EmailService: Email data:', data);
    
    try {
      // Send to freelancer using AI verification template
      const freelancerTemplateParams = {
        to_email: data.freelancerEmail,
        to_name: data.freelancerName,
        project_id: data.projectId,
        project_name: data.projectName,
        verification_score: (data.verificationScore * 100).toFixed(1) + '%',
        client_name: data.clientName
      };

      const freelancerResponse = await emailjs.send(
        AI_VERIFICATION_CONFIG.serviceId,
        AI_VERIFICATION_CONFIG.templateId,
        freelancerTemplateParams,
        AI_VERIFICATION_CONFIG.publicKey
      );

      console.log('✅ AI verification notification email sent to freelancer:', freelancerResponse);

      // Send to client using AI verification template
      const clientTemplateParams = {
        to_email: data.clientEmail,
        to_name: data.clientName,
        project_id: data.projectId,
        project_name: data.projectName,
        verification_score: (data.verificationScore * 100).toFixed(1) + '%',
        freelancer_name: data.freelancerName
      };

      const clientResponse = await emailjs.send(
        AI_VERIFICATION_CONFIG.serviceId,
        AI_VERIFICATION_CONFIG.templateId,
        clientTemplateParams,
        AI_VERIFICATION_CONFIG.publicKey
      );

      console.log('✅ AI verification notification email sent to client:', clientResponse);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending AI verification notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async sendManualRevisionNotification(data: ManualRevisionData): Promise<{ success: boolean; error?: string }> {
    console.log('🔍 EmailService: Starting sendManualRevisionNotification');
    console.log('🔍 EmailService: Email data:', data);
    
    try {
      // Send to freelancer using manual revision template
      const freelancerTemplateParams = {
        to_email: data.freelancerEmail,
        to_name: data.freelancerName,
        project_id: data.projectId,
        project_name: data.projectName,
        verification_score: (data.verificationScore * 100).toFixed(1) + '%',
        client_name: data.clientName
      };

      const freelancerResponse = await emailjs.send(
        MANUAL_REVISION_CONFIG.serviceId,
        MANUAL_REVISION_CONFIG.templateId,
        freelancerTemplateParams,
        MANUAL_REVISION_CONFIG.publicKey
      );

      console.log('✅ Manual revision notification email sent to freelancer:', freelancerResponse);

      // Send to client using manual revision template
      const clientTemplateParams = {
        to_email: data.clientEmail,
        to_name: data.clientName,
        project_id: data.projectId,
        project_name: data.projectName,
        verification_score: (data.verificationScore * 100).toFixed(1) + '%',
        freelancer_name: data.freelancerName
      };

      const clientResponse = await emailjs.send(
        MANUAL_REVISION_CONFIG.serviceId,
        MANUAL_REVISION_CONFIG.templateId,
        clientTemplateParams,
        MANUAL_REVISION_CONFIG.publicKey
      );

      console.log('✅ Manual revision notification email sent to client:', clientResponse);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending manual revision notification email:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

}

export default EmailService; 