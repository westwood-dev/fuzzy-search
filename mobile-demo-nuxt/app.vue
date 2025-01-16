<template>
  <div class="bg-colour site-cont">
    <Menubar />
    <NuxtPage />
  </div>
</template>

<script setup lang="ts"></script>

<style>
html,
body {
  margin: 0;
  padding: 0;
  font-family: Arial, Helvetica, sans-serif;
}

* {
  box-sizing: border-box;
}

:root {
  --text: 255, 255, 255;
  --bg: 0, 0, 0;
  --border-width: 0.25rem;
  /* --link: 180 180 243; */
  --link: 193, 18, 31;
}

.text-colour,
p {
  color: rgb(var(--text));
  transition: color 0.5s;
}

.bg-colour {
  background-color: rgb(var(--bg));
  transition: background-color 0.5s;
}

.text-colour-invert {
  color: rgb(var(--bg));
  transition: color 0.5s;
}

.bg-colour-invert {
  background-color: rgb(var(--text));
  transition: background-color 0.5s;
}

.site-cont {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
}
</style>
