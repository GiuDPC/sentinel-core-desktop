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
      buttonsStyling: false,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      reverseButtons: true,
      background: '#f8fafc',
      color: '#0f172a',
      customClass: {
        popup: 'font-sans rounded-3xl border border-slate-200 shadow-2xl bg-white overflow-hidden',
        title: 'text-lg font-bold text-slate-900',
        htmlContainer: 'text-sm text-slate-600 leading-relaxed',
        confirmButton: 'inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold uppercase tracking-[0.18em] transition-all hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/20',
        cancelButton: 'inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 text-slate-900 rounded-xl text-sm font-bold uppercase tracking-[0.18em] transition-all hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300/50',
        actions: 'mt-5 flex flex-wrap justify-end gap-2',
        input: 'w-full px-4 py-3 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10',
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
