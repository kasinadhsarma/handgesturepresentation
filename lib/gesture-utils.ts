export function recognizeGesture(landmarks: number[][]) {
  const thumbTip = landmarks[4]
  const indexTip = landmarks[8]
  const middleTip = landmarks[12]
  
  // Calculate hand size for relative thresholds
  const palmBase = landmarks[0]
  const handSize = Math.hypot(
    palmBase[0] - indexTip[0],
    palmBase[1] - indexTip[1]
  )
  
  // Thresholds based on hand size
  const gestureThreshold = handSize * 0.2
  
  // Next slide - thumb above index and middle fingers
  if (thumbTip[1] < indexTip[1] - gestureThreshold && 
      thumbTip[1] < middleTip[1] - gestureThreshold) {
    return 'next'
  }
  
  // Previous slide - thumb below index and middle fingers
  if (thumbTip[1] > indexTip[1] + gestureThreshold && 
      thumbTip[1] > middleTip[1] + gestureThreshold) {
    return 'previous'
  }

  // ...rest of gesture detection...
  return 'none'
}

export function mapGestureToAction(gesture: string) {
  switch (gesture) {
    case 'next':
      return 'NEXT_SLIDE';
    case 'previous':
      return 'PREVIOUS_SLIDE';
    case 'click':
      return 'CLICK';
    case 'zoomIn':
      return 'ZOOM_IN';
    case 'zoomOut':
      return 'ZOOM_OUT';
    case 'shape':
      return 'DRAW_SHAPE';
    case 'pointer':
      return 'DISPLAY_POINTER';
    case 'highlight':
      return 'HIGHLIGHT_TEXT';
    case 'stop':
      return 'STOP_PRESENTATION';
    case 'firstSlide':
      return 'FIRST_SLIDE';
    case 'lastSlide':
      return 'LAST_SLIDE';
    case 'undo':
      return 'UNDO';
    case 'redo':
      return 'REDO';
    case 'save':
      return 'SAVE_SLIDE';
    default:
      return 'UNKNOWN_ACTION';
  }
}
