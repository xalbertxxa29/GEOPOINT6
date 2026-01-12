/**
 * Firebase Configuration
 * Archivo centralizado para las credenciales de Firebase
 */

const firebaseConfig = {
  apiKey: "AIzaSyA5-v9DhFUgl8tuBFDw50y8x0t0jyS4Qak",
  authDomain: "geopint-dea12.firebaseapp.com",
  projectId: "geopint-dea12",
  storageBucket: "geopint-dea12.firebasestorage.app",
  messagingSenderId: "275082094487",
  appId: "1:275082094487:web:6db788f8d8893e58d586d2"
};

// Inicializar Firebase una sola vez
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Crear instancias y exportar directamente a window
// (NO crear const variables locales para evitar conflictos)
window.firebaseDB = firebase.firestore();
window.firebaseAuth = firebase.auth();
window.firebaseStorage = firebase.storage();
window.firebaseConfig = firebaseConfig;
