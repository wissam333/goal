<template>
    <div>
        <div class="box" :class="classes">
            <div class="inner">
                <NuxtImg
                    class="w-100 image"
                    :placeholder="[50, 50, 80, 3]"
                    format="webp" 
                    :src="`${apiBase}/${selectedImageInner}`" 
                />
            </div>
        </div>
        <div class="overflow-x-auto mt-5 d-flex">
            <NuxtImg
                class="pointer  "
                :class="$i18n.locale == 'en' ? 'mr-3' : 'ml-3'"
                :style="selectedImage == selectedImageInner ? 'border: 3px solid #FFEDAB;' : 'border: 1px dashed #FFEDAB;'"
                width="100"
                height="100"
                :placeholder="[50, 50, 80, 3]"
                format="webp" 
                :src="`${apiBase}/${selectedImage}`" 
                @click="ChangeSelctImage(selectedImage)"
            />
            <NuxtImg
                :style="selectedImageInner == img.image ? 'border: 3px solid #FFEDAB;' : 'border: 1px dashed #FFEDAB;'"
                v-for="img in album" :key="img.id"
                class="pointer  "
                :class="$i18n.locale == 'en' ? 'mr-3' : 'ml-3'"
                width="100"
                height="100"
                :placeholder="[50, 50, 80, 3]"
                format="webp" 
                :src="`${apiBase}/${img.image}`" 
                @click="ChangeSelctImage(img.image)"

            />
        </div>
    </div>
</template>

<script setup>
const {
    public: { api, apiBase },
} = useRuntimeConfig();
defineProps(['selectedImage', 'album', 'classes', 'selectedImageInner'])
const emit = defineEmits(['ChangeSelctImage'])

const ChangeSelctImage = (url) => {
    emit('ChangeSelctImage', url )
}
</script>

<style lang="scss" scoped>
.box {
        background: linear-gradient( 90deg ,
                #B58947,
                #A3732F,
                #361F00,
                #FFEAA5,
                #CEA253,
                #82561D,
                #FFEDAB,
                #A3732F);
        position: relative;
        height: 400px;
        border-radius: 0px;
        transition: all 0.5s linear;
        overflow: hidden;
        @media (max-width: 992px) {
            height: 260px;
        }
        .inner {
            overflow: hidden;
            position: absolute;
                border-radius: 0px;
                top: 10px;
                left: 10px;
                width: calc(100% - 20px);
                height: calc(100% - 20px);
                background: linear-gradient(
                to top,
                #150d0a,
                #26231a ,
                #1f1a14,
                #29271b
                );
                .image {
                    height: 100%;
                    border-radius: 0px;
                    object-fit: contain !important;
                    @media (max-width: 992px) {
                        height: 240px;
                    }
                }
        }
    }
</style>