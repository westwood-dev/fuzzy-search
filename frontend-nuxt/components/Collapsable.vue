<template>
  <div class="collapsable-cont">
    <div
      v-for="(item, index) in list_data"
      :key="index"
      class="collapsable-item"
    >
      <div>
        <button @click="toggle(index)">
          <Icon
            name="material-symbols:arrow-right-rounded"
            size="2rem"
            style="margin: 0"
            :style="isOpen(index) ? 'transform: rotate(90deg)' : ''"
          />{{ item.title }}
        </button>
        <div v-if="isOpen(index)" class="collapse-content">
          <p>{{ item.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const list_data: Ref<{ id: Number; title: string; content: any }[]> = ref([]);
list_data.value = [
  { id: 1, title: 'item 1', content: 'content 1' },
  { id: 2, title: 'item 2', content: 'content 2' },
  { id: 3, title: 'item 3', content: 'content 3' },
  { id: 4, title: 'item 4', content: 'content 4' },
  { id: 5, title: 'item 5', content: 'content 5' },
  { id: 6, title: 'item 6', content: 'content 6' },
  { id: 7, title: 'item 7', content: 'content 7' },
  { id: 8, title: 'item 8', content: 'content 8' },
  { id: 9, title: 'item 9', content: 'content 9' },
  { id: 10, title: 'item 10', content: 'content 10' },
];

const openIndex: Ref<Number> = ref(-1);

const toggle = (index: Number) => {
  openIndex.value = openIndex.value === index ? -1 : index;
};

const isOpen = (index: Number) => {
  return openIndex.value === index;
};
</script>

<style>
.collapsable-cont {
  position: fixed;
  bottom: 50%;
  top: 50%;
  margin: auto 1rem;
  right: 0;
  background-color: blueviolet;
  padding: 1rem;
  border-radius: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  max-height: 40lvh;
  height: fit-content;
  overflow-y: scroll;
}

.collapsable-item {
  width: 10rem;
}

.collapsable-item button {
  width: 100%;
  padding: 0;
  /* background-color: #585858; */
  background: none;
  color: white;
  border: none;
  margin-bottom: 0.25rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

.collapsable-item p {
  width: 100%;
  padding-left: 2rem;
  font-size: 0.75rem;
}
</style>
