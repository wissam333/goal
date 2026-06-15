export default defineNuxtPlugin(() => {
  // Runs as early as possible on client, before any component mounts
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    usePwaInstall().__setPrompt(e);
  });

  window.addEventListener("appinstalled", () => {
    usePwaInstall().__clearPrompt();
  });
});
