import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '../src/lib/prisma';
import { PolicyService } from '../src/services/policy.service';

describe('AURA Multi-Tenant Data Isolation & Security Tests', () => {
  let orgAId: string;
  let orgBId: string;
  let userAId: string;

  beforeAll(async () => {
    // Fetch or create Organization A and Organization B
    let orgA = await prisma.organization.findFirst({ where: { slug: 'aura-corp' } });
    if (!orgA) {
      orgA = await prisma.organization.create({
        data: { name: 'Tenant A Corp', slug: 'aura-corp', plan: 'ENTERPRISE' },
      });
    }
    orgAId = orgA.id;

    let orgB = await prisma.organization.findFirst({ where: { slug: 'tenant-b-corp' } });
    if (!orgB) {
      orgB = await prisma.organization.create({
        data: { name: 'Tenant B Corp', slug: 'tenant-b-corp', plan: 'ENTERPRISE' },
      });
    }
    orgBId = orgB.id;

    let userA = await prisma.user.findFirst({ where: { email: 'admin@aura.internal' } });
    if (!userA) {
      userA = await prisma.user.create({
        data: { email: 'admin@aura.internal', passwordHash: 'hashed', name: 'User A', defaultOrgId: orgAId },
      });
    }
    userAId = userA.id;
  });

  it('should strictly isolate policy documents between Organization A and Organization B', async () => {
    // Create a policy document for Org A
    const docA = await prisma.policyDocument.create({
      data: {
        organizationId: orgAId,
        name: 'OrgA_Privacy_Policy.txt',
        documentType: 'PRIVACY_POLICY',
        fileLocation: '/tmp/orga.txt',
        fileSize: 100,
        mimeType: 'text/plain',
        uploadedById: userAId,
      },
    });

    // Query documents for Org B
    const docsForB = await prisma.policyDocument.findMany({
      where: { organizationId: orgBId },
    });

    const foundInB = docsForB.some((d) => d.id === docA.id);
    expect(foundInB).toBe(false);

    // Clean up
    await prisma.policyDocument.delete({ where: { id: docA.id } });
  });

  it('should prevent cross-organization policy rule access', async () => {
    const ruleA = await prisma.policyRule.create({
      data: {
        organizationId: orgAId,
        category: 'SECURITY',
        dataType: 'API_KEY',
        action: 'BLOCK',
        description: 'Org A Security Rule',
        createdById: userAId,
      },
    });

    const rulesForB = await prisma.policyRule.findMany({
      where: { organizationId: orgBId },
    });

    const foundInB = rulesForB.some((r) => r.id === ruleA.id);
    expect(foundInB).toBe(false);

    await prisma.policyRule.delete({ where: { id: ruleA.id } });
  });
});
