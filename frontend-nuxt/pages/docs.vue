<template>
  <div class="docs-cont">
    <div class="docs-sidebar-cont">
      <div class="docs-sidebar-item">item 1</div>
      <div class="docs-sidebar-item">item 2</div>
      <div class="docs-sidebar-item">item 3</div>
      <div class="docs-sidebar-item">item 4</div>
      <div class="docs-sidebar-item">item 5</div>
    </div>

    <div class="docs-content-cont">
      <h1>Docs</h1>
      <h2>WORK IN PROGRESS</h2>
      <div class="docs-content-item">
        <h2>item 1</h2>
        <p>content 1</p>
      </div>
      <div class="docs-content-item">
        <h2>item 2</h2>
        <p>content 2</p>
      </div>
      <div class="docs-content-item">
        <h2>item 3</h2>
        <p>content 3</p>
      </div>
      <div class="docs-content-item">
        <h2>item 4</h2>
        <p>content 4</p>
      </div>
      <div class="docs-content-item">
        <h2>item 5</h2>
        <p>content 5</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.docs-sidebar-cont {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  margin: 1rem;
  border-radius: 1rem;
  width: 10vw;
  background-color: blueviolet;
  padding: 1rem;
}

.docs-content-cont {
  width: 100vw;
  padding: 0 15vw;
}
</style>
