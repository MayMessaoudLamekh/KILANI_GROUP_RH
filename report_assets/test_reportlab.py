from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.pdfgen import canvas
import sys

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_number(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_number(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColorHex("#64748B")
            self.drawRightString(A4[0] - 50, 30, f"Page {self._pageNumber} / {page_count}")
            self.drawString(50, 30, "Kilani HR App — Rapport de stage — May Messaoud Lamekh")
            self.setStrokeColorHex("#CBD5E1")
            self.setLineWidth(0.5)
            self.line(50, 42, A4[0] - 50, 42)
            # Header
            self.line(50, A4[1] - 45, A4[0] - 50, A4[1] - 45)
            self.drawString(50, A4[1] - 40, "Groupe Kilani | ESPRIT 2026")
            self.drawRightString(A4[0] - 50, A4[1] - 40, "Solution RH Mobile & Web")
            self.restoreState()

print("NumberedCanvas ready")
