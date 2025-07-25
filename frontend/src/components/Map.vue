<template>
  <div ref="wrapper" class="wrapper">
    <div ref="zoomArea" class="zoom-area">
      <v-btn
        v-for="i in 150"
        :key="i"
        class="cell"
        :style="{
          top: `${Math.floor((i - 1) / 10) * 70}px`,
          left: `${((i - 1) % 10) * 100}px`,
        }"
      >
        {{ i }}
      </v-btn>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Panzoom from '@panzoom/panzoom'

const wrapper = ref(null)
const zoomArea = ref(null)

onMounted(() => {
  const panzoom = Panzoom(zoomArea.value, {
    maxScale: 4,
    minScale: 0.2,
    contain: 'outside',
  })
  wrapper.value.addEventListener('wheel', panzoom.zoomWithWheel)
})
</script>

<style scoped>
.wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.zoom-area {
  width: 100vw;
  height: 100vh;
  position: relative;
  transform-origin: 0 0;
  background: #f0f0f0;
}

.cell {
  position: absolute;
  width: 10px;
  height: 10px;
}
</style>
