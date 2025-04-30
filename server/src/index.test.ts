import request from 'supertest';
import app from './index';

describe('API Endpoints', () => {
  it('GET / should return Hello World!', async () => {
    const res = await request(app).get('/');
    
    expect(res.statusCode).toEqual(200);
    expect(res.text).toEqual('Hello World!');
  });

  it('GET /api/hello should return correct message', async () => {
    const res = await request(app).get('/api/hello');
    
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toEqual('Hello from Q');
  });
});