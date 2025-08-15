import PyPDF2
import os

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
