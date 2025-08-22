import PyPDF2
import os

class PDFReader:
    """Class-based PDF reader to match the expected interface"""
    
    def extract_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"PDF file not found: {file_path}")
            
            reader = PyPDF2.PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return text.strip()
        except Exception as e:
            raise Exception(f"Error reading PDF: {str(e)}")

def extract_text_with_pages(file_path):
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
        
        reader = PyPDF2.PdfReader(file_path)
        pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            pages.append({"page": i+1, "text": text})
        return pages
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")
