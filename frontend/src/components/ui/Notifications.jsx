import Swal from 'sweetalert2';
import 'sweetalert2/dist/sweetalert2.min.css';

// Colores institucionales de Sentinel
const toastConfig = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
  background: '#f8fafc',
  color: '#1e293b',
  customClass: {
    popup: 'font-sans rounded-lg shadow-lg',
    timerProgressBar: 'bg-[#003091]',
  },
});

export const notifications = {
  success: (message, title = '¡Éxito!') => {
    return toastConfig.fire({
      icon: 'success',
      title,
      text: message,
    });
  },

  error: (message, title = 'Error') => {
    return toastConfig.fire({
      icon: 'error',
      title,
      text: message,
      timer: 6000,
    });
  },

  warning: (message, title = 'Atención') => {
    return toastConfig.fire({
      icon: 'warning',
      title,
      text: message,
    });
  },

  info: (message, title = 'Información') => {
    return toastConfig.fire({
      icon: 'info',
      title,
      text: message,
    });
  },

  // Modal de confirmación con botones
  confirm: (options) => {
    const { title = '¿Estás seguro?', text, confirmText = 'Sí', cancelText = 'Cancelar', type = 'question' } = options;
    
    return Swal.fire({
      ...options,
      title,
      text,
      icon: type,
      showCancelButton: true,
      confirmButtonColor: '#003091',
      cancelButtonColor: '#6b7280',
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      background: '#f8fafc',
      customClass: {
        popup: 'font-sans rounded-lg',
      },
    });
  },

  // Toast con loading
  loading: (message = 'Cargando...') => {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  },

  close: () => {
    Swal.close();
  },
};

export default notifications;
