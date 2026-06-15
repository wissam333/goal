export const usePwaInstall = () => {
  const { $pwa } = useNuxtApp();

  const isInstallable = computed(() => !!($pwa as any)?.showInstallPrompt);

  const install = async (): Promise<boolean> => {
    const pwa = $pwa as any;
    if (!pwa?.showInstallPrompt) return false;
    const result = await pwa.install();
    return result?.outcome === "accepted";
  };

  const dismiss = () => {
    const pwa = $pwa as any;
    pwa?.cancelInstall?.();
  };

  return { isInstallable, install, dismiss };
};
