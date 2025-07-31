import emailjs from '@emailjs/browser';

// EmailJS configuration for project notifications
const EMAILJS_CONFIG = {
  serviceId: 'service_7fw63y9', // Same service as landing page
  templateId: 'template_uct3d5l', // New template for project notifications
  publicKey: 'FczWejeDBjHh8k_5E' // Same public key as landing page
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
      console.log('🔍 EmailService: Calling EmailJS with project data...');
      
      // Format deliverables as plain text list
      const deliverablesList = data.deliverables.map((deliverable, index) => 
        `${index + 1}. ${deliverable}`
      ).join('\n');
      
      // Format completion date
      const formattedDate = new Date(data.completionDate).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Truncate project requirement
      const truncatedRequirement = data.projectRequirement.length > 150 
        ? data.projectRequirement.substring(0, 150) + '...' 
        : data.projectRequirement;
      
      // Validate that freelancer email is not empty
      if (!data.freelancerEmail || data.freelancerEmail.trim() === '') {
        console.error('❌ Freelancer email is empty or undefined');
        console.log('🔍 Data received:', data);
        return { success: false, error: 'Freelancer email is empty' };
      }

      const templateParams = {
        user_email: data.freelancerEmail.trim(),
        freelancer_name: data.freelancerName,
        project_id: data.projectId,
        project_name: data.projectName,
        client_id: data.clientId,
        client_name: data.clientName,
        completion_date: formattedDate,
        project_description: truncatedRequirement,
        deliverables_list: deliverablesList
      };

      console.log('🔍 EmailService: Template params:', templateParams);
      console.log('🔍 EmailService: user_email value:', templateParams.user_email);

      const result = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      if (result.status === 200) {
        console.log('✅ Project notification email sent successfully via EmailJS');
        console.log('📧 Email sent to freelancer at:', data.freelancerEmail);
        return { success: true };
      } else {
        console.error('❌ EmailJS returned non-200 status:', result.status);
        return { success: false, error: 'EmailJS returned non-200 status' };
      }
    } catch (error) {
      console.error('❌ Exception in sendProjectNotification:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }


}

export default EmailService; 