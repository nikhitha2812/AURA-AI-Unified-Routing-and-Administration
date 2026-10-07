import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { prisma } from '../lib/prisma';
import fs from 'fs';

export class PolicyService {
  /**
   * Validate uploaded file type and size
   */
  static validateUploadedFile(file: Express.Multer.File) {
    const allowedMimeTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const allowedExtensions = ['.pdf', '.docx', '.txt'];

    const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      throw new Error('Invalid document format. Only PDF, DOCX, and TXT files are accepted.');
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File size exceeds maximum allowed limit of 10MB.');
    }
  }

  /**
   * Extract plain text content from PDF, DOCX, or TXT buffer
   */
  static async extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);

    if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
      const data = await pdfParse(buffer);
      return data.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      filePath.endsWith('.docx')
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } else {
      return buffer.toString('utf-8');
    }
  }

  /**
   * Process uploaded document, save to DB, extract policy rules for human review
   */
  static async processPolicyDocument(
    organizationId: string,
    userId: string,
    file: Express.Multer.File,
    documentType: string
  ) {
    this.validateUploadedFile(file);

    // Extract text from document
    const textContent = await this.extractTextFromFile(file.path, file.mimetype);

    // Calculate document version
    const existingDocCount = await prisma.policyDocument.count({
      where: { organizationId, name: file.originalname },
    });

    const docVersion = existingDocCount + 1;

    // Create PolicyDocument record
    const policyDoc = await prisma.policyDocument.create({
      data: {
        organizationId,
        name: file.originalname,
        documentType,
        version: docVersion,
        fileLocation: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        status: 'ACTIVE',
        extractedText: textContent,
        uploadedById: userId,
      },
    });

    // Run automated policy rule extraction from document text
    const extractedRules = this.extractRulesFromText(textContent);

    // Create PROPOSED rules in database for Admin review
    const createdRules = [];
    for (const rule of extractedRules) {
      const dbRule = await prisma.policyRule.create({
        data: {
          organizationId,
          documentId: policyDoc.id,
          category: rule.category,
          dataType: rule.dataType,
          action: rule.action,
          appliesTo: rule.appliesTo,
          priority: rule.priority,
          description: rule.description,
          status: 'PROPOSED', // Requires Admin Review!
          createdById: userId,
        },
      });
      createdRules.push(dbRule);
    }

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'POLICY_UPLOAD',
        entityType: 'POLICY',
        entityId: policyDoc.id,
        details: JSON.stringify({
          documentName: file.originalname,
          version: docVersion,
          extractedRulesCount: createdRules.length,
        }),
      },
    });

    return {
      document: policyDoc,
      proposedRules: createdRules,
    };
  }

  /**
   * Rule Extraction Engine - Converts plain text policies into proposed machine-enforceable rules
   */
  private static extractRulesFromText(text: string): Array<{
    category: string;
    dataType: string;
    action: string;
    appliesTo: string;
    priority: number;
    description: string;
  }> {
    const rules: Array<{
      category: string;
      dataType: string;
      action: string;
      appliesTo: string;
      priority: number;
      description: string;
    }> = [];

    const lower = text.toLowerCase();

    // Pattern 1: API Keys / Credentials
    if (lower.includes('api key') || lower.includes('secret key') || lower.includes('token')) {
      rules.push({
        category: 'SECURITY',
        dataType: 'API_KEY',
        action: lower.includes('mask') || lower.includes('redact') ? 'MASK' : 'BLOCK',
        appliesTo: 'ALL',
        priority: 1,
        description: 'Extracted Rule: Protect API Keys & authentication credentials from external AI submission.',
      });
    }

    // Pattern 2: PII / Customer Data / Email
    if (lower.includes('pii') || lower.includes('email') || lower.includes('personally identifiable')) {
      rules.push({
        category: 'PRIVACY',
        dataType: 'EMAIL',
        action: lower.includes('block') || lower.includes('prohibit') ? 'BLOCK' : 'MASK',
        appliesTo: 'ALL',
        priority: 2,
        description: 'Extracted Rule: Redact customer and employee email addresses prior to model dispatch.',
      });
    }

    // Pattern 3: Financial / Credit Cards
    if (lower.includes('credit card') || lower.includes('payment') || lower.includes('financial')) {
      rules.push({
        category: 'SECURITY',
        dataType: 'CARD',
        action: 'BLOCK',
        appliesTo: 'ALL',
        priority: 1,
        description: 'Extracted Rule: Block submission of payment card numbers and financial identifiers.',
      });
    }

    // Pattern 4: Phone Numbers
    if (lower.includes('phone') || lower.includes('contact number')) {
      rules.push({
        category: 'PRIVACY',
        dataType: 'PHONE',
        action: 'MASK',
        appliesTo: 'ALL',
        priority: 3,
        description: 'Extracted Rule: Mask contact phone numbers with [REDACTED_PHONE].',
      });
    }

    // Pattern 5: Confidential / Proprietary Code
    if (lower.includes('confidential') || lower.includes('proprietary') || lower.includes('trade secret')) {
      rules.push({
        category: 'SECURITY',
        dataType: 'CONFIDENTIAL',
        action: lower.includes('block') ? 'BLOCK' : 'MASK',
        appliesTo: 'EXTERNAL_MODELS',
        priority: 2,
        description: 'Extracted Rule: Restrict or redact proprietary company source code and confidential documents.',
      });
    }

    // Fallback default rule if text is generic
    if (rules.length === 0) {
      rules.push({
        category: 'GOVERNANCE',
        dataType: 'CONFIDENTIAL',
        action: 'MASK',
        appliesTo: 'ALL',
        priority: 5,
        description: 'Extracted Rule: Standard company data governance protection rule.',
      });
    }

    return rules;
  }

  /**
   * Admin approves or rejects a proposed policy rule
   */
  static async reviewPolicyRule(
    organizationId: string,
    ruleId: string,
    approvedById: string,
    action: 'APPROVED' | 'REJECTED' | 'DISABLED',
    modifiedDetails?: { action?: string; priority?: number; description?: string }
  ) {
    const rule = await prisma.policyRule.findFirst({
      where: { id: ruleId, organizationId },
    });

    if (!rule) {
      throw new Error('Policy rule not found.');
    }

    const updated = await prisma.policyRule.update({
      where: { id: ruleId },
      data: {
        status: action,
        approvedById: action === 'APPROVED' ? approvedById : rule.approvedById,
        action: modifiedDetails?.action || rule.action,
        priority: modifiedDetails?.priority !== undefined ? modifiedDetails.priority : rule.priority,
        description: modifiedDetails?.description || rule.description,
      },
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: approvedById,
        action: `POLICY_RULE_${action}`,
        entityType: 'POLICY',
        entityId: rule.id,
        details: JSON.stringify({ previousStatus: rule.status, newStatus: action }),
      },
    });

    return updated;
  }
}
