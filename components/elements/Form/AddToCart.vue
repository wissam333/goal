<template>
  <div>
    <button
      v-if="isDetails"
      class="add"
      @click.prevent="addToCart(product)"
    >
      Add To Cart
    </button>
    <div
      v-if="!isDetails"
      class=" cart-shop"
      @click.prevent="addToCart(product)"
    >
      <span>Add</span>
      <img src="/icons/Layer11.png" alt="" />
    </div>
  </div>
</template>

<script setup>

const { product, isDetails, qty } = defineProps([
  "product",
  "isDetails",
  "qty",
]);
const addToCart = (item) => {
  useShoppingCartComposable().addToCart(item);
};
</script>

<style lang="scss" scoped>
@import "~/assets/styles/scss/theme/variables";
@import "~/assets/styles/scss/theme/mixin";
.add {
    border: 1px solid $green;
    color: white;
    background-color: $green;
    padding: 5px 15px;
}
.cart-shop {
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 10px;
  width: 70px;
  padding: 2px;
  color:  $green;
  border: 1px solid $green;
  &:hover {
    color:  $green;
  }
  .counter,
  svg {
    color:  $green;
  }
  svg {
    font-size: 14px;
    transition: $transition;
    &:hover {
      scale: 1.2;
    }
  }
  img {
    margin: 0;
    width: 15px;
    height: 15px;
  }
}
</style>
