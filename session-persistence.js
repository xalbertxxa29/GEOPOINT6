/**
 * Session Persistence - Sistema de persistencia de sesión usando IndexedDB
 * Más confiable que localStorage para datos críticos
 */

class SessionPersistence {
  static DB_NAME = 'LiderControlDB';
  static DB_VERSION = 1;
  static STORE_NAME = 'sessionData';
  
  static db = null;

  /**
   * Inicializar IndexedDB
   */
  static async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB inicializado correctamente');
        resolve(this.db);
      };
    });
  }

  /**
   * Guardar datos de sesión
   */
  static async saveSession(sessionData) {
    try {
      if (!this.db) await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.put(sessionData, 'currentSession');

        request.onerror = () => {
          console.error('Error al guardar sesión:', request.error);
          // Fallback a localStorage
          Helpers.setStorage('userData', sessionData.userData);
          Helpers.setStorage('sessionToken', sessionData.sessionToken);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Sesión guardada en IndexedDB');
          // También guardar en localStorage como backup
          Helpers.setStorage('userData', sessionData.userData);
          Helpers.setStorage('sessionToken', sessionData.sessionToken);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error en saveSession:', error);
      // Fallback a localStorage
      Helpers.setStorage('userData', sessionData.userData);
      Helpers.setStorage('sessionToken', sessionData.sessionToken);
    }
  }

  /**
   * Obtener datos de sesión
   */
  static async getSession() {
    try {
      if (!this.db) await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.get('currentSession');

        request.onerror = () => {
          console.error('Error al obtener sesión de IndexedDB');
          // Fallback a localStorage
          const userData = Helpers.getStorage('userData');
          const sessionToken = Helpers.getStorage('sessionToken');
          if (userData) {
            resolve({ userData, sessionToken });
          } else {
            resolve(null);
          }
        };

        request.onsuccess = () => {
          if (request.result) {
            console.log('Sesión recuperada de IndexedDB');
            resolve(request.result);
          } else {
            // Intentar obtener del localStorage
            const userData = Helpers.getStorage('userData');
            const sessionToken = Helpers.getStorage('sessionToken');
            if (userData) {
              resolve({ userData, sessionToken });
            } else {
              resolve(null);
            }
          }
        };
      });
    } catch (error) {
      console.error('Error en getSession:', error);
      // Fallback a localStorage
      const userData = Helpers.getStorage('userData');
      const sessionToken = Helpers.getStorage('sessionToken');
      return userData ? { userData, sessionToken } : null;
    }
  }

  /**
   * Guardar tareas en caché
   */
  static async saveTasks(userEmail, tipo, tareas) {
    try {
      if (!this.db) await this.init();

      const key = `tasks_${userEmail}_${tipo}`;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.put({
          tareas: tareas,
          timestamp: new Date().toISOString()
        }, key);

        request.onerror = () => {
          console.error('Error al guardar tareas:', request.error);
          // Fallback a localStorage
          Helpers.setStorage(key, tareas);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log(`Tareas ${tipo} guardadas en IndexedDB`);
          // También guardar en localStorage como backup
          Helpers.setStorage(key, tareas);
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error en saveTasks:', error);
      const key = `tasks_${userEmail}_${tipo}`;
      Helpers.setStorage(key, tareas);
    }
  }

  /**
   * Obtener tareas del caché
   */
  static async getTasks(userEmail, tipo) {
    try {
      if (!this.db) await this.init();

      const key = `tasks_${userEmail}_${tipo}`;
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.get(key);

        request.onerror = () => {
          console.error('Error al obtener tareas de IndexedDB');
          // Fallback a localStorage
          const tareas = Helpers.getStorage(key, []);
          resolve(tareas);
        };

        request.onsuccess = () => {
          if (request.result && request.result.tareas) {
            console.log(`Tareas ${tipo} recuperadas de IndexedDB`);
            resolve(request.result.tareas);
          } else {
            // Intentar obtener del localStorage
            const tareas = Helpers.getStorage(key, []);
            resolve(tareas);
          }
        };
      });
    } catch (error) {
      console.error('Error en getTasks:', error);
      const key = `tasks_${userEmail}_${tipo}`;
      const tareas = Helpers.getStorage(key, []);
      return tareas;
    }
  }

  /**
   * Limpiar sesión
   */
  static async clearSession() {
    try {
      if (!this.db) await this.init();

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
        const store = transaction.objectStore(this.STORE_NAME);
        
        const request = store.clear();

        request.onerror = () => {
          console.error('Error al limpiar sesión:', request.error);
          reject(request.error);
        };

        request.onsuccess = () => {
          console.log('Sesión limpiada de IndexedDB');
          // También limpiar localStorage
          Helpers.removeStorage('userData');
          Helpers.removeStorage('sessionToken');
          Helpers.removeStorage('tareasIniciadas');
          Helpers.removeStorage('tareasCompletadas');
          resolve(request.result);
        };
      });
    } catch (error) {
      console.error('Error en clearSession:', error);
      Helpers.removeStorage('userData');
      Helpers.removeStorage('sessionToken');
      Helpers.removeStorage('tareasIniciadas');
      Helpers.removeStorage('tareasCompletadas');
    }
  }
}

// Inicializar automáticamente cuando se carga el script
if (document && document.readyState) {
  SessionPersistence.init().catch((error) => {
    console.warn('No se pudo inicializar IndexedDB, usando localStorage:', error);
  });
}

// Hacer disponible globalmente
window.SessionPersistence = SessionPersistence;
