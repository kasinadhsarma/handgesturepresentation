from pptx import Presentation
import pyautogui

class PresentationController:
    def __init__(self, file_path):
        self.prs = Presentation(file_path)
        self.current_slide = 0
        self.total_slides = len(self.prs.slides)
    
    def next_slide(self):
        if self.current_slide < self.total_slides - 1:
            self.current_slide += 1
            pyautogui.press('right')
            return f"Moved to slide {self.current_slide + 1}"
        return "At last slide"
    
    def prev_slide(self):
        if self.current_slide > 0:
            self.current_slide -= 1
            pyautogui.press('left')
            return f"Moved to slide {self.current_slide + 1}"
        return "At first slide"
    
    def first_slide(self):
        self.current_slide = 0
        pyautogui.hotkey('ctrl', 'f5')  # Restart presentation
        return "Moved to first slide"
    
    def last_slide(self):
        self.current_slide = self.total_slides - 1
        pyautogui.hotkey('ctrl', 'f5')
        for _ in range(self.current_slide):
            pyautogui.press('right')
        return "Moved to last slide"
    
    def stop(self):
        pyautogui.hotkey('esc')  # Exit presentation
        return "Presentation stopped"
    
    def get_current_slide(self):
        return self.current_slide