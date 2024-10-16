import os
import io
from fastapi import UploadFile, HTTPException
import magic
from PyPDF2 import PdfReader
from docx import Document
import pandas as pd
from PIL import Image
import pytesseract

ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.doc', '.txt', '.rtf', '.xlsx', '.xls', '.csv', '.jpg', '.jpeg', '.png'}
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

def validate_file(file: UploadFile):
    # Check file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")

    # Check file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="File type not allowed")

    # Check file content type
    file_content = file.file.read(1024)  # Read first 1024 bytes
    file.file.seek(0)  # Reset file pointer
    mime = magic.Magic(mime=True)
    file_mime = mime.from_buffer(file_content)
    
    allowed_mimes = [
        'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'application/rtf', 'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv', 'image/jpeg', 'image/png'
    ]
    
    if file_mime not in allowed_mimes:
        raise HTTPException(status_code=400, detail="Invalid file content")

def extract_text(file: UploadFile) -> str:
    validate_file(file)
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext in ['.pdf']:
        return extract_text_from_pdf(file)
    elif file_ext in ['.docx', '.doc']:
        return extract_text_from_docx(file)
    elif file_ext in ['.txt', '.rtf']:
        return extract_text_from_txt(file)
    elif file_ext in ['.xlsx', '.xls', '.csv']:
        return extract_text_from_excel(file)
    elif file_ext in ['.jpg', '.jpeg', '.png']:
        return extract_text_from_image(file)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

def extract_text_from_pdf(file: UploadFile) -> str:
    pdf = PdfReader(file.file)
    text = ""
    for page in pdf.pages:
        text += page.extract_text() + "\n"
    return text

def extract_text_from_docx(file: UploadFile) -> str:
    doc = Document(file.file)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

def extract_text_from_txt(file: UploadFile) -> str:
    return file.file.read().decode('utf-8')

def extract_text_from_excel(file: UploadFile) -> str:
    df = pd.read_excel(file.file) if file.filename.endswith(('.xlsx', '.xls')) else pd.read_csv(file.file)
    return df.to_string()

def extract_text_from_image(file: UploadFile) -> str:
    image = Image.open(io.BytesIO(file.file.read()))
    return pytesseract.image_to_string(image)