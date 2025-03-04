#!/usr/bin/env python3
"""
Presentation Control with Webcam Gestures for Linux
- Gesture 1 (thumbs up): Go to previous slide
- Gesture 2 (whole hand pointing up): Go to next slide
"""

import os
import numpy as np
import cv2
import subprocess
from cvzone.HandTrackingModule import HandDetector
import time
import gi
gi.require_version('Gtk', '3.0')
from gi.repository import Gtk, GLib

class PresentationController:
    def __init__(self, presentation_path):
        self.presentation_path = presentation_path
        
        # Start the presentation using LibreOffice Impress in presentation mode
        self.start_presentation()
        
        # Parameters
        self.width, self.height = 900, 720
        self.gestureThreshold = 300
        self.buttonPressed = False
        self.counter = 0
        self.delay = 30
        
        # Camera Setup
        self.cap = cv2.VideoCapture(0)
        self.cap.set(3, self.width)
        self.cap.set(4, self.height)
        
        # Hand Detector
        self.detectorHand = HandDetector(detectionCon=0.8, maxHands=1)
        
    def start_presentation(self):
        """Start LibreOffice Impress presentation"""
        try:
            subprocess.Popen(['libreoffice', '--show', self.presentation_path])
            print(f"Starting presentation: {os.path.basename(self.presentation_path)}")
            # Give LibreOffice time to start
            time.sleep(3)
        except Exception as e:
            print(f"Error starting presentation: {e}")
            exit(1)
    
    def send_key(self, key):
        """Send keyboard event using xdotool"""
        try:
            subprocess.run(['xdotool', 'key', key], check=True)
        except Exception as e:
            print(f"Error sending key: {e}")
    
    def next_slide(self):
        """Go to next slide using Right or Down arrow key"""
        self.send_key('Right')
        print("Next slide")
    
    def previous_slide(self):
        """Go to previous slide using Left or Up arrow key"""
        self.send_key('Left')
        print("Previous slide")
    
    def run(self):
        """Main loop for webcam processing and gesture detection"""
        while True:
            # Get image frame
            success, img = self.cap.read()
            if not success:
                print("Failed to capture image")
                break
                
            # Find the hand and its landmarks
            hands, img = self.detectorHand.findHands(img)  # with draw
            
            if hands and not self.buttonPressed:  # If hand is detected
                hand = hands[0]
                cx, cy = hand["center"]
                fingers = self.detectorHand.fingersUp(hand)  # List of which fingers are up
                
                if cy <= self.gestureThreshold:  # If hand is at the height of the face
                    if fingers == [1, 1, 1, 1, 1]:  # All fingers up
                        self.buttonPressed = True
                        self.next_slide()
                        
                    if fingers == [1, 0, 0, 0, 0]:  # Thumb up only
                        self.buttonPressed = True
                        self.previous_slide()
            
            # Reset button press after delay
            if self.buttonPressed:
                self.counter += 1
                if self.counter > self.delay:
                    self.counter = 0
                    self.buttonPressed = False
            
            # Display the image
            cv2.imshow("Presentation Controller", img)
            
            # Check for quit command
            key = cv2.waitKey(1)
            if key == ord('q'):
                break
        
        # Clean up
        self.cap.release()
        cv2.destroyAllWindows()
        print("Presentation controller closed")


if __name__ == "__main__":
    import argparse
    
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Control presentations with hand gestures')
    parser.add_argument('presentation_path', help='Path to the presentation file')
    args = parser.parse_args()
    
    # Check if xdotool is installed
    try:
        subprocess.run(['which', 'xdotool'], check=True, stdout=subprocess.PIPE)
    except subprocess.CalledProcessError:
        print("Error: xdotool is not installed. Please install it with:")
        print("sudo apt-get install xdotool")
        exit(1)
    
    # Check if the presentation file exists
    if not os.path.exists(args.presentation_path):
        print(f"Error: Presentation file '{args.presentation_path}' not found")
        exit(1)
    
    # Start the controller
    controller = PresentationController(args.presentation_path)
    controller.run()