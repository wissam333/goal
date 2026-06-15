const deferredPrompt = ref<any>(null);
const isInstallable = ref(false);

export const usePwaInstall = () => {
  const install = async (): Promise<boolean> => {
    if (!deferredPrompt.value) return false;
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    deferredPrompt.value = null;
    isInstallable.value = false;
    return outcome === "accepted";
  };

  const __setPrompt = (e: any) => {
    deferredPrompt.value = e;
    isInstallable.value = true;
  };

  const __clearPrompt = () => {
    deferredPrompt.value = null;
    isInstallable.value = false;
  };

  // Pick up the prompt if it was captured before JS hydrated
  const __hydrate = () => {
    if ((window as any).__pwaPrompt && !deferredPrompt.value) {
      __setPrompt((window as any).__pwaPrompt);
    }
  };

  return { isInstallable, install, __setPrompt, __clearPrompt, __hydrate };
};
