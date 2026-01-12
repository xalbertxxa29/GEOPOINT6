/**
 * Script Principal - Login
 */

// Las instancias de Firebase ya están en window desde firebase-config.js
// window.firebaseAuth, window.firebaseDB, window.firebaseStorage

// Elementos del DOM
const loginForm = document.getElementById('login-form');
const loginBtn = document.getElementById('login-btn');
const connectionStatus = document.getElementById('connection-status');
const passwordInput = document.getElementById('password');
const togglePasswordBtn = document.getElementById('toggle-password');

// Toggle de visibilidad de contraseña
if (togglePasswordBtn) {
  togglePasswordBtn.addEventListener('click', (e) => {
    e.preventDefault();
    
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    
    // Cambiar el emoji del ojo
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
  });
}

// Monitorear estado de conexión
function updateConnectionStatus() {
  const isOnline = navigator.onLine;
  const indicator = connectionStatus.querySelector('.status-indicator');
  const statusText = connectionStatus.querySelector('.status-text');

  if (isOnline) {
    indicator.classList.remove('offline');
    statusText.textContent = 'Conectado';
    indicator.style.background = '#00ff88';
    indicator.style.boxShadow = '0 0 10px #00ff88';
  } else {
    indicator.classList.add('offline');
    statusText.textContent = 'Sin conexión';
    indicator.style.background = '#ff0055';
    indicator.style.boxShadow = '0 0 10px #ff0055';
  }
}

window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);
updateConnectionStatus();

// Manejar envío del formulario
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const isOnline = navigator.onLine;

  // Validación básica
  if (!email || !password) {
    window.notificationSystem.warning('Por favor completa todos los campos');
    return;
  }

  if (!Helpers.validateEmail(email)) {
    window.notificationSystem.error('Correo electrónico inválido');
    return;
  }

  if (password.length < 6) {
    window.notificationSystem.error('La contraseña debe tener al menos 6 caracteres');
    return;
  }

  // Mostrar loader
  window.loadingSystem.show(isOnline ? 'Iniciando sesión...' : 'Iniciando sesión (Offline)...');
  loginBtn.disabled = true;

  try {
    if (isOnline) {
      // LOGIN ONLINE - Autenticar con Firebase
      const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Guardar sesión y credenciales
      window.SessionManager.saveSession({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuario'
      });
      
      // Guardar credenciales para offline
      window.SessionManager.saveCredentials(email, password);

      window.notificationSystem.success(`¡Bienvenido ${user.displayName || 'Usuario'}!`);

      // Redireccionar después de 1.5 segundos
      setTimeout(() => {
        window.location.href = 'menu.html';
      }, 1500);

    } else {
      // LOGIN OFFLINE - Verificar credenciales guardadas
      if (window.SessionManager.verifyOfflineCredentials(email, password)) {
        // Credenciales correctas (se verifican contra lo guardado localmente)
        const userData = window.SessionManager.getUserData();
        
        if (userData && userData.email === email) {
          window.notificationSystem.success(`¡Bienvenido ${userData.displayName || 'Usuario'}! (Modo Offline)`);

          // Redireccionar después de 1.5 segundos
          setTimeout(() => {
            window.location.href = 'menu.html';
          }, 1500);
        } else {
          // No hay datos guardados para este usuario
          window.loadingSystem.hide();
          loginBtn.disabled = false;
          window.notificationSystem.error('Este usuario no fue autenticado anteriormente. Requiere conexión a internet.');
        }
      } else {
        // Credenciales incorrectas en modo offline
        window.loadingSystem.hide();
        loginBtn.disabled = false;
        window.notificationSystem.error('Credenciales inválidas o usuario no autenticado en este dispositivo.');
      }
    }

  } catch (error) {
    window.loadingSystem.hide();
    loginBtn.disabled = false;

    // Manejar errores específicos de Firebase
    const errorMessages = {
      'auth/user-not-found': 'Usuario no encontrado. Verifica tu correo electrónico.',
      'auth/wrong-password': 'Contraseña incorrecta. Intenta nuevamente.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
      'auth/invalid-email': 'Correo electrónico inválido.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/network-request-failed': 'Error de conexión. Si los datos fueron guardados anteriormente, inténtalo sin internet.',
      'auth/invalid-credential': 'Credenciales inválidas. Intenta nuevamente.'
    };

    const message = errorMessages[error.code] || `Error: ${error.message}`;
    window.notificationSystem.error(message);
    console.error('Error de autenticación:', error);
  }
});

// Enlace de contraseña olvidada
document.getElementById('forgot-password').addEventListener('click', (e) => {
  e.preventDefault();
  window.notificationSystem.info('Función de recuperación en desarrollo');
});

// Registrar Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado:', registration);

        // Notificar si hay una nueva versión
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              window.notificationSystem.info('Nueva versión disponible. Recarga para actualizar.', 'info', 0);
            }
          };
        };
      })
      .catch(error => {
        console.error('Error al registrar Service Worker:', error);
      });
  });
}

// Verificar si ya hay usuario autenticado o sesión persistente
window.firebaseAuth.onAuthStateChanged((user) => {
  if (user && window.location.pathname.includes('index.html')) {
    // Si hay usuario autenticado en Firebase y estamos en login, redirigir a menu
    console.log('✅ Usuario autenticado en Firebase, redirigiendo a menu');
    window.location.href = 'menu.html';
  } else if (!user && window.SessionManager.isSessionActive() && window.location.pathname.includes('index.html')) {
    // Si no hay usuario en Firebase pero hay sesión local activa (modo offline)
    console.log('✅ Sesión local activa (offline), redirigiendo a menu');
    window.location.href = 'menu.html';
  }
});

// Permitir Enter en los inputs
document.getElementById('username').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginForm.dispatchEvent(new Event('submit'));
});

document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginForm.dispatchEvent(new Event('submit'));
});
