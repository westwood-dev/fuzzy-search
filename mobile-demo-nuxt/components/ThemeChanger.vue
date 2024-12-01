<template>
  <div class="theme-change-button">
    <Icon
      id="themeIcon"
      class="textColour"
      :name="
        theme == 'dark'
          ? 'material-symbols:light-mode'
          : 'material-symbols:dark-mode'
      "
      @click="changeTheme"
    />
  </div>
</template>

<script setup lang="ts">
const theme = ref('dark');

const changeTheme = () => {
  console.log('changing theme');
  let root = document.documentElement;

  if (theme.value === 'light') {
    root.style.setProperty('--text', '255,255,255');
    root.style.setProperty('--bg', '0,0,0');
    // document.querySelector('#theme-symbol')!.innerHTML = 'light_mode';
    document
      .querySelector('#themeIcon')!
      .setAttribute('name', 'material-symbols:light-mode');
    theme.value = 'dark';
  } else {
    root.style.setProperty('--text', '0,0,0');
    root.style.setProperty('--bg', '255,255,255');
    // document.querySelector('#theme-symbol')!.innerHTML = 'dark_mode';
    document
      .querySelector('#themeIcon')!
      .setAttribute('name', 'material-symbols:dark-mode');
    theme.value = 'light';
  }
};

onBeforeMount(() => {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  console.log(prefersDark);
  if (!prefersDark) {
    changeTheme();
  }
});
</script>

<style scoped>
.theme-change-button {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  cursor: pointer;
}

@media screen and (max-width: 600px) {
  #theme-symbol {
    font-size: 1.5rem;
  }
}
</style>
