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
import { onMounted, ref } from 'vue'
import panzoom from '@panzoom/panzoom'

const wrapperRef = ref(null)
const panzoomRef = ref(null)
const massList = ref([])       // マスの説明文リスト
const selected = ref(null)     // 選択中のマス情報
const dialogOpen = ref(false)

onMounted(async () => {
  // ズーム・パンの初期化
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

  // mass.txt 読み込み
  const res = await fetch('/mass.txt')
  const text = await res.text()
  massList.value = text.split('\n').map((line, i) => line.trim() || `マス ${i + 1}`)
})

function onClick(n) {
  selected.value = {
    number: n,
    description: massList.value[n - 1] || `マス ${n}`
  }
  dialogOpen.value = true
}
function closeDialog() {
  selected.value = null
  dialogOpen.value = false
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
  background-image: url('/background.png'); /* public/background.jpg に配置する */
  background-size: cover;      /* もしくは contain, 100% 100% など */
  background-position: center;
  background-repeat: no-repeat;
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
