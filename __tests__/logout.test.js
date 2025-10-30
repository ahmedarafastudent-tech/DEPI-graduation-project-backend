const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

describe('Logout and session revocation', () => {
  test('login creates session; logout revokes session and token cannot be reused', async () => {
    const { user, token } = await global.createTestUser(false);
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret123');
    expect(decoded).toHaveProperty('jti');

    const freshUser = await User.findById(user._id);
    const sessions = freshUser.sessions || [];
    const session = sessions.find((s) => s.jti === decoded.jti);
    expect(session).toBeDefined();
    expect(session.revoked).not.toBeTruthy();

    const logoutRes = await request
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body).toHaveProperty('message');

    const profileRes = await request
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(profileRes.status).toBe(401);

    const sessionsRes = await request
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send();

    const loginAgainRes = await request.post('/api/auth/login').send({
      email: freshUser.email,
      password: '123456',
    });
    expect(loginAgainRes.status).toBe(200);
    const newToken = loginAgainRes.body.token;
    const sessionsRes2 = await request
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${newToken}`)
      .send();

    expect(sessionsRes2.status).toBe(200);
    const returned = sessionsRes2.body.sessions || [];
    const old = returned.find((s) => s.jti === decoded.jti);
    expect(old).toBeDefined();
    expect(old.revoked).toBeTruthy();
  });
});
