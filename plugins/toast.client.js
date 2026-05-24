// plugins/toast.client.js
import { ref } from "vue";

// Create reactive state
const toasts = ref([]);
let toastId = 0;

// Toast methods
const removeToast = (id) => {
  const index = toasts.value.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.value.splice(index, 1);
  }
};

const addToast = ({ type = "info", title = "", message, duration = 5000 }) => {
  const id = toastId++;

  const toast = {
    id,
    type,
    title,
    message,
    duration,
    visible: true,
  };

  toasts.value.push(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration);
  }

  return id;
};

// Create the toast API
const toastAPI = {
  success: (message, options = {}) =>
    addToast({ type: "success", message, ...options }),
  error: (message, options = {}) =>
    addToast({ type: "error", message, ...options }),
  warning: (message, options = {}) =>
    addToast({ type: "warning", message, ...options }),
  info: (message, options = {}) =>
    addToast({ type: "info", message, ...options }),
  remove: removeToast,
  clearAll: () => {
    toasts.value = [];
  },
};

export default defineNuxtPlugin((nuxtApp) => {
  // Only provide once
  nuxtApp.provide("toast", toastAPI);

  // Return the state separately
  return {
    provide: {
      toastState: toasts,
    },
  };
});
