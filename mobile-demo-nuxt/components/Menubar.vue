<template>
  <div class="menubar-cont bg-colour">
    <div class="left">
      <div class="search-cont">
        <NuxtLink
          to="/"
          class="text-colour"
          :class="
            route.path == '/' || route.path == '/results' ? 'selected' : ''
          "
          >search</NuxtLink
        >
      </div>
      <div class="interpolate-cont text-colour">
        <NuxtLink
          to="/interpolate"
          class="text-colour"
          :class="route.path == '/interpolate' ? 'selected' : ''"
          >interpolate</NuxtLink
        >
      </div>
    </div>
    <div class="right">
      <ThemeChanger />
      <div class="info-cont text-colour">
        <NuxtLink
          to="/info"
          class="text-colour"
          :class="route.path == '/info' ? 'selected' : ''"
          >info</NuxtLink
        >
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
</script>

<style scoped>
.menubar-cont {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 3rem 1rem 1rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
}

.menubar-cont > div {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 1rem;
}

.menubar-cont a {
  opacity: 0.5;
  text-decoration: none;
}

.selected {
  font-weight: 700;
  opacity: 1 !important;
}
</style>
