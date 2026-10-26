/** HEIF (.heic) かどうかを、ファイルの先頭の印で見分ける */
async function isHeif(file: Blob): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const box = String.fromCharCode(...head.slice(4, 12))
  return box.startsWith('ftyp') && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(box.slice(4))
}

/**
 * 写真を描ける形にする。
 * Android のカメラは写真を HEIF で保存することがあり、Chrome はそれを読めないので、
 * そのときだけ変換の部品を読み込んで変換する（ふだんはアプリを重くしない）。
 */
async function decode(file: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch (err) {
    if (!(await isHeif(file))) throw err
    const { heicTo } = await import('heic-to')
    return heicTo({ blob: file, type: 'bitmap', options: { imageOrientation: 'from-image' } })
  }
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
