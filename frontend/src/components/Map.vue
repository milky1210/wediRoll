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
      <img
        ref="komaRef"
        src="/koma.png"
        class="koma"
        :style="{ top: komaPos.y + 'px', left: komaPos.x + 'px' }"
        @pointerdown.stop.prevent="startDrag"
      />
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
    <img :src="`/dice_${currentDice}.jpg`" style="max-width:120px; margin:auto;" />
  </v-card>
</v-dialog>
<div v-if="showMemo" class="dice-history">
  <div>直近のサイコロ</div>
  <div>
    <span v-for="(d, i) in diceHistory" :key="i" class="dice-history-item">{{ d }}</span>
  </div>
</div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as Panzoom from '@panzoom/panzoom'

const wrapperRef = ref(null)
const panzoomRef = ref(null)

const cells = ref([])
const selected = ref(null)
const dialogOpen = ref(false)
const diceOpen = ref(false)
const diceHistory = ref([]) // サイコロの履歴
const currentDice = ref(1)
let diceInterval = null
const showMemo = ref(false)
let panzoomInstance = null
const komaRef = ref(null)
const komaPos = ref({ x: 0, y: 200 })
let isDragging = false
let dragOffset = { x: 0, y: 0 }


onMounted(async () => {
  const instance = Panzoom.default(panzoomRef.value, {
    maxZoom: 5,
    minZoom: 0.5,
    smoothScroll: false
  })
  panzoomInstance = instance
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
  if ((event.key === 'd' || event.key === 'D') && !diceOpen.value) {
    rollDice()
  }
  if (event.key === 'm' || event.key === 'M') {
    showMemo.value = !showMemo.value
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
      // 履歴に追加（最大5件まで）
      diceHistory.value.unshift(currentDice.value)
      if (diceHistory.value.length > 5) diceHistory.value.pop()
    }
  }, 100)

  setTimeout(() => {
    diceOpen.value = false
  }, 3000)
}

function startDrag(e) {
  isDragging = true
  const scale = panzoomInstance.getScale() || 1
  dragOffset.x = e.clientX / scale - komaPos.value.x
  dragOffset.y = e.clientY / scale - komaPos.value.y
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', endDrag)
}

function onDrag(e) {
  if (!isDragging) return
  const scale = panzoomInstance.getScale() || 1
  komaPos.value.x = e.clientX / scale - dragOffset.x
  komaPos.value.y = e.clientY / scale - dragOffset.y
}

function endDrag() {
  isDragging = false
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', endDrag)
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

.dice-history {
  position: fixed;
  top: 20px;
  right: 20px;
  background: #fff;
  border: 1px solid #ccc;
  padding: 8px 16px;
  border-radius: 8px;
  z-index: 1000;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.dice-history-item {
  display: inline-block;
  margin: 0 4px;
  font-weight: bold;
  font-size: 1.2em;
}
.koma {
  position: absolute;
  width: 64px;
  height: 64px;
  cursor: grab;
  z-index: 10;
  background-color: rgba(255, 0, 0, 0.3); /* 赤色半透明で表示確認 */
}
</style>
