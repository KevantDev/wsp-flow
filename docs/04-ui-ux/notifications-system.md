# Sistema Global de Notificaciones y Diálogos Modales (Toast & Confirm)

## 1. Erradicación de Popups Nativos del Navegador

Se ha eliminado el 100% de llamadas a `alert(...)`, `confirm(...)` y `prompt(...)` en todo el proyecto frontend.

---

## 2. Arquitectura del Servicio (`ToastService`)

Ubicado en `src/app/core/services/toast.service.ts`, implementa gestión de estado puramente reactiva basada en Signals:

```typescript
// Señales reactivas internas
toasts = signal<ToastItem[]>([]);
confirmDialog = signal<ConfirmDialogOptions | null>(null);
```

### 2.1. Métodos de Notificación Flotante (Toasts)
- `toast.success(message, title?)` (Verde esmeralda con check).
- `toast.error(message, title?)` (Rojo coral con cruz).
- `toast.warning(message, title?)` (Ámbar cálido con triángulo).
- `toast.info(message, title?)` (Índigo profesional con información).
- **Comportamiento:** Auto-descarte programado a los 4 o 5 segundos con botón de cierre manual inmediato.

### 2.2. Diálogos de Confirmación Asíncronos (`confirm`)
```typescript
const confirmed = await this.toast.confirm({
  title: '¿Eliminar Producto?',
  message: 'Esta acción no se puede deshacer.',
  confirmText: 'Sí, Eliminar',
  cancelText: 'Cancelar',
  type: 'danger', // 'danger' | 'warning' | 'info'
});

if (confirmed) {
  // Ejecutar lógica sin congelar la ventana del navegador
}
```

---

## 3. Componente Visual (`ToastContainerComponent`)

Montado globalmente en `app.component.ts`:
- **Pila de Toasts:** Ubicada en la esquina superior derecha (`z-[99999]`), con diseño glassmorphism (`backdrop-blur-xl`), sombras profundas y bordes sutiles según la severidad.
- **Modal de Confirmación:** Diálogo centrado con oscurecimiento y desenfoque del fondo (`backdrop-blur-sm`, `z-[100000]`), accesible mediante teclado (`Escape` / `Enter`) y con respuesta háptica en botones táctiles.
