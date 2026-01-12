/**
 * Session Manager
 * Gestiona sesiones de usuario con soporte offline
 * Permite login offline y mantener sesión persistente
 */

class SessionManager {
  constructor() {
    this.SESSION_KEY = 'geopoint_session';
    this.CREDENTIALS_KEY = 'geopoint_credentials';
    this.USER_DATA_KEY = 'geopoint_user';
  }

  /**
   * Guardar sesión de usuario después de login
   * @param {Object} userData - Datos del usuario
   */
  saveSession(userData) {
    try {
      const session = {
        uid: userData.uid,
        email: userData.email,
        displayName: userData.displayName || 'Usuario',
        loginTime: new Date().toISOString(),
        isAuthenticated: true
      };

      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
      
      console.log('✅ Sesión guardada:', session);
      return true;
    } catch (error) {
      console.error('Error al guardar sesión:', error);
      return false;
    }
  }

  /**
   * Guardar credenciales encriptadas para login offline
   * ⚠️ SOLO se recomienda con HTTPS en producción
   * @param {string} email - Email del usuario
   * @param {string} password - Contraseña (será hashada básicamente)
   */
  saveCredentials(email, password) {
    try {
      // Simple obfuscación (NO es encriptación real, solo para offline demo)
      // En producción, usar Firebase Password Hash o similar
      const obfuscated = btoa(`${email}:${password}`); // Base64
      
      const credentials = {
        email: email,
        hash: obfuscated,
        savedAt: new Date().toISOString()
      };

      localStorage.setItem(this.CREDENTIALS_KEY, JSON.stringify(credentials));
      console.log('✅ Credenciales guardadas para offline');
      return true;
    } catch (error) {
      console.error('Error al guardar credenciales:', error);
      return false;
    }
  }

  /**
   * Obtener sesión actual
   * @returns {Object|null} - Datos de sesión o null
   */
  getSession() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error al obtener sesión:', error);
      return null;
    }
  }

  /**
   * Obtener datos del usuario
   * @returns {Object|null} - Datos del usuario o null
   */
  getUserData() {
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al obtener datos de usuario:', error);
      return null;
    }
  }

  /**
   * Verificar si hay sesión activa
   * @returns {boolean}
   */
  isSessionActive() {
    const session = this.getSession();
    return session && session.isAuthenticated === true;
  }

  /**
   * Verificar credenciales offline (para login sin internet)
   * @param {string} email
   * @param {string} password
   * @returns {boolean}
   */
  verifyOfflineCredentials(email, password) {
    try {
      const credentials = localStorage.getItem(this.CREDENTIALS_KEY);
      if (!credentials) return false;

      const stored = JSON.parse(credentials);
      const inputHash = btoa(`${email}:${password}`);
      
      return stored.hash === inputHash;
    } catch (error) {
      console.error('Error al verificar credenciales offline:', error);
      return false;
    }
  }

  /**
   * Limpiar sesión (logout)
   */
  clearSession() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.USER_DATA_KEY);
      localStorage.removeItem(this.CREDENTIALS_KEY);
      console.log('✅ Sesión cerrada');
      return true;
    } catch (error) {
      console.error('Error al limpiar sesión:', error);
      return false;
    }
  }

  /**
   * Obtener tiempo de sesión (cuánto tiempo lleva autenticado)
   * @returns {string} - Tiempo formateado
   */
  getSessionDuration() {
    const session = this.getSession();
    if (!session) return 'No hay sesión';

    const loginTime = new Date(session.loginTime);
    const now = new Date();
    const diff = now - loginTime;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    return `${hours}h ${minutes}m`;
  }

  /**
   * Restablecer sesión de localStorage después de cerrar navegador
   * (Se llama al cargar una página)
   */
  restoreSession() {
    const session = this.getSession();
    
    if (session && session.isAuthenticated) {
      console.log('✅ Sesión restaurada:', session.email);
      return true;
    }
    
    return false;
  }

  /**
   * Debug: Ver estado de sesión
   */
  debugSession() {
    console.log('=== DEBUG SESSION ===');
    console.log('Sesión activa:', this.isSessionActive());
    console.log('Datos de sesión:', this.getSession());
    console.log('Duración:', this.getSessionDuration());
    console.log('Credenciales offline guardadas:', !!localStorage.getItem(this.CREDENTIALS_KEY));
    console.log('====================');
  }
}

// Crear instancia global
window.SessionManager = new SessionManager();

// Restaurar sesión cuando la página se carga
document.addEventListener('DOMContentLoaded', () => {
  window.SessionManager.restoreSession();
});
