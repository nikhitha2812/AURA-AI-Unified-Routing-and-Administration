import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting AURA Database Seed...');

  // 1. Seed Permissions
  const permissionsData = [
    { key: 'users.read', description: 'View user accounts', category: 'USERS' },
    { key: 'users.create', description: 'Invite & create user accounts', category: 'USERS' },
    { key: 'users.update', description: 'Update user accounts & roles', category: 'USERS' },
    { key: 'users.delete', description: 'Remove user accounts', category: 'USERS' },
    { key: 'models.read', description: 'View available AI models', category: 'MODELS' },
    { key: 'models.manage', description: 'Configure & toggle AI models', category: 'MODELS' },
    { key: 'policies.read', description: 'View organization policies', category: 'POLICIES' },
    { key: 'policies.upload', description: 'Upload policy documents', category: 'POLICIES' },
    { key: 'policies.approve', description: 'Approve or reject extracted rules', category: 'POLICIES' },
    { key: 'policies.manage', description: 'Modify and delete policy rules', category: 'POLICIES' },
    { key: 'security.read', description: 'View security events & PII logs', category: 'SECURITY' },
    { key: 'security.manage', description: 'Configure DLP & PII filters', category: 'SECURITY' },
    { key: 'audit.read', description: 'Access append-only audit trail', category: 'AUDIT' },
    { key: 'analytics.read', description: 'View enterprise usage analytics', category: 'ANALYTICS' },
    { key: 'chat.use', description: 'Access AI Gateway Chat', category: 'CHAT' },
  ];

  for (const p of permissionsData) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
  }
  console.log('✅ Permissions seeded.');

  // 2. Default System Roles
  const roles = [
    { name: 'SUPER_ADMIN', description: 'Full Platform Access & System Control', isSystemRole: true },
    { name: 'ORGANIZATION_ADMIN', description: 'Organization Administrator', isSystemRole: true },
    { name: 'SECURITY_ADMIN', description: 'Security & DLP Operations Administrator', isSystemRole: true },
    { name: 'POLICY_ADMIN', description: 'Policy Document & Governance Manager', isSystemRole: true },
    { name: 'MANAGER', description: 'Department Manager with Analytics Access', isSystemRole: true },
    { name: 'EMPLOYEE', description: 'Standard AI Gateway User', isSystemRole: true },
  ];

  const roleMap: Record<string, string> = {};

  for (const r of roles) {
    let role = await prisma.role.findFirst({
      where: { organizationId: null, name: r.name },
    });
    if (!role) {
      role = await prisma.role.create({
        data: r,
      });
    }
    roleMap[r.name] = role.id;
  }
  console.log('✅ Roles seeded.');

  // 3. Assign Role Permissions
  const allPermissions = await prisma.permission.findMany();
  const permMap = new Map(allPermissions.map((p) => [p.key, p.id]));

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.SUPER_ADMIN, permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap.SUPER_ADMIN, permissionId: perm.id },
    });
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.ORGANIZATION_ADMIN, permissionId: perm.id } },
      update: {},
      create: { roleId: roleMap.ORGANIZATION_ADMIN, permissionId: perm.id },
    });
  }

  if (permMap.has('chat.use')) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: roleMap.EMPLOYEE, permissionId: permMap.get('chat.use')! } },
      update: {},
      create: { roleId: roleMap.EMPLOYEE, permissionId: permMap.get('chat.use')! },
    });
  }

  // 4. Default Organizations (AURA Enterprise & Ears Up CyberSec)
  const defaultOrg = await prisma.organization.upsert({
    where: { slug: 'aura-corp' },
    update: {},
    create: {
      name: 'AURA Cybersec Enterprise',
      slug: 'aura-corp',
      domain: 'aura.internal',
      plan: 'ENTERPRISE',
    },
  });

  const earsUpOrg = await prisma.organization.upsert({
    where: { slug: 'ears-up-cybersec' },
    update: {},
    create: {
      name: 'Ears Up CyberSec',
      slug: 'ears-up-cybersec',
      domain: 'ears-up-cybersec.com',
      plan: 'ENTERPRISE',
    },
  });
  console.log('✅ Organizations created:', defaultOrg.name, '&', earsUpOrg.name);

  // 5. Official Ears Up CyberSec Users & Demo Accounts (Document #1 & Requirement #7)
  const officialEarsUpUsers = [
    { email: 'nate.nenninger@ears-up-cybersec.com', password: 'Admin@123', name: 'Nathan Nenninger', roleName: 'ORGANIZATION_ADMIN', dept: 'Founder / CEO' },
    { email: 'syhamsai@ears-up-cybersec.com', password: 'Admin@123', name: 'Shyam Sai Siddabattula', roleName: 'SECURITY_ADMIN', dept: 'Cybersecurity Specialist' },
    { email: 'sashankdharmireddi@ears-up-cybersec.com', password: 'User@123', name: 'Sashank Dharmireddi', roleName: 'EMPLOYEE', dept: 'Junior Software Engineer' },
    { email: 'Michael.1@ears-up-cybersec.com', password: 'User@123', name: 'Michael Carter', roleName: 'SECURITY_ADMIN', dept: 'Security Engineer' },
    { email: 'emily.9@ears-up-cybersec.com', password: 'User@123', name: 'Emily Johnson', roleName: 'EMPLOYEE', dept: 'Cloud Security Engineer' },
    { email: 'daniel.065@ears-up-cybersec.com', password: 'User@123', name: 'Daniel Williams', roleName: 'POLICY_ADMIN', dept: 'GRC Analyst' },
    { email: 'ethandavis@ears-up-cybersec.com', password: 'User@123', name: 'Ethan Davis', roleName: 'MANAGER', dept: 'IT Administrator' },
    { email: 's.nikhitha2005@gmail.com', password: 'User@123', name: 'Matthew Taylor', roleName: 'EMPLOYEE', dept: 'Software Developer' },
    { email: 'wiliam@ears-up-cybersec.com', password: 'User@123', name: 'William Taylor', roleName: 'EMPLOYEE', dept: 'SOC Analyst' },
    { email: 'isabellathomas@ears-up-cybersec.com', password: 'User@123', name: 'Isabella Thomas', roleName: 'EMPLOYEE', dept: 'SOC Analyst' },
    { email: 'benjaminharris@ears-up-cybersec.com', password: 'User@123', name: 'Benjamin Harris', roleName: 'POLICY_ADMIN', dept: 'Auditor' },
  ];

  const demoAccounts = [
    { email: 'admin@aura.ai', password: 'Admin@123', name: 'System Admin', roleName: 'ORGANIZATION_ADMIN', dept: 'Executive' },
    { email: 'admin@aura.internal', password: 'Admin@123456', name: 'AURA Chief Security Admin', roleName: 'ORGANIZATION_ADMIN', dept: 'InfoSec' },
    { email: 'manager@aura.ai', password: 'Manager@123', name: 'Engineering Manager', roleName: 'MANAGER', dept: 'Engineering' },
    { email: 'security@aura.ai', password: 'Security@123', name: 'Security Officer', roleName: 'SECURITY_ADMIN', dept: 'Security' },
    { email: 'auditor@aura.ai', password: 'Auditor@123', name: 'Compliance Auditor', roleName: 'POLICY_ADMIN', dept: 'Operations' },
    { email: 'employee@aura.ai', password: 'Employee@123', name: 'Alex Vance (Developer)', roleName: 'EMPLOYEE', dept: 'Engineering' },
    { email: 'employee@aura.internal', password: 'User@123456', name: 'Alex Vance (Internal)', roleName: 'EMPLOYEE', dept: 'Engineering' },
  ];

  let adminUser: any;

  // Seed Ears Up CyberSec Official Team
  for (const account of officialEarsUpUsers) {
    const hash = await bcrypt.hash(account.password, 10);
    const u = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        passwordHash: hash,
        name: account.name,
        isEmailVerified: true,
        defaultOrgId: earsUpOrg.id,
      },
    });

    if (account.email === 'nate.nenninger@ears-up-cybersec.com') {
      adminUser = u;
    }

    const roleId = roleMap[account.roleName] || roleMap.EMPLOYEE;
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: earsUpOrg.id, userId: u.id } },
      update: {},
      create: {
        organizationId: earsUpOrg.id,
        userId: u.id,
        roleId,
        department: account.dept,
      },
    });
  }

  // Seed Demo Accounts
  for (const account of demoAccounts) {
    const hash = await bcrypt.hash(account.password, 10);
    const u = await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        email: account.email,
        passwordHash: hash,
        name: account.name,
        isEmailVerified: true,
        defaultOrgId: defaultOrg.id,
      },
    });

    if (!adminUser && (account.email === 'admin@aura.internal' || account.email === 'admin@aura.ai')) {
      adminUser = u;
    }

    const roleId = roleMap[account.roleName] || roleMap.EMPLOYEE;
    await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: defaultOrg.id, userId: u.id } },
      update: {},
      create: {
        organizationId: defaultOrg.id,
        userId: u.id,
        roleId,
        department: account.dept,
      },
    });
  }

  console.log('✅ Ears Up CyberSec official team & Demo Users seeded.');

  // 6. AI Providers (Gemini, OpenAI, Groq, Ollama, Local Shield)
  const localProvider = await prisma.provider.upsert({
    where: { name: 'Local Shield' },
    update: {},
    create: {
      name: 'Local Shield',
      type: 'LOCAL',
      isEnabled: true,
    },
  });

  const geminiProvider = await prisma.provider.upsert({
    where: { name: 'Google Gemini' },
    update: {},
    create: {
      name: 'Google Gemini',
      type: 'GEMINI',
      apiKeyEnvVar: 'GEMINI_API_KEY',
      isEnabled: true,
    },
  });

  const openaiProvider = await prisma.provider.upsert({
    where: { name: 'OpenAI' },
    update: {},
    create: {
      name: 'OpenAI',
      type: 'OPENAI_COMPATIBLE',
      baseUrl: 'https://api.openai.com/v1',
      apiKeyEnvVar: 'OPENAI_API_KEY',
      isEnabled: true,
    },
  });

  const groqProvider = await prisma.provider.upsert({
    where: { name: 'Groq Cloud LPU' },
    update: {},
    create: {
      name: 'Groq Cloud LPU',
      type: 'GROQ',
      baseUrl: 'https://api.groq.com/openai/v1',
      apiKeyEnvVar: 'GROQ_API_KEY',
      isEnabled: true,
    },
  });

  const ollamaProvider = await prisma.provider.upsert({
    where: { name: 'Ollama Local Instance' },
    update: {},
    create: {
      name: 'Ollama Local Instance',
      type: 'OLLAMA',
      baseUrl: 'http://localhost:11434',
      isEnabled: true,
    },
  });

  // Models Catalog
  // Clear any old/duplicate model records first to guarantee a clean catalog
  await prisma.aIModel.deleteMany({});

  const defaultModels = [
    {
      name: 'AURA Shield Neural v1 (Local Engine)',
      modelId: 'aura-shield-v1',
      providerId: localProvider.id,
      description: 'Zero-latency on-premise fallback engine for maximum data isolation',
      capabilities: JSON.stringify(['chat', 'code', 'analysis', 'sensitive']),
      maxTokens: 8192,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      isEnabled: true,
      isDefault: true,
      priority: 1,
      status: 'ACTIVE',
      minRole: 'EMPLOYEE',
    },
    {
      name: 'Gemini 1.5 Pro (Enterprise Approved)',
      modelId: 'gemini-1.5-pro',
      providerId: geminiProvider.id,
      description: 'High-reasoning Google Gemini model with long context window',
      capabilities: JSON.stringify(['chat', 'code', 'complex-reasoning', 'multimodal']),
      maxTokens: 1048576,
      costPer1kInput: 0.00125,
      costPer1kOutput: 0.005,
      isEnabled: true,
      isDefault: false,
      priority: 2,
      status: 'ACTIVE',
      minRole: 'EMPLOYEE',
    },
    {
      name: 'Gemini 1.5 Flash (Lightweight Fast)',
      modelId: 'gemini-1.5-flash',
      providerId: geminiProvider.id,
      description: 'Ultra-fast low-cost model for simple queries & summarization',
      capabilities: JSON.stringify(['chat', 'summarization', 'fast']),
      maxTokens: 1048576,
      costPer1kInput: 0.000075,
      costPer1kOutput: 0.0003,
      isEnabled: true,
      isDefault: false,
      priority: 3,
      status: 'ACTIVE',
      minRole: 'EMPLOYEE',
    },
    {
      name: 'OpenAI GPT-4o (Strict High Governance)',
      modelId: 'gpt-4o',
      providerId: openaiProvider.id,
      description: 'Flagship OpenAI model reserved for authorized complex operations',
      capabilities: JSON.stringify(['chat', 'code', 'complex-reasoning']),
      maxTokens: 128000,
      costPer1kInput: 0.005,
      costPer1kOutput: 0.015,
      isEnabled: true,
      isDefault: false,
      priority: 4,
      status: 'ACTIVE',
      minRole: 'MANAGER',
    },
    {
      name: 'Groq Llama 3.1 70B (Ultra-Fast LPU)',
      modelId: 'llama-3.1-70b-versatile',
      providerId: groqProvider.id,
      description: 'Ultra high-speed open-weights Llama 3.1 model running on Groq LPUs',
      capabilities: JSON.stringify(['chat', 'code', 'fast']),
      maxTokens: 131072,
      costPer1kInput: 0.00059,
      costPer1kOutput: 0.00079,
      isEnabled: true,
      isDefault: false,
      priority: 5,
      status: 'ACTIVE',
      minRole: 'EMPLOYEE',
    },
    {
      name: 'Ollama Llama 3 (On-Premise Private)',
      modelId: 'llama3:latest',
      providerId: ollamaProvider.id,
      description: 'Fully air-gapped on-premise Llama 3 running locally via Ollama',
      capabilities: JSON.stringify(['chat', 'code', 'private', 'sensitive']),
      maxTokens: 8192,
      costPer1kInput: 0.0,
      costPer1kOutput: 0.0,
      isEnabled: true,
      isDefault: false,
      priority: 6,
      status: 'ACTIVE',
      minRole: 'EMPLOYEE',
    },
  ];

  for (const m of defaultModels) {
    const modelDbId = `seed-model-${m.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}`;
    await prisma.aIModel.upsert({
      where: { id: modelDbId },
      update: { modelId: m.modelId, name: m.name, providerId: m.providerId, status: m.status },
      create: {
        id: modelDbId,
        ...m,
      },
    });
  }
  console.log('✅ AI Providers (Gemini, OpenAI, Groq, Ollama, Local Shield) & Models seeded.');

  // 7. Data Classifications
  const classifications = [
    {
      name: 'PUBLIC',
      level: 1,
      allowedModelIds: JSON.stringify(['*']),
      allowedActions: JSON.stringify(['ALLOW', 'MASK', 'BLOCK']),
    },
    {
      name: 'INTERNAL',
      level: 2,
      allowedModelIds: JSON.stringify(['*']),
      allowedActions: JSON.stringify(['ALLOW', 'MASK', 'BLOCK']),
    },
    {
      name: 'CONFIDENTIAL',
      level: 3,
      allowedModelIds: JSON.stringify(['seed-model-aura-shield-v1', 'seed-model-gemini-1-5-pro', 'seed-model-llama3-latest']),
      allowedActions: JSON.stringify(['MASK', 'BLOCK']),
    },
    {
      name: 'HIGHLY_CONFIDENTIAL',
      level: 4,
      allowedModelIds: JSON.stringify(['seed-model-aura-shield-v1', 'seed-model-llama3-latest']),
      allowedActions: JSON.stringify(['BLOCK']),
    },
  ];

  for (const c of classifications) {
    const existing = await prisma.dataClassification.findFirst({
      where: { organizationId: defaultOrg.id, name: c.name },
    });
    if (!existing) {
      await prisma.dataClassification.create({
        data: {
          organizationId: defaultOrg.id,
          ...c,
        },
      });
    }
  }
  console.log('✅ Data Classifications seeded.');

  // 8. Official Policy Document (Document #2: EUSC-POL-001)
  const euscPolicyDoc = await prisma.policyDocument.upsert({
    where: { id: 'seed-eusc-pol-001' },
    update: {},
    create: {
      id: 'seed-eusc-pol-001',
      organizationId: earsUpOrg.id,
      name: 'Ears Up CyberSec - Privacy, Security and Responsible AI Usage Policy (EUSC-POL-001)',
      documentType: 'AI_GOVERNANCE',
      version: 1,
      fileLocation: 'uploads/EUSC-POL-001.pdf',
      fileSize: 45000,
      mimeType: 'application/pdf',
      status: 'ACTIVE',
      extractedText: 'Ears Up CyberSec Policy ID: EUSC-POL-001. Approved AI Models: OpenAI, Google Gemini, Groq, Ollama. Highly Confidential Data: Passwords, API keys, authentication tokens, private keys, financial credentials, customer credentials. Action: Block.',
      uploadedById: adminUser.id,
    },
  });

  const defaultRules = [
    {
      category: 'PRIVACY',
      dataType: 'EMAIL',
      action: 'MASK',
      appliesTo: 'ALL',
      priority: 1,
      description: 'EUSC-POL-001 Sec 9: Automatically mask detected user and customer email addresses before routing to AI providers.',
      status: 'APPROVED',
    },
    {
      category: 'SECURITY',
      dataType: 'API_KEY',
      action: 'BLOCK',
      appliesTo: 'ALL',
      priority: 1,
      description: 'EUSC-POL-001 Sec 4: Strictly block prompts containing API keys, AWS secrets, passwords, or private keys (Critical Risk).',
      status: 'APPROVED',
    },
    {
      category: 'SECURITY',
      dataType: 'CARD',
      action: 'BLOCK',
      appliesTo: 'ALL',
      priority: 1,
      description: 'EUSC-POL-001 Sec 4: Block credit/debit card numbers and financial credentials (Critical Risk).',
      status: 'APPROVED',
    },
    {
      category: 'PRIVACY',
      dataType: 'PHONE',
      action: 'MASK',
      appliesTo: 'ALL',
      priority: 2,
      description: 'EUSC-POL-001 Sec 9: Mask sensitive phone numbers in AI queries with [REDACTED_PHONE].',
      status: 'APPROVED',
    },
    {
      category: 'SECURITY',
      dataType: 'CONFIDENTIAL',
      action: 'BLOCK',
      appliesTo: 'EXTERNAL_MODELS',
      priority: 2,
      description: 'EUSC-POL-001 Sec 4: Block submission of unreleased security vulnerabilities, incident-response info, and proprietary source code to external models (High Risk).',
      status: 'APPROVED',
    },
  ];

  for (const org of [defaultOrg, earsUpOrg]) {
    for (const rule of defaultRules) {
      const existing = await prisma.policyRule.findFirst({
        where: { organizationId: org.id, dataType: rule.dataType, category: rule.category },
      });
      if (!existing) {
        await prisma.policyRule.create({
          data: {
            organizationId: org.id,
            documentId: org.id === earsUpOrg.id ? euscPolicyDoc.id : null,
            createdById: adminUser.id,
            approvedById: adminUser.id,
            ...rule,
          },
        });
      }
    }
  }
  console.log('✅ Ears Up CyberSec EUSC-POL-001 Policy Document & Active Rules seeded.');

  console.log('🎉 Seed Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
