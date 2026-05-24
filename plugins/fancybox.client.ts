import { defineNuxtPlugin } from "#app"
import { Fancybox } from "@fancyapps/ui"
import "@fancyapps/ui/dist/fancybox/fancybox.css"

export default defineNuxtPlugin(() => {
  Fancybox.bind("[data-fancybox]", {
    Carousel: { infinite: false },
    Toolbar: {
      display: [
        { id: "counter", position: "center" },
        { id: "close", position: "right" },
      ],
    },
  })
})
