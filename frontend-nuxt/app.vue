<!-- <script setup lang="ts">
console.log(
  " _                     _     _       _   _           _   _  \n(_)                   | |   | |     | | | |         | | | |              \n ___      _____  _   _| | __| |_ __ | |_| |__   ___ | |_| |__   ___ _ __ \n| \\ \\ /\\ / / _ \\| | | | |/ _` | '_ \\| __| '_ \\ / _ \\| __| '_ \\ / _ \\ '__|\n| |\\ V  V / (_) | |_| | | (_| | | | | |_| |_) | (_) | |_| | | |  __/ |   \n|_| \\_/\\_/ \\___/ \\__,_|_|\\__,_|_| |_|\\__|_.__/ \\___/ \\__|_| |_|\\___|_|   \nWilliam Westwood // iwouldntbother // wwstwd"
);
</script> -->

<template>
  <div><NuxtPage /></div>
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
  background-color: rgb(var(--bg));
  color: rgb(var(--text));
  transition: background-color 0.5s, color 0.5s;
  font-family: 'Poppins', sans-serif;
  min-height: 100lvh;
}

body::-webkit-scrollbar {
  display: none;
}

body {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

a {
  color: var(--link-color);
  text-decoration: none;
  transition: color 0.5s;
}

:root {
  --text: 255, 255, 255;
  --bg: 33, 37, 41;
  --link-color: #0077b6;
  --colour-0: rgb(97.348% 49.838% 29.899%);
}

.textColour {
  color: rgb(var(--text));
  transition: color 0.5s;
}

.bgColour {
  background-color: rgb(var(--bg));
  transition: background-color 0.5s;
}

.textColourInvert {
  color: rgb(var(--bg));
  transition: color 0.5s;
}

.bgColourInvert {
  background-color: rgb(var(--text));
  transition: background-color 0.5s;
}

#scroll-section {
  overflow-y: scroll;
  height: calc(100vh - 5vw);
  box-sizing: border-box;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

#scroll-section::-webkit-scrollbar {
  display: none;
}

@media screen and (max-width: 600px) {
  #scroll-section {
    height: calc(100svh - 12vw);
  }
}

a::before {
  content: '[';
}

a[target='_blank']::after {
  content: ']↗';
}

a::after {
  content: ']→';
}
a {
  color: #fbff00;
  color: #00f9f9;
}

.page-enter-active::after,
.page-leave-active::after {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 0vw;
  height: 0vw;
  border-radius: 50%;
  background-color: #8a2be2;
  z-index: 100;
  transition: width 500ms, height 500ms;
}

.page-enter-from::after,
.page-leave-to::after {
  width: 120vw;
  height: 120vw;
}
</style>
