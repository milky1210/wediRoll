<template>
  <div ref="wrapperRef" class="map-wrapper">
    <div ref="panzoomRef" class="zoom-container">
      <v-btn
        v-for="(cell, i) in cells"
        :key="i"
        class="cell"
        :color="getColor(cell.type)"
        :style="{ top: cell.y + 'px', left: cell.x + 'px' }"
        @click="onClick(cell)"
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

  <!-- サイコロ表示用 -->
<v-dialog v-model="diceOpen" persistent max-width="200px">
  <v-card class="pa-4 text-center">
    ダイスロール！
    <v-img :src="`/dice_${currentDice}.jpg`" max-width="120" class="mx-auto" />
  </v-card>
</v-dialog>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import panzoom from '@panzoom/panzoom'

const wrapperRef = ref(null)
const panzoomRef = ref(null)

const cells = ref([])
const selected = ref(null)
const dialogOpen = ref(false)
const diceOpen = ref(false)
const currentDice = ref(1)
let diceInterval = null

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

  //dice roll用
  window.addEventListener('keydown', onKeyDown)

  // 先頭がヘッダーなら除外
  const rows = lines.slice(1).map(line => {
    const [number, x, y, description, type] = line.split(',')
    return {
      number: Number(number),
      x: Number(x),
      y: Number(y),
      description: description || `マス ${number}`,
      type: type?. trim() || '通常マス'
    }
  })

  cells.value = rows
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onClick(cell) {
  selected.value = cell || { number: n, description: `マス ${n}` }
  dialogOpen.value = true
}
function closeDialog() {
  dialogOpen.value = false
  selected.value = null
}
function getColor(type) {
  switch (type) {
    case 'クイズマス':
      return 'blue'
    case '挑戦マス':
      return 'orange'
    case 'STOPマス':
      return 'red'
    default:
      return 'white'
  }
}
function onKeyDown(event) {
  if (event.key === 'd' || event.key === 'D') {
    rollDice()
  }
}
function rollDice() {
  diceOpen.value = true
  let count = 0

  diceInterval = setInterval(() => {
    currentDice.value = Math.floor(Math.random() * 6) + 1
    count++
    if (count >= 10) {
      clearInterval(diceInterval)
      diceInterval = null
    }
  }, 100)

  // 自動で2秒後に閉じる
  setTimeout(() => {
    diceOpen.value = false
  }, 2000)
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
