const deferredPrompt = ref<any>(null);
const isInstallable = ref(false);
let listenerRegistered = false;

export const usePwaInstall = () => {
  if (import.meta.client && !listenerRegistered) {
    listenerRegistered = true;
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      deferredPrompt.value = e;
      isInstallable.value = true;
    });
    window.addEventListener("appinstalled", () => {
      deferredPrompt.value = null;
      isInstallable.value = false;
    });
  }

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt.value) return false;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    isInstallable.value = false;
    return outcome === "accepted";
  };

  return { isInstallable, install };
};
