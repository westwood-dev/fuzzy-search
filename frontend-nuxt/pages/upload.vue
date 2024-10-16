<template>
  <div class="container">
    <h1>Document Upload</h1>
    <!-- Drag and Drop Area -->
    <div
      class="drop-area"
      @dragover.prevent="onDragOver"
      @drop.prevent="onDrop"
    >
      <p>Drag up to 10 documents here</p>
      <input
        type="file"
        ref="fileInput"
        @change="onFileChange"
        multiple
        hidden
      />
      <button @click="triggerFileInput">Upload Files</button>
    </div>

    <!-- File Upload Progress -->
    <div v-if="isUploading">Uploading...</div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- Display the uploaded files -->
    <div v-if="uploadedTexts.length > 0" style="z-index: 10">
      <h2>Uploaded Documents</h2>
      <ul>
        <li v-for="(text, index) in uploadedTexts" :key="index">
          <div>
            <button @click="toggle(index)">
              {{ text.filename }}
            </button>
            <div v-if="isOpen(index)" class="collapse-content">
              <p>{{ text.content }}</p>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const files = ref([]);
const uploadedTexts = ref([]);
const openIndex = ref(-1);
const isUploading = ref(false);
const errorMessage = ref('');

const triggerFileInput = () => {
  const fileInput = refs.fileInput;
  fileInput.click();
};

const onDragOver = (event) => {
  event.preventDefault();
  event.target.style.opacity = 0.5;
};

const onDrop = (event) => {
  const droppedFiles = Array.from(event.dataTransfer.files);
  handleFiles(droppedFiles);
  event.target.style.opacity = 0;
};

const onFileChange = (event) => {
  const selectedFiles = Array.from(event.target.files);
  handleFiles(selectedFiles);
};

const handleFiles = async (selectedFiles) => {
  if (selectedFiles.length + files.value.length > 10) {
    alert('You can upload up to 10 files');
    return;
  }

  files.value.push(...selectedFiles);
  errorMessage.value = ''; // Clear previous error messages
  isUploading.value = true;

  for (let file of selectedFiles) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await axios.post(
        'http://localhost:8000/extract-text',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      uploadedTexts.value.push({
        filename: file.name,
        content: response.data.text,
      });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        errorMessage.value = `File not accepted: ${file.name}. ${error.response.data.detail}`;
      } else {
        errorMessage.value = `Error uploading file: ${file.name}. Error: ${error.response.data.detail}`;
      }
    }
  }

  isUploading.value = false;
};

const toggle = (index) => {
  openIndex.value = openIndex.value === index ? -1 : index;
};

const isOpen = (index) => {
  return openIndex.value === index;
};
</script>

<style scoped>
.container {
  padding: 20px;
  z-index: 1;
}

.drop-area {
  border: 2px dashed #ccc;
  padding: 20px;
  text-align: center;
  margin-bottom: 20px;
  cursor: pointer;
  opacity: 0;
  background-color: rgb(138, 43, 226);
  transition: all 250ms ease-in-out;
  position: fixed;
  top: 0;
  left: 0;
  width: 100lvw;
  height: 100lvh;
}

.error-message {
  color: red;
  margin-top: 10px;
}

.collapse-content {
  margin-top: 10px;
  background-color: #585858;
  padding: 10px;
  border: 1px solid #ddd;
}
</style>
