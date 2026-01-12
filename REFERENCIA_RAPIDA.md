# 🚀 GUÍA RÁPIDA DE REFERENCIA - GEOPOINT6

## Estructura de Carga de Scripts (ORDEN CRÍTICO)

```html
<!-- 1. Firebase SDKs -->
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.9.0/firebase-storage-compat.js"></script>

<!-- 2. Sistemas Globales (DESPUÉS de Firebase SDK) -->
<script src="firebase-config.js"></script>
<script src="notification-system.js"></script>
<script src="loader-system.js"></script>
<script src="helpers.js"></script>

<!-- 3. APIs Externas -->
<script async defer src="https://maps.googleapis.com/maps/api/js?key=API_KEY"></script>

<!-- 4. Lógica de la Aplicación (ÚLTIMO) -->
<script src="menu-new.js"></script>
```

---

## 📦 Archivos Disponibles Globalmente

Después de cargar los sistemas, estos están disponibles en `window`:

```javascript
// Firebase Instances
window.firebaseAuth         // Firebase Auth
window.firebaseDB          // Firestore
window.firebaseStorage     // Firebase Storage

// Sistema de Notificaciones
window.notificationSystem
  .show(msg, icon, duration)
  .success(msg, duration)
  .error(msg, duration)
  .warning(msg, duration)
  .info(msg, duration)
  .confirm(msg, callback)

// Sistema de Loading
window.loadingSystem
  .show(msg)
  .hide()
  .setMessage(msg)

// Utilidades
window.Helpers
  .calculateDistance()
  .validateEmail()
  .formatDate()
  .formatTime()
  .setStorage()
  .getStorage()
  .isOnline()
  .onConnectionChange()
  // ... y más
```

---

## ✅ Checklist de Funcionalidad

### Login Page (index.html)
- [x] Autenticación con Firebase
- [x] Validación de email y password
- [x] Indicador de conexión
- [x] Animación de carga
- [x] Notificación de errores
- [x] Redirección a menu.html

### Menú Principal (menu.html)
- [x] Mostrar tareas del usuario
- [x] Tabs: Iniciadas / Completadas
- [x] Botón FAB para nueva tarea
- [x] Modal de selección
- [x] Información del usuario
- [x] Logout con confirmación
- [x] Indicador de conexión

### Formulario (formulario.html + formulario-new.js)
- [x] Dropdown de clientes
- [x] Dropdown de unidades (dinámico)
- [x] Autocompletado de datos
- [x] Mapa Google Maps
- [x] Ubicación GPS en tiempo real
- [x] Validación de distancia (50m)
- [x] Visualización de marcadores
- [x] Guardado en Firestore
- [x] Notificaciones modales

---

## 🎨 Cambios de Diseño

### Cambiar Color Principal

Edita `neon-styles.css`:
```css
:root {
  --primary-neon: #00d4ff;  /* Aquí */
}
```

### Cambiar Distancia Máxima

Edita `formulario-new.js`:
```javascript
const MAX_DISTANCE = 50;  // Cambiar aquí (en metros)
```

### Agregar Nueva Notificación

En tu código:
```javascript
window.notificationSystem.success('¡Éxito!', 3000);
window.notificationSystem.error('Error', 3000);
```

---

## 🔌 Ejemplos de Uso Rápido

### Mostrar Loading
```javascript
window.loadingSystem.show('Procesando...');
// Hacer algo...
window.loadingSystem.hide();
```

### Guardar en Firestore
```javascript
try {
  await window.firebaseDB.collection('tareas').add({
    titulo: 'Mi Tarea',
    createdAt: new Date().toISOString()
  });
  window.notificationSystem.success('¡Guardado!');
} catch (error) {
  window.notificationSystem.error('Error: ' + error.message);
}
```

### Validar Email
```javascript
const email = 'usuario@example.com';
if (window.Helpers.validateEmail(email)) {
  console.log('Email válido');
}
```

### Calcular Distancia
```javascript
const distancia = window.Helpers.calculateDistance(
  -12.0453, -77.0311,  // lat1, lng1
  -12.0455, -77.0309   // lat2, lng2
);
console.log('Distancia: ' + Math.round(distancia) + ' metros');
```

### Guardar en LocalStorage
```javascript
window.Helpers.setStorage('miDato', { nombre: 'Juan' });
const dato = window.Helpers.getStorage('miDato');
```

### Monitorear Conexión
```javascript
window.Helpers.onConnectionChange((isOnline) => {
  if (isOnline) {
    console.log('Conectado');
  } else {
    console.log('Sin conexión');
  }
});
```

---

## 🐛 Troubleshooting

### "notificationSystem is undefined"
**Solución:** Asegurar que `notification-system.js` se carga DESPUÉS de `firebase-config.js`

### Mapa no muestra
**Solución:** Verificar Google Maps API key en `formulario.html`

### Firebase errors
**Solución:** Verificar Firebase config en `firebase-config.js`

### Sin conexión
**Solución:** El Service Worker maneja offline automáticamente

### GPS no funciona
**Solución:** 
1. Revisar permisos en navegador/dispositivo
2. Verificar que es HTTPS (requerido para geolocalización)
3. Usar modal de confirmación de permisos

---

## 📊 Estructura de Datos en Firestore

### Tarea Creada
```json
{
  "clienteId": "Nombre Cliente",
  "unidadId": "Unidad 001",
  "estado": "pendiente",
  "distancia": 42,
  "latitudCliente": -12.0453,
  "longitudCliente": -77.0311,
  "latitudUsuario": -12.0455,
  "longitudUsuario": -77.0309,
  "createdAt": "2024-12-31T14:30:45Z"
}
```

---

## 🔑 Atajos de Teclado (Posible Agregar)

| Tecla | Función |
|-------|---------|
| Esc | Cerrar modal |
| Enter | Confirmar formulario |
| Ctrl+S | Guardar |

---

## 📱 Responsive Breakpoints

```css
/* Desktop */
@media (min-width: 1025px) { }

/* Tablet */
@media (max-width: 1024px) { }

/* Mobile */
@media (max-width: 768px) { }

/* Small Mobile */
@media (max-width: 480px) { }
```

---

## 🎯 Performance Tips

1. **Use Helpers.fetchWithRetry()** para peticiones con reintentos
2. **Use window.Helpers.debounce()** para eventos frecuentes
3. **Verificar DevTools → Network** para ver caching
4. **Usar offline mode en DevTools** para probar funcionalidad

---

## 🚚 Deployment Checklist

- [ ] Firebase config actualizado
- [ ] Google Maps API key configurado
- [ ] Service Worker registrado
- [ ] HTTPS habilitado
- [ ] Manifest.json válido
- [ ] Testar en navegadores (Chrome, Firefox, Safari)
- [ ] Testar offline
- [ ] Testar en mobile real
- [ ] Probar geolocalización
- [ ] Verificar todas las notificaciones

---

## 🔄 Versiones

| Versión | Cambios |
|---------|---------|
| 1.0 | Versión inicial |
| 2.0 | Rediseño con neon |
| 2.5 | Agregado service worker |
| 3.0 | Sistemas globales + formulario mejorado |

**Última actualización:** Diciembre 2024

---

**📌 Recuerda:** Este proyecto es 100% funcional offline. ¡Pruébalo!
