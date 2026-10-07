import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../src/index';

describe('AURA Health Endpoint', () => {
  it('GET /health should return 200 OK with database connection status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('connected');
    expect(res.body.service).toContain('AURA');
  });
});
