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

// 蛇行するようにマスの座標を定義（例：横ジグザグ）
const cells = ref(
  Array.from({ length: 50 }, (_, i) => {
    const row = Math.floor(i / 10)
    const col = i % 10
    const x = row % 2 === 0 ? col * 200 : (9 - col) * 200 // 偶数列:→, 奇数列:←
    const y = row * 200
    return { x, y }
  })
)

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
  position: relative;
  width: 4000px;
  height: 2000px;
  background-image: url('/background.png'); /* public/background.jpg に配置する */
  background-size: cover;      /* もしくは contain, 100% 100% など */
  background-position: center;
  background-repeat: no-repeat;
}
</style>
