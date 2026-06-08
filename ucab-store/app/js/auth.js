// Helper de redirección por rol/sesión.
import { currentUser } from './state.js';

export function requireAuth(role) {
  const user = currentUser();
  if (!user) {
    location.href = 'login.html';
    return null;
  }
  if (role && user.role !== role) {
    location.href = 'index.html';
    return null;
  }
  return user;
}
