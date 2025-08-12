// scripts/ensure-assets.mjs
import { promises as fs } from 'node:fs'
import path from 'node:path'

const PUBLIC_DIR = path.resolve(process.cwd(), 'public')

// 必須アセット（ここに増やせばOK）
const REQUIRED = [
  { base: 'background', exts: ['png', 'jpg', 'jpeg', 'webp'] },
  { base: 'koma',       exts: ['png', 'jpg', 'jpeg', 'webp'] },
  // dice_1〜6（jpg想定。pngなら拡張子を調整）
  ...Array.from({ length: 6 }, (_, i) => ({ base: `dice_${i+1}`, exts: ['jpg', 'png'] })),
]

async function fileExists(p) {
  try { await fs.access(p); return true } catch { return false }
}

// base.ext が無いなら sample_base.ext をコピー
async function ensureOne(base, exts) {
  for (const ext of exts) {
    const target = path.join(PUBLIC_DIR, `${base}.${ext}`)
    const sample = path.join(PUBLIC_DIR, `sample_${base}.${ext}`)
    const exists = await fileExists(target)
    if (exists) continue

    const hasSample = await fileExists(sample)
    if (hasSample) {
      await fs.copyFile(sample, target)
      console.log(`[ensure-assets] copied ${path.basename(sample)} -> ${path.basename(target)}`)
    }
  }
}

async function main() {
  for (const { base, exts } of REQUIRED) {
    await ensureOne(base, exts)
  }

  // 追加で「public内の全sample_*をスキャンして対応元が無ければコピー」もやる
  const entries = await fs.readdir(PUBLIC_DIR)
  for (const name of entries) {
    if (!name.startsWith('sample_')) continue
    const targetName = name.replace(/^sample_/, '')
    const src = path.join(PUBLIC_DIR, name)
    const dst = path.join(PUBLIC_DIR, targetName)
    if (!(await fileExists(dst))) {
      await fs.copyFile(src, dst)
      console.log(`[ensure-assets] copied ${name} -> ${targetName}`)
    }
  }
}

main().catch(err => {
  console.error('[ensure-assets] failed:', err)
  process.exit(1)
})
