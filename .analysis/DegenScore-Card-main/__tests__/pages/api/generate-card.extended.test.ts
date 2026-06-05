import React from 'react';
import { NextApiRequest, NextApiResponse } from 'next';
import handler from '@/pages/api/generate-card';

jest.mock('@/lib/logger');
jest.mock('@/lib/cardGenerator');

describe('/api/generate-card - Extended Tests', () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    req = { method: 'POST', body: {}, headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn(),
    };
  });

  it('should validate content-type', async () => {
    req.headers = { 'content-type': 'text/plain' };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should handle CORS preflight', async () => {
    req.method = 'OPTIONS';
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.setHeader).toHaveBeenCalledWith('Access-Control-Allow-Methods', expect.any(String));
  });

  it('should set cache headers', async () => {
    req.body = { walletAddress: 'test', cache: true };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', expect.any(String));
  });

  it('should handle image format parameter', async () => {
    req.body = { walletAddress: 'test', format: 'jpeg' };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'image/jpeg');
  });

  it('should support different sizes', async () => {
    req.body = { walletAddress: 'test', size: 'large' };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.send).toHaveBeenCalled();
  });

  it('should validate wallet ownership', async () => {
    req.body = { walletAddress: 'test', requireOwnership: true };
    req.headers = { authorization: 'Bearer invalid' };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should handle premium features', async () => {
    req.body = { walletAddress: 'test', premium: true, effects: ['glow', 'particles'] };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(res.send).toHaveBeenCalled();
  });

  it('should track analytics', async () => {
    req.body = { walletAddress: 'test' };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(trackEvent).toHaveBeenCalledWith('card_generated', expect.any(Object));
  });

  it('should handle retry logic', async () => {
    let attempts = 0;
    (generateCardImage as jest.Mock).mockImplementation(() => {
      attempts++;
      if (attempts < 2) throw new Error('Temporary failure');
      return Buffer.from('image');
    });

    req.body = { walletAddress: 'test' };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(attempts).toBeGreaterThan(1);
  });

  it('should watermark free cards', async () => {
    req.body = { walletAddress: 'test', premium: false };
    await handler(req as NextApiRequest, res as NextApiResponse);
    expect(addWatermark).toHaveBeenCalled();
  });
});
