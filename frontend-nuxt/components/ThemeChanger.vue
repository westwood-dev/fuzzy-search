<template>
  <div class="theme-change-button">
    <span
      id="theme-symbol"
      class="material-symbols-outlined textColour"
      @click="changeTheme"
    >
      light_mode
    </span>
  </div>
</template>

<script setup lang="ts">
const theme = ref('dark');

const changeTheme = () => {
  console.log('changing theme');
  let root = document.documentElement;

  if (theme.value === 'light') {
    root.style.setProperty('--text', '255,255,255');
    root.style.setProperty('--bg', '33,37,41');
    document.querySelector('#theme-symbol')!.innerHTML = 'light_mode';
    theme.value = 'dark';
  } else {
    root.style.setProperty('--text', '33,37,41');
    root.style.setProperty('--bg', '255,255,255');
    document.querySelector('#theme-symbol')!.innerHTML = 'dark_mode';
    theme.value = 'light';
  }
};
</script>

<style scoped>
.theme-change-button {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 1rem;
  cursor: pointer;
}

@media screen and (max-width: 600px) {
  #theme-symbol {
    font-size: 1.5rem;
  }
}
</style>
