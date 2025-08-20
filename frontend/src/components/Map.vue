<template>
  <div ref="wrapperRef" class="map-wrapper">
    <div ref="panzoomRef" class="zoom-container">
      <!-- マス -->
      <v-btn
        v-for="(cell, i) in cells"
        :key="'cell-' + i"
        class="cell"
        :color="cell.color"
        :style="{ top: cell.y + 'px', left: cell.x + 'px' }"
        @click="onClick(cell)"
      >
        {{ i + 1 }}
      </v-btn>

      <!-- コマ（5体まで） -->
      <img
        v-for="k in komas"
        :key="k.id"
        :ref="el => setKomaRef(k.id, el)"
        :src="k.src"
        class="koma"
        :class="{ dragging: draggingId === k.id }"
        :style="{ top: k.pos.y + 'px', left: k.pos.x + 'px' }"
        @pointerdown.stop.prevent="startDrag($event, k.id)"
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
      <img :src="`/dice_${currentDice}.png`" style="max-width:120px; margin:auto;" />
    </v-card>
  </v-dialog>

  <div v-if="showMemo" class="dice-history">
    <div>直近のサイコロ</div>
    <div>
      <span v-for="(d, i) in diceHistory" :key="'hist-' + i" class="dice-history-item">{{ d }}</span>
    </div>

    <div>各チームの点数状況</div>
    <div v-for="team in teams" :key="'team-' + team.id">
      {{ team.name }}: 
  <input
    type="text"
    v-model="team.score"
    class="score-input"
    style="width: 80px; margin-left: 8px;"
    @change="team.score = evalScore(team.score)"
    @blur="team.score = evalScore(team.score)"
  />
    </div>
    全体:
  <input
    type="text"
    v-model="globalScoreInput"
    class="score-input"
    style="width: 80px; margin-left: 8px;"
    @change="applyGlobalScore()"
    @blur="applyGlobalScore()"
  />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import * as Panzoom from '@panzoom/panzoom'

const wrapperRef = ref(null)
const panzoomRef = ref(null)
let panzoomInstance = null

const cells = ref([])
const selected = ref(null)
const dialogOpen = ref(false)

const diceOpen = ref(false)
const diceHistory = ref([])
const currentDice = ref(1)
let diceInterval = null
const showMemo = ref(false)

/** ▼▼ コマ：5体対応 ▼▼ */
const komas = ref([
  { id: 1, src: '/koma_1.png', pos: { x: 300,   y: 120 } },
  { id: 2, src: '/koma_2.png', pos: { x: 600,  y: 120 } },
  { id: 3, src: '/koma_3.png', pos: { x: 900, y: 120 } },
  { id: 4, src: '/koma_4.png', pos: { x: 1200, y: 120 } },
  { id: 5, src: '/koma_5.png', pos: { x: 1500, y: 120 } },
])
// もしコマ画像を変えたい場合：/koma1.png, /koma2.png ... を public に置いて src を個別に設定してください

// チーム情報（初期値）
const teams = ref([
  { id: 1, name: 'チーム1', score: 0, input: '0' },
  { id: 2, name: 'チーム2', score: 0, input: '0' },
  { id: 3, name: 'チーム3', score: 0, input: '0' },
  { id: 4, name: 'チーム4', score: 0, input: '0' },
  { id: 5, name: 'チーム5', score: 0, input: '0' }
])
const globalScoreInput = ref('')

// 保存用キー
const LS_KEY = 'wediroll_scores'

// ページ読み込み時に復元
onMounted(() => {
  const saved = localStorage.getItem(LS_KEY)
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        teams.value = parsed
      }
    } catch {}
  }
})

// 個別のDOM参照（必要なら）
const komaElMap = new Map()
function setKomaRef(id, el) {
  if (el) komaElMap.set(id, el)
  else komaElMap.delete(id)
}

// ドラッグ状態（どのコマを掴んでいるか）
const draggingId = ref(null)
let dragOffset = { x: 0, y: 0 } // コンテンツ座標系でのoffset

// 画面(client)→コンテンツ(content)座標に変換
function clientToContent(e) {
  const rect = panzoomRef.value.getBoundingClientRect()
  const scale = panzoomInstance?.getScale() || 1
  const pan = panzoomInstance?.getPan() || { x: 0, y: 0 }
  const clientX = e.clientX
  const clientY = e.clientY
  const x = (clientX - rect.left - pan.x) / scale
  const y = (clientY - rect.top  - pan.y) / scale
  return { x, y, scale }
}

function startDrag(e, id) {
  draggingId.value = id
  const k = komas.value.find(k => k.id === id)
  if (!k) return
  const p = clientToContent(e)
  dragOffset.x = p.x - k.pos.x
  dragOffset.y = p.y - k.pos.y
  document.addEventListener('pointermove', onDrag)
  document.addEventListener('pointerup', endDrag)
}

function onDrag(e) {
  if (!draggingId.value) return
  const k = komas.value.find(k => k.id === draggingId.value)
  if (!k) return
  const p = clientToContent(e)
  k.pos.x = p.x - dragOffset.x
  k.pos.y = p.y - dragOffset.y
}

function endDrag() {
  draggingId.value = null
  document.removeEventListener('pointermove', onDrag)
  document.removeEventListener('pointerup', endDrag)
}
/** ▲▲ コマ：5体対応 ▲▲ */

function evalScore(str) {
  try {
    // 数式として評価（安全のため数字と演算子のみ許可）
    if (/^[\d+\-*/ ().]+$/.test(str)) {
      // eslint-disable-next-line no-eval
      return Math.ceil(eval(str))
    }
    return 0
  } catch {
    return 0
  }
}

function applyGlobalScore() {
  const exprRaw = globalScoreInput.value
  teams.value.forEach(team => {
    let expr = exprRaw
    try {
      // 先頭が演算子なら team.score + expr などにする
      if (/^[+\-*/]/.test(expr)) {
        expr = `${team.score}${expr}`
      }
      if (/^[\d+\-*/ ().]+$/.test(expr)) {
        // eslint-disable-next-line no-eval
        team.score = Math.ceil(eval(expr))
      }
    } catch {
      // エラー時は何もしない
    }
  })
  globalScoreInput.value = ''
}

onMounted(async () => {
  const instance = Panzoom.default(panzoomRef.value, {
    maxZoom: 5,
    minZoom: 0.5,
    smoothScroll: false
  })
  panzoomInstance = instance

  // Ctrl + ホイールでズーム
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
    const [number, x, y, description, color] = line.split(',')
    return {
      number: Number(number),
      x: Number(x),
      y: Number(y),
      description: description || `マス ${number}`,
      color: (color || '').trim() || 'white'
    }
  })
  cells.value = rows
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onClick(cell) {
  selected.value = cell || { number: '-', description: `マス` }
  dialogOpen.value = true
}
function closeDialog() {
  dialogOpen.value = false
  selected.value = null
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
</script>

<style scoped>
.map-wrapper {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  border: 2px solid #ccc;
}
/* 例: ボタンのサイズを80x80pxにする */
.cell {
  min-width: 100px !important;
  width: 500px !important;
  height: 200px !important;
  font-size: 10em;
  border-radius: 10%;
  z-index: 5;
  padding: 0 !important;
  line-height: 100px !important;
}
.zoom-container {
  position: relative;
  width: 8000px;
  height: 3000px;
  background-image: url('/background.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* コマ */
.koma {
  position: absolute;
  width: 280px;
  height: 280px;
  cursor: grab;
  z-index: 10;
  user-select: none;
  touch-action: none; /* モバイルでのスクロール優先を防ぐ */
}
.koma.dragging {
  z-index: 20;
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
</style>
