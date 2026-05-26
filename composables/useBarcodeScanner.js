export const useBarcodeScanner = () => {
  const startHwListener = () => ({ stop: () => {} })
  const scanWithCamera = () => {}
  const error = ref(null)

  return { startHwListener, scanWithCamera, error }
}
