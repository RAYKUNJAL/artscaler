/**
 * Email Notification Service
 * 
 * Handles all email notifications for ArtIntel:
 * - Welcome emails
 * - Pulse alerts
 * - Weekly digests
 * - Payment receipts
 */

import { createClient } from '@supabase/supabase-js';

export interface EmailTemplate {
    to: string;
    subject: string;
    html: string;
    text: string;
}

export class EmailService {
    /**
     * Send welcome email to new users
     */
    static async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
        const template: EmailTemplate = {
            to: userEmail,
            subject: '🎨 Welcome to eBay Art Pulse Pro!',
            html: this.getWelcomeEmailHTML(userName),
            text: this.getWelcomeEmailText(userName)
        };

        return this.sendEmail(template);
    }

    /**
     * Send pulse alert for high WVS opportunities
     */
    static async sendPulseAlert(
        userEmail: string,
        opportunities: Array<{ topic: string; wvs: number; evidence: string }>
    ): Promise<boolean> {
        const template: EmailTemplate = {
            to: userEmail,
            subject: '🔥 Hot Pulse Alert: New High-Demand Opportunities!',
            html: this.getPulseAlertHTML(opportunities),
            text: this.getPulseAlertText(opportunities)
        };

        return this.sendEmail(template);
    }

    /**
     * Send weekly digest report
     */
    static async sendWeeklyDigest(
        userEmail: string,
        stats: {
            topOpportunities: number;
            totalListingsAnalyzed: number;
            avgWVS: number;
            topStyles: string[];
        }
    ): Promise<boolean> {
        const template: EmailTemplate = {
            to: userEmail,
            subject: '📊 Your Weekly eBay Art Pulse Report',
            html: this.getWeeklyDigestHTML(stats),
            text: this.getWeeklyDigestText(stats)
        };

        return this.sendEmail(template);
    }

    /**
     * Send payment receipt
     */
    static async sendPaymentReceipt(
        userEmail: string,
        amount: number,
        plan: string,
        receiptUrl: string
    ): Promise<boolean> {
        const template: EmailTemplate = {
            to: userEmail,
            subject: '✅ Payment Confirmed - eBay Art Pulse Pro',
            html: this.getPaymentReceiptHTML(amount, plan, receiptUrl),
            text: this.getPaymentReceiptText(amount, plan, receiptUrl)
        };

        return this.sendEmail(template);
    }

    /**
     * Core email sending function
     * Uses Supabase Edge Functions or external email service
     */
    private static async sendEmail(template: EmailTemplate): Promise<boolean> {
        try {
            // Option 1: Use Supabase Edge Function (recommended)
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!
            );

            const { data, error } = await supabase.functions.invoke('send-email', {
                body: template
            });

            if (error) {
                console.error('[Email] Supabase function error:', error);
                return false;
            }

            console.log(`[Email] Sent to ${template.to}: ${template.subject}`);
            return true;

        } catch (error) {
            console.error('[Email] Send error:', error);

            // Fallback: Log to console in development
            if (process.env.NODE_ENV === 'development') {
                console.log('📧 [DEV MODE] Email would be sent:');
                console.log(`To: ${template.to}`);
                console.log(`Subject: ${template.subject}`);
                console.log(`Text: ${template.text}`);
                return true;
            }

            return false;
        }
    }

    // ========== EMAIL TEMPLATES ==========

    private static getWelcomeEmailHTML(userName: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; }
        .content { background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎨 Welcome to eBay Art Pulse Pro!</h1>
        </div>
        <div class="content">
            <p>Hi ${userName},</p>
            <p>Welcome to the future of art selling! We're thrilled to have you join eBay Art Pulse Pro.</p>
            <p><strong>Here's what you can do right now:</strong></p>
            <ul>
                <li>🔍 Run your first market scan to discover trending art styles</li>
                <li>📊 View Pulse Velocity Scores to identify hot opportunities</li>
                <li>💰 Use the Profit Calculator to optimize your pricing</li>
                <li>🎯 Generate AI-powered listing titles that sell</li>
            </ul>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">Go to Dashboard</a>
            <p>Need help getting started? Check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/docs">Quick Start Guide</a>.</p>
            <p>Happy selling!</p>
            <p><strong>The eBay Art Pulse Pro Team</strong></p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} eBay Art Pulse Pro. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private static getWelcomeEmailText(userName: string): string {
        return `
Hi ${userName},

Welcome to eBay Art Pulse Pro!

We're thrilled to have you join our platform. Here's what you can do right now:

- Run your first market scan to discover trending art styles
- View Pulse Velocity Scores to identify hot opportunities
- Use the Profit Calculator to optimize your pricing
- Generate AI-powered listing titles that sell

Get started: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Happy selling!
The eBay Art Pulse Pro Team
        `;
    }

    private static getPulseAlertHTML(opportunities: Array<{ topic: string; wvs: number; evidence: string }>): string {
        const opportunityRows = opportunities.map(opp => `
            <tr>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <strong>${opp.topic}</strong>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                    <span style="background: #10b981; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
                        ${opp.wvs.toFixed(1)}
                    </span>
                </td>
                <td style="padding: 15px; border-bottom: 1px solid #e5e7eb;">
                    <a href="${opp.evidence}" style="color: #667eea;">View Evidence</a>
                </td>
            </tr>
        `).join('');

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color: white; padding: 40px 20px; text-align: center; border-radius: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .button { display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔥 Hot Pulse Alert!</h1>
            <p>We've detected ${opportunities.length} high-demand opportunities</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-top: 20px;">
            <p>These art styles are showing strong buyer demand right now:</p>
            <table>
                <thead>
                    <tr style="background: #e5e7eb;">
                        <th style="padding: 15px; text-align: left;">Topic</th>
                        <th style="padding: 15px; text-align: center;">Pulse Score</th>
                        <th style="padding: 15px; text-align: left;">Evidence</th>
                    </tr>
                </thead>
                <tbody>
                    ${opportunityRows}
                </tbody>
            </table>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/opportunities" class="button">View All Opportunities</a>
        </div>
    </div>
</body>
</html>
        `;
    }

    private static getPulseAlertText(opportunities: Array<{ topic: string; wvs: number; evidence: string }>): string {
        const oppList = opportunities.map(opp => `- ${opp.topic} (Pulse Score: ${opp.wvs.toFixed(1)})`).join('\n');
        return `
🔥 Hot Pulse Alert!

We've detected ${opportunities.length} high-demand opportunities:

${oppList}

View all opportunities: ${process.env.NEXT_PUBLIC_APP_URL}/opportunities
        `;
    }

    private static getWeeklyDigestHTML(stats: any): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .stat-card { background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 10px 0; text-align: center; }
        .stat-number { font-size: 36px; font-weight: bold; color: #667eea; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 Your Weekly eBay Art Pulse Report</h1>
        <div class="stat-card">
            <div class="stat-number">${stats.topOpportunities}</div>
            <div>Top Opportunities Discovered</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.totalListingsAnalyzed.toLocaleString()}</div>
            <div>Listings Analyzed</div>
        </div>
        <div class="stat-card">
            <div class="stat-number">${stats.avgWVS.toFixed(1)}</div>
            <div>Average Pulse Score</div>
        </div>
        <p><strong>Top Trending Styles:</strong> ${stats.topStyles.join(', ')}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">View Dashboard</a>
    </div>
</body>
</html>
        `;
    }

    private static getWeeklyDigestText(stats: any): string {
        return `
📊 Your Weekly eBay Art Pulse Report

Top Opportunities: ${stats.topOpportunities}
Listings Analyzed: ${stats.totalListingsAnalyzed.toLocaleString()}
Average Pulse Score: ${stats.avgWVS.toFixed(1)}

Top Trending Styles: ${stats.topStyles.join(', ')}

View dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard
        `;
    }

    private static getPaymentReceiptHTML(amount: number, plan: string, receiptUrl: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .receipt { background: #f9fafb; padding: 30px; border-radius: 10px; margin: 20px 0; }
        .amount { font-size: 48px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ Payment Confirmed</h1>
        <div class="receipt">
            <p><strong>Thank you for your payment!</strong></p>
            <div class="amount">$${amount.toFixed(2)}</div>
            <p><strong>Plan:</strong> ${plan}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <a href="${receiptUrl}" style="display: inline-block; background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0;">Download Receipt</a>
        </div>
        <p>Your subscription is now active. Enjoy full access to eBay Art Pulse Pro!</p>
    </div>
</body>
</html>
        `;
    }

    private static getPaymentReceiptText(amount: number, plan: string, receiptUrl: string): string {
        return `
✅ Payment Confirmed

Amount: $${amount.toFixed(2)}
Plan: ${plan}
Date: ${new Date().toLocaleDateString()}

Download receipt: ${receiptUrl}

Your subscription is now active. Enjoy full access to eBay Art Pulse Pro!
        `;
    }
}
