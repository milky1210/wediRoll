<template>
  <div ref="wrapperRef" class="map-wrapper">
    <div ref="panzoomRef" class="zoom-container">
      <v-btn
        v-for="(cell, i) in cells"
        :key="i"
        class="cell"
        color="primary"
        :style="{ top: cell.y + 'px', left: cell.x + 'px' }"
        @click="onClick(i + 1)"
      >
        {{ i + 1 }}
      </v-btn>
    </div>
  </div>

  <v-dialog v-model="dialogOpen" max-width="500px">
    <v-card v-if="selected">
      <v-card-title>マス {{ selected.number }}</v-card-title>
      <v-card-text>{{ selected.description }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn text @click="closeDialog">閉じる</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import panzoom from '@panzoom/panzoom'

const wrapperRef = ref(null)
const panzoomRef = ref(null)

const cells = ref([])
const selected = ref(null)
const dialogOpen = ref(false)

onMounted(async () => {
  const panzoomInstance = panzoom(panzoomRef.value, {
    maxZoom: 5,
    minZoom: 0.5,
    smoothScroll: false,
  })

  wrapperRef.value.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
      e.preventDefault()
      panzoomInstance.zoomWithWheel(e)
    }
  }, { passive: false })

  // CSV読み込み
  const res = await fetch('/mass.csv')
  const text = await res.text()
  const lines = text.trim().split('\n')

  // 先頭がヘッダーなら除外
  const rows = lines.slice(1).map(line => {
    const [number, x, y, description] = line.split(',')
    return {
      number: Number(number),
      x: Number(x),
      y: Number(y),
      description: description || `マス ${number}`
    }
  })

  cells.value = rows
})

function onClick(n) {
  const cell = cells.value.find(c => c.number === n)
  selected.value = cell || { number: n, description: `マス ${n}` }
  dialogOpen.value = true
}
function closeDialog() {
  dialogOpen.value = false
  selected.value = null
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
  position: relative;
  width: 4000px;
  height: 2000px;
  background-image: url('/background.png'); /* public/background.jpg に配置する */
  background-size: cover;      /* もしくは contain, 100% 100% など */
  background-position: center;
  background-repeat: no-repeat;
}
</style>
