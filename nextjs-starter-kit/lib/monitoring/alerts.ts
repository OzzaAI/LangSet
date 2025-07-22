/**
 * Production Monitoring and Alert System for LangSet MVP
 * Automated alerts for critical errors, performance issues, and system health
 */

import { logger, LogLevel } from './error-logger';

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
  FATAL = 'fatal'
}

export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  component: string;
  operation?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  resolved?: boolean;
  resolvedAt?: Date;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: AlertSeverity;
  cooldown?: number; // Minimum time between alerts in milliseconds
  enabled: boolean;
}

class AlertingSystem {
  private static instance: AlertingSystem;
  private alerts: Map<string, Alert> = new Map();
  private cooldowns: Map<string, number> = new Map();
  private rules: AlertRule[] = [];

  private constructor() {
    this.initializeDefaultRules();
  }

  static getInstance(): AlertingSystem {
    if (!AlertingSystem.instance) {
      AlertingSystem.instance = new AlertingSystem();
    }
    return AlertingSystem.instance;
  }

  /**
   * Initialize default alerting rules
   */
  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        condition: (data) => data.errorRate > 0.05, // 5% error rate
        severity: AlertSeverity.WARNING,
        cooldown: 5 * 60 * 1000, // 5 minutes
        enabled: true
      },
      {
        id: 'memory-usage-high',
        name: 'High Memory Usage',
        condition: (data) => data.memoryUsage > 0.85, // 85% memory usage
        severity: AlertSeverity.WARNING,
        cooldown: 10 * 60 * 1000, // 10 minutes
        enabled: true
      },
      {
        id: 'memory-usage-critical',
        name: 'Critical Memory Usage',
        condition: (data) => data.memoryUsage > 0.95, // 95% memory usage
        severity: AlertSeverity.CRITICAL,
        cooldown: 2 * 60 * 1000, // 2 minutes
        enabled: true
      },
      {
        id: 'circuit-breaker-open',
        name: 'Circuit Breaker Open',
        condition: (data) => data.circuitBreakerOpen === true,
        severity: AlertSeverity.CRITICAL,
        cooldown: 1 * 60 * 1000, // 1 minute
        enabled: true
      },
      {
        id: 'database-connection-failed',
        name: 'Database Connection Failed',
        condition: (data) => data.databaseConnectionFailed === true,
        severity: AlertSeverity.CRITICAL,
        cooldown: 30 * 1000, // 30 seconds
        enabled: true
      },
      {
        id: 'slow-response-time',
        name: 'Slow Response Time',
        condition: (data) => data.responseTime > 5000, // 5 seconds
        severity: AlertSeverity.WARNING,
        cooldown: 15 * 60 * 1000, // 15 minutes
        enabled: true
      },
      {
        id: 'stripe-payment-failures',
        name: 'Payment Failures',
        condition: (data) => data.paymentFailureRate > 0.1, // 10% payment failure rate
        severity: AlertSeverity.CRITICAL,
        cooldown: 2 * 60 * 1000, // 2 minutes
        enabled: true
      },
      {
        id: 'authentication-failures',
        name: 'Authentication Failure Spike',
        condition: (data) => data.authFailures > 50, // More than 50 auth failures in timeframe
        severity: AlertSeverity.WARNING,
        cooldown: 10 * 60 * 1000, // 10 minutes
        enabled: true
      }
    ];
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if alert is in cooldown period
   */
  private isInCooldown(ruleId: string, cooldown: number): boolean {
    const lastAlert = this.cooldowns.get(ruleId);
    if (!lastAlert) return false;
    
    return (Date.now() - lastAlert) < cooldown;
  }

  /**
   * Create and fire an alert
   */
  async fireAlert(
    severity: AlertSeverity,
    title: string,
    message: string,
    component: string,
    operation?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      severity,
      title,
      message,
      component,
      operation,
      timestamp: new Date(),
      metadata,
      resolved: false
    };

    // Store alert
    this.alerts.set(alert.id, alert);

    // Log alert
    await logger.error(
      `ALERT: ${title}`,
      new Error(message),
      {
        component: 'alerting',
        operation: 'fire_alert',
        metadata: {
          alertId: alert.id,
          severity,
          originalComponent: component,
          originalOperation: operation,
          ...metadata
        }
      }
    );

    // Send to external alerting services
    await this.sendExternalAlert(alert);

    // Keep only recent alerts (last 1000)
    if (this.alerts.size > 1000) {
      const sortedAlerts = Array.from(this.alerts.entries())
        .sort(([, a], [, b]) => b.timestamp.getTime() - a.timestamp.getTime());
      
      this.alerts.clear();
      sortedAlerts.slice(0, 1000).forEach(([id, alert]) => {
        this.alerts.set(id, alert);
      });
    }
  }

  /**
   * Evaluate rules and fire alerts
   */
  async evaluateRules(data: Record<string, any>): Promise<void> {
    for (const rule of this.rules) {
      if (!rule.enabled) continue;

      try {
        if (rule.condition(data)) {
          // Check cooldown
          if (rule.cooldown && this.isInCooldown(rule.id, rule.cooldown)) {
            continue;
          }

          // Fire alert
          await this.fireAlert(
            rule.severity,
            rule.name,
            `Alert rule '${rule.name}' triggered`,
            'monitoring',
            'rule_evaluation',
            {
              ruleId: rule.id,
              triggerData: data
            }
          );

          // Update cooldown
          this.cooldowns.set(rule.id, Date.now());
        }
      } catch (error) {
        await logger.error(
          `Failed to evaluate alert rule: ${rule.name}`,
          error instanceof Error ? error : new Error(String(error)),
          {
            component: 'alerting',
            operation: 'evaluate_rule',
            metadata: { ruleId: rule.id }
          }
        );
      }
    }
  }

  /**
   * Send alert to external services
   */
  private async sendExternalAlert(alert: Alert): Promise<void> {
    const alertData = {
      id: alert.id,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      component: alert.component,
      operation: alert.operation,
      timestamp: alert.timestamp.toISOString(),
      metadata: alert.metadata,
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION
    };

    // Send to various channels based on severity
    const promises: Promise<void>[] = [];

    // Email alerts for critical issues
    if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.FATAL) {
      promises.push(this.sendEmailAlert(alertData));
    }

    // Slack notifications
    promises.push(this.sendSlackAlert(alertData));

    // Webhook notifications
    promises.push(this.sendWebhookAlert(alertData));

    // External monitoring services (Sentry, DataDog, etc.)
    promises.push(this.sendToMonitoringService(alertData));

    // Execute all notifications in parallel, but don't fail if some fail
    await Promise.allSettled(promises);
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alertData: any): Promise<void> {
    try {
      if (!process.env.EMAIL_ALERT_ENDPOINT) return;

      await fetch(process.env.EMAIL_ALERT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.EMAIL_ALERT_TOKEN}`
        },
        body: JSON.stringify({
          to: process.env.ALERT_EMAIL_RECIPIENTS?.split(',') || [],
          subject: `[${alertData.severity.toUpperCase()}] ${alertData.title}`,
          body: `
Alert Details:
- ID: ${alertData.id}
- Severity: ${alertData.severity}
- Component: ${alertData.component}
- Operation: ${alertData.operation || 'N/A'}
- Time: ${alertData.timestamp}
- Message: ${alertData.message}

Environment: ${alertData.environment}
Version: ${alertData.version}

${alertData.metadata ? `Metadata: ${JSON.stringify(alertData.metadata, null, 2)}` : ''}
          `
        })
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Send Slack alert
   */
  private async sendSlackAlert(alertData: any): Promise<void> {
    try {
      if (!process.env.SLACK_WEBHOOK_URL) return;

      const color = {
        [AlertSeverity.INFO]: 'good',
        [AlertSeverity.WARNING]: 'warning',
        [AlertSeverity.CRITICAL]: 'danger',
        [AlertSeverity.FATAL]: 'danger'
      }[alertData.severity as AlertSeverity];

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attachments: [{
            color,
            title: `🚨 ${alertData.title}`,
            text: alertData.message,
            fields: [
              { title: 'Severity', value: alertData.severity.toUpperCase(), short: true },
              { title: 'Component', value: alertData.component, short: true },
              { title: 'Environment', value: alertData.environment, short: true },
              { title: 'Time', value: alertData.timestamp, short: true }
            ],
            footer: `LangSet v${alertData.version}`,
            ts: Math.floor(Date.parse(alertData.timestamp) / 1000)
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alertData: any): Promise<void> {
    try {
      if (!process.env.ALERT_WEBHOOK_URL) return;

      await fetch(process.env.ALERT_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.ALERT_WEBHOOK_TOKEN}`
        },
        body: JSON.stringify(alertData)
      });
    } catch (error) {
      console.error('Failed to send webhook alert:', error);
    }
  }

  /**
   * Send to external monitoring service
   */
  private async sendToMonitoringService(alertData: any): Promise<void> {
    try {
      // Example: Send to Sentry, DataDog, or custom monitoring service
      if (process.env.MONITORING_SERVICE_URL) {
        await fetch(process.env.MONITORING_SERVICE_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.MONITORING_SERVICE_TOKEN}`
          },
          body: JSON.stringify({
            ...alertData,
            event_type: 'alert',
            source: 'langset-mvp'
          })
        });
      }
    } catch (error) {
      console.error('Failed to send to monitoring service:', error);
    }
  }

  /**
   * Resolve an alert
   */
  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      
      await logger.info(
        `Alert resolved: ${alert.title}`,
        {
          component: 'alerting',
          operation: 'resolve_alert',
          metadata: { alertId, resolutionTime: Date.now() - alert.timestamp.getTime() }
        }
      );
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Add custom rule
   */
  addRule(rule: AlertRule): void {
    const existingIndex = this.rules.findIndex(r => r.id === rule.id);
    if (existingIndex >= 0) {
      this.rules[existingIndex] = rule;
    } else {
      this.rules.push(rule);
    }
  }

  /**
   * Remove rule
   */
  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  /**
   * Get all rules
   */
  getRules(): AlertRule[] {
    return [...this.rules];
  }
}

// Export singleton
export const alertingSystem = AlertingSystem.getInstance();

/**
 * Quick alert functions
 */
export const alerts = {
  info: (title: string, message: string, component: string, metadata?: Record<string, any>) =>
    alertingSystem.fireAlert(AlertSeverity.INFO, title, message, component, undefined, metadata),

  warning: (title: string, message: string, component: string, metadata?: Record<string, any>) =>
    alertingSystem.fireAlert(AlertSeverity.WARNING, title, message, component, undefined, metadata),

  critical: (title: string, message: string, component: string, metadata?: Record<string, any>) =>
    alertingSystem.fireAlert(AlertSeverity.CRITICAL, title, message, component, undefined, metadata),

  fatal: (title: string, message: string, component: string, metadata?: Record<string, any>) =>
    alertingSystem.fireAlert(AlertSeverity.FATAL, title, message, component, undefined, metadata)
};

export default alertingSystem;