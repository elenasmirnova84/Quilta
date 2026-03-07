import toast from 'react-hot-toast';

export const showToast = {
  success: (message: string) => toast.success(message, {
    duration: 3000,
    style: {
      background: '#81B29A',
      color: '#fff',
      fontWeight: 'bold',
    },
  }),
  error: (message: string) => toast.error(message, {
    duration: 4000,
    style: {
      background: '#E76F51',
      color: '#fff',
      fontWeight: 'bold',
    },
  }),
  loading: (message: string) => toast.loading(message, {
    style: {
      background: '#3D405B',
      color: '#fff',
      fontWeight: 'bold',
    },
  }),
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => toast.promise(promise, messages, {
    style: {
      fontWeight: 'bold',
    },
  }),
};