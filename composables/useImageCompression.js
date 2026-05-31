import imageCompression from "browser-image-compression"

export const useImageCompression = () => {
  const compressImage = async (file, options = {}) => {
    const defaults = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: "image/webp",
    }
    const opts = { ...defaults, ...options }
    try {
      const compressedBlob = await imageCompression(file, opts)
      return compressedBlob
    } catch (err) {
      void(err)
      return file
    }
  }

  const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })
  }

  const compressAndEncode = async (file, options = {}) => {
    const compressed = await compressImage(file, options)
    return await blobToBase64(compressed)
  }

  return { compressImage, blobToBase64, compressAndEncode }
}
