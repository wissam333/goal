export default defineNuxtPlugin(() => {
  const { __setPrompt, __clearPrompt, __hydrate } = usePwaInstall();

  // Pick up any prompt that fired before this plugin ran
  __hydrate();

  // Listen for future prompts
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    __setPrompt(e);
  });

  window.addEventListener("appinstalled", () => {
    __clearPrompt();
  });
});
