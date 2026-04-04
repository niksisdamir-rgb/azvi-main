import os
from reportlab.pdfgen import canvas
from docx import Document

def create_pdf(path, content):
    c = canvas.Canvas(path)
    c.drawString(100, 750, content)
    c.save()
    print(f"Generated {path}")

def create_docx(path, content):
    doc = Document()
    doc.add_paragraph(content)
    doc.save(path)
    print(f"Generated {path}")

def main():
    os.makedirs("documents", exist_ok=True)
    
    # PDF sample
    pdf_text = "Antigravity supports multi-modal interactions. It can analyze images and listen to audio via deepseek's integrated vision models."
    create_pdf("documents/sample_vision.pdf", pdf_text)
    
    # DOCX sample
    docx_text = "For document parsing, Antigravity uses LangChain's PyPDFLoader and Docx2txtLoader to extract text from a variety of file formats."
    create_docx("documents/sample_loaders.docx", docx_text)

if __name__ == "__main__":
    main()
