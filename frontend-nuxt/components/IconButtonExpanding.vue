<template>
  <div class="button-cont" :style="[positionStyle(position), expandedStyle]">
    <button @click="expanded ? (expanded = false) : (expanded = true)">
      <Icon :name="iconName" />
    </button>
    <div v-if="expanded" style="padding-top: 1rem; overflow-y: scroll">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  iconName: {
    type: String,
    required: true,
  },
  position: {
    type: String,
    default: 'center-center',
  },
});

const positionStyle = (position: string) => {
  let positions = position.split('-');
  if (positions.length !== 2) {
    positions = ['center', 'center'];
  }
  let positionStyle = '';
  switch (positions[0]) {
    case 'left':
      positionStyle += 'left: 0;';
      break;
    case 'right':
      positionStyle += 'right: 0;';
      break;
    default:
      positionStyle += 'left: 50%;';
  }
  switch (positions[1]) {
    case 'top':
      positionStyle += 'top: 0;';
      break;
    case 'bottom':
      positionStyle += 'bottom: 0;';
      break;
    default:
      positionStyle += 'top: 50%;';
  }
  return positionStyle;
};

const expanded = ref(false);

const expandedStyle = computed(() => {
  return expanded.value
    ? {
        width: '10rem',
        height: '10rem',
      }
    : {
        width: '1rem',
        height: '1rem',
      };
});

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const buttonCont = document.querySelector('.button-cont');
    if (buttonCont && !buttonCont.contains(event.target as Node)) {
      expanded.value = false;
    }
  };

  document.addEventListener('click', handleClickOutside);

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
});
</script>

<style scoped>
.button-cont {
  padding: 0.5rem;
  background-color: blueviolet;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  width: 1rem;
  height: 1rem;

  transition: all 250ms ease-in-out;

  margin: 1rem;
  /* transform: translate(-50%, -50%); */
  position: fixed;
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
  position: absolute;
  top: 0;
  left: 0;
  width: 2rem;
  height: 2rem;
}
</style>
