/**
 * 画像を縮小して JPEG の dataURL にする。
 * Firestore のドキュメント上限 (1MiB) に収まるよう、大きすぎれば画質を下げて再エンコードする。
 */
export async function compressImage(file: File, maxSize: number, maxBytes = 500_000): Promise<string> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
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
      : await createImageBitmap(src, { imageOrientation: 'from-image' })
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
