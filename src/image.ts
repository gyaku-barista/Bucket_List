/** ファイルの先頭にある形式の印（HEIF なら ftyp の後ろの heic など） */
async function brandOf(file: Blob): Promise<string> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const box = String.fromCharCode(...head.slice(4, 12))
  return box.startsWith('ftyp') ? box.slice(4).trim() : Array.from(head.slice(0, 4), (b) => b.toString(16).padStart(2, '0')).join('')
}

const HEIF_BRANDS = /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/

/** 写真を読み込めなかったとき、どこで何が起きたかを伝えるためのエラー */
export class ImageLoadError extends Error {}

function describe(file: Blob, brand: string): string {
  const name = file instanceof File ? file.name : ''
  const kb = Math.round(file.size / 1024)
  return [name, file.type || '形式不明', `${kb}KB`, brand && `印:${brand}`].filter(Boolean).join(' / ')
}

/**
 * 写真を描ける形にする。
 * Android のカメラは写真を HEIF で保存することがあり、Chrome はそれを読めないので、
 * そのときだけ変換の部品を読み込んで変換する（ふだんはアプリを重くしない）。
 */
async function decode(file: Blob): Promise<ImageBitmap> {
  if (file.size === 0) throw new ImageLoadError('写真の中身を受け取れませんでした（写真を選ぶ画面の段階で失敗しています）')
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch (err) {
    const brand = await brandOf(file)
    if (!HEIF_BRANDS.test(brand)) throw new ImageLoadError(`この形式の写真は読み込めませんでした\n${describe(file, brand)}\n${err}`)
    try {
      const { heicTo } = await import('heic-to')
      return await heicTo({ blob: file, type: 'bitmap', options: { imageOrientation: 'from-image' } })
    } catch (heifErr) {
      throw new ImageLoadError(`HEIF の写真を変換できませんでした\n${describe(file, brand)}\n${heifErr}`)
    }
  }
}

/** アラートに出す文面 */
export function imageErrorMessage(err: unknown): string {
  return err instanceof ImageLoadError ? err.message : `写真を読み込めませんでした\n${err}`
}

/**
 * 画像を縮小して JPEG の dataURL にする。
 * Firestore のドキュメント上限 (1MiB) に収まるよう、大きすぎれば画質を下げて再エンコードする。
 */
export async function compressImage(file: File, maxSize: number, maxBytes = 500_000): Promise<string> {
  const bitmap = await decode(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()

  let quality = 0.82
  let data = canvas.toDataURL('image/jpeg', quality)
  while (data.length > maxBytes && quality > 0.3) {
    quality -= 0.1
    data = canvas.toDataURL('image/jpeg', quality)
  }
  return data
}

/** 正方形に切り抜いた小さいサムネイル（アイコンや一覧用） */
export async function squareThumb(src: string | File, size: number): Promise<string> {
  const bitmap =
    typeof src === 'string'
      ? await createImageBitmap(await (await fetch(src)).blob())
      : await decode(src)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  canvas
    .getContext('2d')!
    .drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  return canvas.toDataURL('image/jpeg', 0.8)
}
