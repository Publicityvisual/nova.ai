/**
 * SOFIA EMAIL AUTOMATION v5.0
 * Envío inteligente de correos, seguimientos automáticos, newsletters
 * Gestión completa de comunicación por email
 */

const nodemailer = require('nodemailer');
const fs = require('fs-extra');
const path = require('path');

class EmailAutomation {
  constructor() {
    this.transporters = new Map();
    this.templates = new Map();
    this.scheduledEmails = [];
    this.setupDefaultTransporter();
    this.loadEmailTemplates();
  }

  setupDefaultTransporter() {
    // Configuración SMTP desde env
    const smtpConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
      }
    };

    if (smtpConfig.auth.user) {
      this.transporters.set('default', nodemailer.createTransport(smtpConfig));
    }
  }

  loadEmailTemplates() {
    // Templates de email cargados dinámicamente
    this.templates.set('welcome', {
      subject: '¡Bienvenido a Publicity Visual!',
      html: `
        <h1>¡Hola {{name}}! 👋</h1>
        <p>Soy Sofia Gonzalez, secretaria ejecutiva de Publicity Visual.</p>
        <p>Gracias por contactarnos. Estoy aquí para ayudarte con:</p>
        <ul>
          <li>Diseño de marca e identidad visual</li>
          <li>Desarrollo web y aplicaciones</li>
          <li>Marketing digital y redes sociales</li>
          <li>Producción audiovisual</li>
        </ul>
        <p>¿En qué puedo apoyarte hoy? Responde a este email o escríbenos por WhatsApp.</p>
        <p>Saludos cordiales,<br>Sofia Gonzalez<br><a href="tel:+5214426689053">442 668 9053</a></p>
      `
    });

    this.templates.set('proposal_followup', {
      subject: 'Seguimiento: Propuesta de {{service}}',
      html: `
        <h1>Hola {{name}} 👋</h1>
        <p>Te escribo para hacer seguimiento de la propuesta que te enviamos para {{service}}.</p>
        <p>Sé que estás ocupado/a, pero quería asegurarme de que recibiste toda la información y aclarar cualquier duda que tengas.</p>
        <p>El proyecto suena emocionante y me encantaría que trabajáramos juntos.</p>
        <p>¿Tienes 10 minutos esta semana para una llamada rápida?</p>
        <p>Saludos,<br>Sofia Gonzalez<br>Publicity Visual</p>
      `
    });

    this.templates.set('meeting_confirmation', {
      subject: 'Confirmación: Reunión del {{date}}',
      html: `
        <h1>¡Hola {{name}}! ✅</h1>
        <p>Confirmo nuestra reunión para el <strong>{{date}} a las {{time}}</strong>.</p>
        <p>📍 {{location}}</p>
        <p>Para que la reunión sea super productiva, ayúdame con:</p>
        <ul>
          <li>Breve descripción de tu proyecto</li>
          <li>Ejemplos de referencia que te gusten (si tienes)</li>
          <li>Presupuesto aproximado que manejas</li>
        </ul>
        <p>¡Nos vemos pronto!</p>
        <p>Sofia Gonzalez</p>
      `
    });

    this.templates.set('project_update', {
      subject: 'Actualización: Proyecto {{projectName}}',
      html: `
        <h1>Hola {{name}} 👋</h1>
        <p>Actualización sobre tu proyecto <strong>{{projectName}}</strong>:</p>
        <div style="background:#f5f5f5;padding:15px;border-radius:5px;">
          <p><strong>Estado:</strong> {{status}}</p>
          <p><strong>Progreso:</strong> {{progress}}%</p>
          <p><strong>Siguiente entrega:</strong> {{nextMilestone}}</p>
        </div>
        <p>{{customMessage}}</p>
        <p>Cualquier duda, aquí estoy.</p>
        <p>Sofia Gonzalez</p>
      `
    });

    this.templates.set('invoice', {
      subject: 'Factura {{invoiceNumber}} - Publicity Visual',
      html: `
        <h1>Hola {{name}} 👋</h1>
        <p>Te envío la factura correspondiente a tu proyecto:</p>
        <div style="border:2px solid #333;padding:20px;margin:20px 0;">
          <p><strong>Factura #{{invoiceNumber}}</strong></p>
          <p><strong>Monto:</strong> ${{amount}} MXN</p>
          <p><strong>Descripción:</strong> {{description}}</p>
          <p><strong>Vencimiento:</strong> {{dueDate}}</p>
        </div>
        <p>Datos bancarios para depósito:</p>
        <ul>
          <li>Banco: {{bankName}}</li>
          <li>Cuenta: {{accountNumber}}</li>
          <li>CLABE: {{clabe}}</li>
        </ul>
        <p>Agradezco tu pronto pago. Cualquier duda con la factura, me escribes.</p>
        <p>Gracias,<br>Sofia Gonzalez</p>
      `
    });

    this.templates.set('research_report', {
      subject: 'Informe de Investigación: {{topic}}',
      html: `
        <h1>Informe de Investigación: {{topic}}</h1>
        <p>Hola {{name}},</p>
        <p>Realicé la investigación que me solicitaste. Aquí está el resumen ejecutivo:</p>
        <div style="background:#f0f8ff;padding:20px;">
          {{researchContent}}
        </div>
        <p><strong>Fuentes consultadas:</strong> {{sourcesCount}}</p>
        <p><strong>Tiempo de investigación:</strong> {{researchTime}}</p>
        <p>¿Necesitas que profundice en algún punto específico?</p>
        <p>Saludos,<br>Sofia</p>
      `
    });
  }

  /**
   * Envía email con template
   */
  async sendTemplatedEmail(templateName, to, data = {}, options = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' no encontrado`);
    }

    const processedHtml = this.processTemplate(template.html, data);
    const processedSubject = this.processTemplate(template.subject, data);

    return await this.sendEmail({
      to,
      subject: processedSubject,
      html: processedHtml,
      ...options
    });
  }

  processTemplate(template, data) {
    let processed = template;
    for (const [key, value] of Object.entries(data)) {
      processed = processed.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }
    return processed;
  }

  /**
   * Envía email básico
   */
  async sendEmail(options) {
    const transporter = this.transporters.get('default');
    if (!transporter) {
      throw new Error('No hay transportador de email configurado');
    }

    const mailOptions = {
      from: `"Sofia Gonzalez - Publicity Visual" <${process.env.EMAIL_USER}>`,
      ...options
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('[EMAIL] Enviado:', result.messageId);
      
      // Guardar registro
      await this.logEmail('sent', mailOptions, result);
      
      return {
        success: true,
        messageId: result.messageId,
        previewUrl: nodemailer.getTestMessageUrl(result)
      };
    } catch (error) {
      console.error('[EMAIL] Error:', error);
      await this.logEmail('failed', mailOptions, null, error);
      throw error;
    }
  }

  /**
   * Programa email para envío futuro
   */
  async scheduleEmail(templateName, to, data, sendAt) {
    const scheduledEmail = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      templateName,
      to,
      data,
      sendAt: new Date(sendAt).getTime(),
      status: 'scheduled',
      createdAt: Date.now()
    };

    this.scheduledEmails.push(scheduledEmail);
    
    // Guardar en persistencia
    await this.saveScheduledEmails();
    
    return scheduledEmail;
  }

  /**
   * Procesa emails programados (ejecutar cada minuto)
   */
  async processScheduledEmails() {
    const now = Date.now();
    const dueEmails = this.scheduledEmails.filter(
      e => e.status === 'scheduled' && e.sendAt <= now
    );

    for (const email of dueEmails) {
      try {
        await this.sendTemplatedEmail(email.templateName, email.to, email.data);
        email.status = 'sent';
        email.sentAt = Date.now();
      } catch (error) {
        email.status = 'failed';
        email.error = error.message;
        // Reintentar si es necesario
        if (!email.retries) email.retries = 0;
        email.retries++;
        
        if (email.retries < 3) {
          email.sendAt = now + (5 * 60 * 1000); // Reintentar en 5 min
          email.status = 'scheduled';
        }
      }
    }

    await this.saveScheduledEmails();
  }

  /**
   * Seguimiento automático post-envío
   */
  async setupFollowUp(to, templateName, data, delayDays = 3) {
    const followUpDate = new Date();
    followUpDate.setDate(followUpDate.getDate() + delayDays);
    
    return await this.scheduleEmail(templateName, to, data, followUpDate);
  }

  /**
   * Sequences de email automatizadas
   */
  async createEmailSequence(userId, sequenceType) {
    const sequences = {
      'new_lead': [
        { template: 'welcome', delay: 0 },
        { template: 'proposal_followup', delay: 2 },
        { template: 'meeting_confirmation', delay: 7 }
      ],
      'project_started': [
        { template: 'project_update', delay: 0 },
        { template: 'project_update', delay: 7 },
        { template: 'project_update', delay: 14 }
      ],
      'after_proposal': [
        { template: 'proposal_followup', delay: 2 },
        { template: 'proposal_followup', delay: 7 },
        { template: 'proposal_followup', delay: 14 }
      ]
    };

    const sequence = sequences[sequenceType];
    if (!sequence) return null;

    const scheduledIds = [];
    
    for (const step of sequence) {
      const sendDate = new Date();
      sendDate.setDate(sendDate.getDate() + step.delay);
      
      const scheduled = await this.scheduleEmail(
        step.template,
        userId,
        {}, // Data se llena dinámicamente
        sendDate
      );
      
      scheduledIds.push(scheduled.id);
    }

    return { sequenceType, emails: scheduledIds };
  }

  /**
   * Email de investigación automática
   */
  async sendResearchEmail(to, topic, researchData) {
    const data = {
      name: researchData.contactName || 'Cliente',
      topic: topic,
      researchContent: this.formatResearchContent(researchData),
      sourcesCount: researchData.sources?.length || 0,
      researchTime: researchData.duration || 'N/A'
    };

    return await this.sendTemplatedEmail('research_report', to, data);
  }

  formatResearchContent(research) {
    if (!research.summary) return 'Sin contenido';
    
    return `
      <h2>Resumen Ejecutivo</h2>
      <p>${research.summary}</p>
      
      <h3>Hallazgos Clave:</h3>
      <ul>
        ${(research.keyFindings || []).map(f => `<li>${f}</li>`).join('')}
      </ul>
      
      <h3>Recomendaciones:</h3>
      <ul>
        ${(research.recommendations || []).map(r => `<li>${r}</li>`).join('')}
      </ul>
    `;
  }

  /**
   * Analytics de emails
   */
  async getEmailStats(days = 30) {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    const logsPath = path.join(__dirname, '../../data/email_logs');
    const files = await fs.readdir(logsPath).catch(() => []);
    
    const stats = {
      sent: 0,
      opened: 0,
      clicked: 0,
      bounced: 0,
      failed: 0,
      byTemplate: {}
    };

    for (const file of files) {
      const log = await fs.readJSON(path.join(logsPath, file));
      if (log.timestamp > cutoff) {
        stats.sent++;
        if (log.status === 'failed') stats.failed++;
        
        if (log.template) {
          stats.byTemplate[log.template] = (stats.byTemplate[log.template] || 0) + 1;
        }
      }
    }

    return stats;
  }

  // ============= UTILIDADES =============

  async logEmail(status, mailOptions, result, error = null) {
    const log = {
      timestamp: Date.now(),
      status,
      to: mailOptions.to,
      subject: mailOptions.subject,
      template: mailOptions.template,
      messageId: result?.messageId,
      error: error?.message
    };

    const logPath = path.join(__dirname, '../../data/email_logs');
    await fs.ensureDir(logPath);
    
    const filename = `email_${Date.now()}.json`;
    await fs.writeJSON(path.join(logPath, filename), log);
  }

  async saveScheduledEmails() {
    await fs.writeJSON(
      path.join(__dirname, '../../data/scheduled_emails.json'),
      this.scheduledEmails
    );
  }

  async loadScheduledEmails() {
    try {
      const data = await fs.readJSON(
        path.join(__dirname, '../../data/scheduled_emails.json')
      );
      this.scheduledEmails = data || [];
    } catch {
      this.scheduledEmails = [];
    }
  }

  /**
   * Genera email personalizado con IA
   */
  async generateAIEmail(context, recipient, purpose) {
    const systemPrompt = `Eres Sofia Gonzalez, escribiendo un email profesional pero cálido.
    
Contexto de la conversación:
${context}

Destinatario: ${recipient}
Propósito: ${purpose}

Escribe un email cortés, profesional, con tono mexicano natural. Incluye:
- Saludo personalizado
- Cuerpo claro y conciso
- Llamada a la acción
- Despedida profesional

NO uses lenguaje robótico. Sé humana, cálida, eficiente.`;

    // Aquí iría integración con OpenRouter para generar el email
    // Por ahora, retornamos estructura
    
    return {
      subject: `Re: ${purpose}`,
      html: `
        <p>Estimado/a ${recipient},</p>
        <p>${purpose}</p>
        <p>Quedo atenta a tus comentarios.</p>
        <p>Saludos,<br>Sofia Gonzalez<br>Publicity Visual</p>
      `
    };
  }
}

module.exports = new EmailAutomation();
