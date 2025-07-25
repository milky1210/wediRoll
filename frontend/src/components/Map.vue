<template>
  <div ref="wrapperRef" class="map-wrapper">
    <div ref="panzoomRef" class="zoom-container">
      <div class="grid">
        <v-btn
          v-for="n in 50"
          :key="n"
          color="primary"
          class="grid-cell"
          @click="onClick(n)"
        >
          {{ n }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import panzoom from '@panzoom/panzoom'

const wrapperRef = ref(null)
const panzoomRef = ref(null)

onMounted(() => {
  const panzoomInstance = panzoom(panzoomRef.value, {
    maxZoom: 5,
    minZoom: 0.5,
    smoothScroll: false,
  })

  // ホイールズーム有効化
  wrapperRef.value.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      panzoomInstance.zoomWithWheel(e)
    }
  }, { passive: false })
})

function onClick(n) {
  alert(`マス ${n} をクリック！`)
}
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  border: 2px solid #ccc;
}

.zoom-container {
  width: 4000px;
  height: 2000px;
  background-color: #f9f9f9;
}

.grid {
  display: grid;
  grid-template-columns: repeat(10, 200px);
  grid-template-rows: repeat(5, 200px);
  gap: 16px;
  padding: 16px;
}

.grid-cell {
  width: 100%;
  height: 100%;
  font-size: 20px;
}
</style>
