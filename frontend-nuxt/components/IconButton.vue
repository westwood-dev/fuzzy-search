<template>
  <div class="button-cont">
    <button @click="onClickFunction">
      <Icon :name="iconName" />
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps({
  iconName: {
    type: String,
    required: true,
  },
  onClickFunction: {
    type: Function as PropType<(event: MouseEvent) => void>,
    required: true,
  },
});
</script>

<style scoped>
.button-cont {
  padding: 0.5rem;
  background-color: blueviolet;
  border-radius: 10rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;

  margin: 1rem;
  /* transform: translate(-50%, -50%); */
}

button {
  background: none;
  border: none;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1;
  cursor: pointer;
}
</style>
