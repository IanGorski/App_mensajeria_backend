import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRouter from '../routes/auth.router.js';
import UserRepository from '../repositories/user.repository.js';
import mailTransporter from '../config/mailTransporter.config.js';

// Mock de dependencies
vi.mock('../repositories/user.repository.js');
vi.mock('../config/mailTransporter.config.js', () => ({
  default: {
    sendMail: vi.fn().mockResolvedValue(true)
  }
}));
vi.mock('../config/configMongoDB.config.js', () => ({
  default: vi.fn()
}));

describe('Auth Flow - Forgot/Reset Password', () => {
  let app;

  beforeEach(() => {
    vi.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
  });

  describe('POST /api/auth/forgot-password', () => {
    it('debe enviar email de recuperación con token válido', async () => {
      const testEmail = 'test@example.com';
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: testEmail,
        name: 'Test User',
        verified_email: true
      };

      UserRepository.getByEmail = vi.fn().mockResolvedValue(mockUser);
      UserRepository.setResetTokenByEmail = vi.fn().mockResolvedValue(true);
      mailTransporter.sendMail.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testEmail })
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body.message).toContain('email');
      expect(UserRepository.setResetTokenByEmail).toHaveBeenCalled();
      expect(mailTransporter.sendMail).toHaveBeenCalled();
    });

    it('debe responder 200 aunque el email no exista (seguridad)', async () => {
      UserRepository.getByEmail = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'noexiste@example.com' })
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(UserRepository.setResetTokenByEmail).not.toHaveBeenCalled();
    });

    it('debe validar que se envíe email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('email');
    });
  });

  describe('GET /api/auth/reset-password/validate/:token', () => {
    it('debe validar token activo correctamente', async () => {
      const validToken = 'valid-reset-token-12345';
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        reset_password_token: validToken,
        reset_password_expires: new Date(Date.now() + 3600000) // 1 hora en el futuro
      };

      UserRepository.getByResetToken = vi.fn().mockResolvedValue(mockUser);

      const response = await request(app)
        .get(`/api/auth/reset-password/validate/${validToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body.message).toContain('válido');
    });

    it('debe rechazar token expirado', async () => {
      const expiredToken = 'expired-token-12345';
      
      UserRepository.getByResetToken = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/auth/reset-password/validate/${expiredToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('inválido');
    });

    it('debe rechazar token inexistente', async () => {
      UserRepository.getByResetToken = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .get('/api/auth/reset-password/validate/invalid-token')
        .expect(400);

      expect(response.body).toHaveProperty('ok', false);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('debe actualizar contraseña con token válido', async () => {
      const validToken = 'valid-reset-token-12345';
      const newPassword = 'NewSecurePassword123!';
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        reset_password_token: validToken,
        reset_password_expires: new Date(Date.now() + 3600000)
      };

      UserRepository.getByResetToken = vi.fn().mockResolvedValue(mockUser);
      UserRepository.updateById = vi.fn().mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: newPassword })
        .expect(200);

      expect(response.body).toHaveProperty('ok', true);
      expect(response.body.message).toContain('actualizada');
      expect(UserRepository.updateById).toHaveBeenCalled();
    });

    it('debe rechazar token inválido', async () => {
      const invalidToken = 'invalid-token-12345';

      UserRepository.getByResetToken = vi.fn().mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: invalidToken, password: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('inválido');
      expect(UserRepository.updateById).not.toHaveBeenCalled();
    });

    it('debe validar que se envíe password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'any-token' })
        .expect(400);

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('password');
    });

    it('debe validar que se envíe token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'NewPassword123!' })
        .expect(400);

      expect(response.body).toHaveProperty('ok', false);
      expect(response.body.message).toContain('token');
    });
  });
});
