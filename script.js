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
  window.loadingSystem.show('Iniciando sesión...');
  loginBtn.disabled = true;

  try {
    // Intentar autenticación
    const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // Guardar información del usuario en SessionPersistence
    const sessionData = {
      userData: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Usuario',
        lastLogin: new Date().toISOString()
      },
      sessionToken: user.uid
    };
    
    await window.SessionPersistence.saveSession(sessionData);

    window.notificationSystem.success(`¡Bienvenido ${user.displayName || 'Usuario'}!`);

    // Redireccionar después de 1.5 segundos
    setTimeout(() => {
      window.location.href = 'menu.html';
    }, 1500);

  } catch (error) {
    window.loadingSystem.hide();
    loginBtn.disabled = false;

    // Manejar errores específicos
    const errorMessages = {
      'auth/user-not-found': 'Usuario no encontrado. Verifica tu correo electrónico.',
      'auth/wrong-password': 'Contraseña incorrecta. Intenta nuevamente.',
      'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
      'auth/invalid-email': 'Correo electrónico inválido.',
      'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
      'auth/network-request-failed': 'Error de conexión. Verifica tu internet.',
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
window.firebaseAuth.onAuthStateChanged(async (user) => {
  if (user && window.location.pathname.includes('index.html')) {
    // Si hay usuario autenticado y estamos en login, redirigir a menu
    window.location.href = 'menu.html';
  } else if (!user) {
    // Si no hay usuario autenticado, verificar si hay sesión en SessionPersistence
    try {
      const sessionData = await window.SessionPersistence.getSession();
      if (sessionData && sessionData.userData && window.location.pathname.includes('index.html')) {
        // Hay sesión guardada, redirigir a menu (sesión persistente)
        window.location.href = 'menu.html';
      }
    } catch (error) {
      console.warn('Error al verificar sesión persistente:', error);
    }
  }
});

// Permitir Enter en los inputs
document.getElementById('username').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginForm.dispatchEvent(new Event('submit'));
});

document.getElementById('password').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginForm.dispatchEvent(new Event('submit'));
});
