import os
import fitz  # PyMuPDF
from pptx import Presentation as PPTPresentation
import tempfile
import shutil

class PresentationController:
    """Controller class to handle presentation slides (supports both PowerPoint and PDF formats)"""
    def __init__(self, file_path):
        self.file_path = file_path
        self.current_slide = 0
        self.total_slides = 0
        self.slides_images = []
        self.is_pdf = file_path.lower().endswith(('.pdf'))
        self.is_ppt = file_path.lower().endswith(('.pptx', '.ppt'))
        self.slides_dir = tempfile.mkdtemp()
        
        if self.is_pdf:
            self._load_pdf()
        elif self.is_ppt:
            self._load_powerpoint()
        else:
            raise ValueError("Unsupported file format. Only PDF and PowerPoint files are supported.")
    
    def __del__(self):
        """Clean up temp directory when object is destroyed"""
        if hasattr(self, 'slides_dir') and os.path.exists(self.slides_dir):
            shutil.rmtree(self.slides_dir)
    
    def _load_pdf(self):
        """Load PDF and extract slides as images"""
        try:
            pdf_document = fitz.open(self.file_path)
            self.total_slides = len(pdf_document)
            
            # Extract each page as an image
            for i in range(self.total_slides):
                page = pdf_document.load_page(i)
                pix = page.get_pixmap()
                img_path = os.path.join(self.slides_dir, f"slide_{i}.png")
                pix.save(img_path)
                self.slides_images.append(img_path)
            
            print(f"Loaded PDF with {self.total_slides} pages")
        except Exception as e:
            raise Exception(f"Error loading PDF: {str(e)}")
    
    def _load_powerpoint(self):
        """Load PowerPoint and extract slides as images"""
        try:
            prs = PPTPresentation(self.file_path)
            self.total_slides = len(prs.slides)
            
            # For PowerPoint, we'll need to convert to PDF first for better rendering
            # This is a simplified version - in production, you'd want to use a library
            # that can directly render PowerPoint slides to images
            print(f"Loaded PowerPoint with {self.total_slides} slides")
        except Exception as e:
            raise Exception(f"Error loading PowerPoint: {str(e)}")
    
    def next_slide(self):
        """Move to the next slide"""
        if self.current_slide < self.total_slides - 1:
            self.current_slide += 1
            return f"Moved to slide {self.current_slide + 1} of {self.total_slides}"
        else:
            return "Already at the last slide"
    
    def prev_slide(self):
        """Move to the previous slide"""
        if self.current_slide > 0:
            self.current_slide -= 1
            return f"Moved to slide {self.current_slide + 1} of {self.total_slides}"
        else:
            return "Already at the first slide"
    
    def first_slide(self):
        """Move to the first slide"""
        self.current_slide = 0
        return f"Moved to first slide (1 of {self.total_slides})"
    
    def last_slide(self):
        """Move to the last slide"""
        self.current_slide = self.total_slides - 1
        return f"Moved to last slide ({self.total_slides} of {self.total_slides})"
    
    def get_current_slide(self):
        """Get the current slide index (0-based)"""
        return self.current_slide
    
    def get_current_slide_image(self):
        """Get the current slide as an image path"""
        if 0 <= self.current_slide < len(self.slides_images):
            return self.slides_images[self.current_slide]
        return None
    
    def stop(self):
        """Stop presentation (placeholder function)"""
        return "Presentation stopped"