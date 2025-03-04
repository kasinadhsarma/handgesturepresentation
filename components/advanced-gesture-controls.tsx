import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface Props {
  onGestureDetected: (gesture: string, confidence: number, metadata?: any) => void
  isActive: boolean
  onActiveChange: (active: boolean) => void
}

export function AdvancedGestureControls({
  onGestureDetected,
  isActive,
  onActiveChange,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let animationFrame: number | undefined;
    const processFrame = async () => {
      if (!videoRef.current || !isActive) {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
        return;
      }
      
      try {
        // Capture video frame and process through gesture recognition model
        const gesture = await detectGesture(videoRef.current);
        if (gesture) {
          onGestureDetected(gesture.name, gesture.confidence, gesture.metadata);
        }
      } catch (error) {
        console.error('Error processing gesture:', error);
      }
      
      animationFrame = requestAnimationFrame(processFrame);
    };

    if (isActive) {
      // Start webcam when gesture control is activated
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            mediaStreamRef.current = stream;
            processFrame();
          }
        })
        .catch((error) => {
          console.error("Error accessing webcam:", error);
          onActiveChange(false);
        });
    } else {
      // Stop webcam when gesture control is deactivated
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, onGestureDetected, onActiveChange]);

  const detectGesture = async (video: HTMLVideoElement) => {
    // This is where you'd integrate with a gesture recognition model
    // For now, we'll simulate gesture detection
    // In a real implementation, you'd:
    // 1. Use TensorFlow.js or a similar library to load a trained model
    // 2. Process the video frame through the model
    // 3. Return the detected gesture with confidence score
    
    // Simulate random gestures for testing
    const gestures = [
      { name: "nextSlide", confidence: 0.9 },
      { name: "previousSlide", confidence: 0.9 },
      { name: "draw", confidence: 0.85 },
      { name: "erase", confidence: 0.85 },
      { name: "highlight", confidence: 0.85 },
      { name: "shape", confidence: 0.85, metadata: { type: "rectangle" } },
      { name: "zoomIn", confidence: 0.8, metadata: { scale: 1.2 } },
      { name: "zoomOut", confidence: 0.8, metadata: { scale: 0.8 } }
    ];

    // Random delay to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return null most of the time to avoid constant gestures
    if (Math.random() > 0.05) return null;

    // Return a random gesture
    return gestures[Math.floor(Math.random() * gestures.length)];
  };

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg bg-black"
        style={{ display: isActive ? "block" : "none" }}
      />
      
      <Button
        className="w-full"
        variant={isActive ? "destructive" : "default"}
        onClick={() => onActiveChange(!isActive)}
      >
        {isActive ? "Stop Gesture Control" : "Start Gesture Control"}
      </Button>

      <Card className="p-4">
        <h4 className="text-sm font-medium mb-2">Available Gestures:</h4>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>👉 Point to show pointer</li>
          <li>✋ Swipe left/right to change slides</li>
          <li>✌️ Draw gesture to enable drawing</li>
          <li>🖐️ Eraser gesture to enable eraser</li>
          <li>👆 Circle motion to draw shapes</li>
          <li>👌 Pinch to zoom in/out</li>
        </ul>
      </Card>
    </div>
  );
}
