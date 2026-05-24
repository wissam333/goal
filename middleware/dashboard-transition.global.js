// middleware/dashboard-transition.global.js
export default defineNuxtRouteMiddleware((to) => {
  if (to.path.startsWith("/dashboard")) {
    to.meta.pageTransition = {
      name: "page",
      mode: "out-in",
    };
    to.meta.layoutTransition = false;
  }
});
