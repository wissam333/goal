<template>
  <div :class="`${islight} ${classes}`" :style="{'width':width,'height':height,'max-width':'100%'}"></div>
</template>

<script setup>
  const islight = ref('loads')
  const { width, height, classes, light } = defineProps(['width', 'height', 'classes', 'light']);

  onMounted(() => {
    islight.value = light ? 'loads-light' : 'loads'
  })
</script>

<style lang="scss" scoped>
.content-shape {
  height: 10px;
  width: 100%;
  max-width: 100%;
  border-radius: 0.25rem;
}

.loads {
  animation-duration: 1s;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  animation-name: placeload;
  animation-timing-function: linear;
  background: rgb(0 0 0 / 7%);
  background: linear-gradient(
    to right,
    rgb(0 0 0 / 7%) 8%,
    rgb(0 0 0 / 15%) 18%,
    rgb(0 0 0 / 7%) 33%
  );
  background-size: 800px 104px;
  background-size: 1200px 104px;
  position: relative;
  display:inline-block

  
}
.special {
  background: linear-gradient( 90deg ,
            #B58947,
            #A3732F,
            #361F00,
            #FFEAA5,
            #CEA253,
            #82561D,
            #FFEDAB,
            #A3732F);
            border-radius: 5px;
  }
.loads-light{
animation-duration: 1s;
animation-fill-mode: forwards;
animation-iteration-count: infinite;
animation-name: placeload;
animation-timing-function: linear;
background: rgb(0 0 0 / 7%);
background: linear-gradient(
  to right,
  rgb(255 255 255 / 7%) 8%,
  rgb(255 255 255 / 15%) 18%,
  rgb(255 255 255 / 7%) 33%
);
background-size: 800px 104px;
background-size: 1200px 104px;
position: relative;
display:inline-block
}
@keyframes placeload {
0% {
  background-position: -468px 0;
}

100% {
  background-position: 468px 0;
}
}
.is-rounded-xs {
  border-radius: 0.25rem;
}

.is-rounded-sm {
  border-radius: 0.5rem;
}

.is-rounded-md {
  border-radius: 0.75rem;
}

.is-rounded-lg {
  border-radius: 1rem;
}

.is-rounded-xl {
  border-radius: 1.25rem;
}

.is-rounded-full {
  border-radius: 50%;
}
</style>
