// composables/usePwaInstall.ts
const deferredPrompt = ref<any>(null);
const isInstallable = ref(false);

// Register listener once, as early as possible, only on client
if (import.meta.client) {
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

export const usePwaInstall = () => {
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
