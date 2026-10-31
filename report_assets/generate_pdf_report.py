import os
import shutil
from reportlab.lib.pagesizes import A4
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Image as RLImage, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas

# Palette
C_NAVY = colors.HexColor("#1E2B37")
C_GOLD = colors.HexColor("#B89B72")
C_DARK = colors.HexColor("#1E293B")
C_MUTED = colors.HexColor("#64748B")
C_LIGHT_BG = colors.HexColor("#F8FAFC")
C_BORDER = colors.HexColor("#E2E8F0")

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
            self.draw_page_decorations(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_decorations(self, page_count):
        if self._pageNumber > 1:
            self.saveState()
            self.setFont("Helvetica", 8)
            self.setFillColor(C_MUTED)
            # Header
            self.drawString(50, A4[1] - 38, "Groupe Kilani  |  ESPRIT — Ingénierie SIM")
            self.drawRightString(A4[0] - 50, A4[1] - 38, "Rapport de Stage — Kilani HR App")
            self.setStrokeColor(C_BORDER)
            self.setLineWidth(0.6)
            self.line(50, A4[1] - 44, A4[0] - 50, A4[1] - 44)
            # Footer
            self.line(50, 42, A4[0] - 50, 42)
            self.drawString(50, 30, "May Messaoud Lamekh  •  Tuteur : Amenallah  •  Année Universitaire 2026")
            self.drawRightString(A4[0] - 50, 30, f"{self._pageNumber} / {page_count}")
            self.restoreState()

out_pdf_path = "/Users/maymessaoud/kilani_hr_app/Rapport_de_Stage_Kilani_HR_May_Messaoud.pdf"
doc = SimpleDocTemplate(
    out_pdf_path,
    pagesize=A4,
    leftMargin=50,
    rightMargin=50,
    topMargin=54,
    bottomMargin=52
)

styles = getSampleStyleSheet()

# Custom Styles
title_style = ParagraphStyle(
    'CoverTitle',
    parent=styles['Normal'],
    fontName='Helvetica-Bold',
    fontSize=20,
    leading=26,
    textColor=C_NAVY,
    spaceAfter=10
)

subtitle_style = ParagraphStyle(
    'CoverSubtitle',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=11,
    leading=16,
    textColor=C_GOLD,
    spaceAfter=15
)

meta_style = ParagraphStyle(
    'CoverMeta',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9.5,
    leading=15,
    textColor=C_DARK
)

h1_style = ParagraphStyle(
    'Heading1_Custom',
    parent=styles['Heading1'],
    fontName='Helvetica-Bold',
    fontSize=15,
    leading=20,
    textColor=C_NAVY,
    spaceBefore=16,
    spaceAfter=8,
    keepWithNext=True
)

h2_style = ParagraphStyle(
    'Heading2_Custom',
    parent=styles['Heading2'],
    fontName='Helvetica-Bold',
    fontSize=11.5,
    leading=16,
    textColor=C_GOLD,
    spaceBefore=12,
    spaceAfter=6,
    keepWithNext=True
)

body_style = ParagraphStyle(
    'Body_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13.5,
    textColor=C_DARK,
    spaceAfter=6
)

bullet_style = ParagraphStyle(
    'Bullet_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=9,
    leading=13.5,
    textColor=C_DARK,
    leftIndent=15,
    firstLineIndent=-10,
    spaceAfter=4
)

caption_style = ParagraphStyle(
    'Caption_Custom',
    parent=styles['Normal'],
    fontName='Helvetica-Oblique',
    fontSize=7.5,
    leading=11,
    textColor=C_MUTED,
    alignment=1,
    spaceBefore=4,
    spaceAfter=8
)

callout_style = ParagraphStyle(
    'Callout_Custom',
    parent=styles['Normal'],
    fontName='Helvetica',
    fontSize=8.5,
    leading=12.5,
    textColor=C_DARK
)

story = []

# ==========================================
# 1. PAGE DE GARDE
# ==========================================
kilani_logo = "/Users/maymessaoud/kilani_hr_app/report_assets/page1_img_1.png"
esprit_logo = "/Users/maymessaoud/kilani_hr_app/report_assets/page1_img_2.png"

logo_data = [[]]
if os.path.exists(kilani_logo):
    logo_data[0].append(RLImage(kilani_logo, width=120, height=55))
else:
    logo_data[0].append(Paragraph("<b>KILANI GROUP</b>", body_style))

if os.path.exists(esprit_logo):
    logo_data[0].append(RLImage(esprit_logo, width=130, height=48))
else:
    logo_data[0].append(Paragraph("<b>ESPRIT</b>", body_style))

logo_table = Table(logo_data, colWidths=[240, 255])
logo_table.setStyle(TableStyle([
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (0, 0), (0, 0), 'LEFT'),
    ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
]))
story.append(logo_table)
story.append(Spacer(1, 35))

story.append(Paragraph("Rapport de stage d'immersion professionnelle :", ParagraphStyle('Tag', parent=body_style, fontName='Helvetica-Oblique', fontSize=10, textColor=C_MUTED)))
story.append(Spacer(1, 8))
story.append(Paragraph("Conception et développement d’une solution mobile et web de gestion des ressources humaines assistée par intelligence artificielle", title_style))
story.append(Paragraph("Cas d’étude : Plateforme Kilani HR — Dématérialisation des congés, des missions, génération automatisée d’attestations et assistant conversationnel RH", subtitle_style))
story.append(HRFlowable(width="100%", thickness=1.5, color=C_GOLD, spaceBefore=5, spaceAfter=25))

meta_text = """
<b>Étudiante :</b> May Messaoud Lamekh<br/>
<b>Établissement / Filière :</b> ESPRIT – Ingénierie en Systèmes d’Information Mobiles (SIM)<br/>
<b>Entreprise d’accueil :</b> Kilani Group (Siège Social Charguia, Tunis)<br/>
<b>Tuteur entreprise :</b> Amenallah<br/>
<b>Période de stage :</b> 06 juillet 2026 → 06 septembre 2026 (8 semaines)<br/>
<b>Contact académique :</b> may.messaoudlamekh@esprit.tn
"""
story.append(Paragraph(meta_text, meta_style))
story.append(PageBreak())

# ==========================================
# 2. SOMMAIRE
# ==========================================
story.append(Paragraph("Sommaire", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=12))

sommaire_items = [
    ("Introduction générale", "4"),
    ("1. Contexte du projet et cadre du stage", "5"),
    ("    1.1 Présentation de l’entreprise d’accueil", "5"),
    ("    1.2 Problématique et enjeux de la gestion des ressources humaines", "6"),
    ("    1.3 Objectifs du stage et périmètre de la mission", "7"),
    ("    1.4 Méthodologie de travail", "8"),
    ("2. Étude technique et choix d’architecture", "9"),
    ("    2.1 Architecture générale du système", "9"),
    ("    2.2 Choix technologiques et justifications", "10"),
    ("    2.3 Modélisation des données", "12"),
    ("    2.4 Authentification, sécurité et rôles", "14"),
    ("3. Fonctionnalités réalisées", "15"),
    ("    3.1 Authentification et gestion de profil utilisateur", "15"),
    ("    3.2 Gestion des demandes de congé", "17"),
    ("    3.3 Gestion des ordres de mission", "20"),
    ("    3.4 Demande et génération d’attestations administratives", "22"),
    ("    3.5 Assistant virtuel RH intelligent et conseils prédictifs", "24"),
    ("    3.6 Système de notifications temps réel et par courriel", "26"),
    ("    3.7 Espace d’administration et pilotage RH (Back-office)", "27"),
    ("    3.8 Expérience utilisateur, charte graphique et ergonomie", "30"),
    ("4. Difficultés rencontrées et solutions apportées", "31"),
    ("    4.1 Cohérence transactionnelle et calcul des soldes de congés", "31"),
    ("    4.2 Génération dynamique des attestations PDF personnalisées", "32"),
    ("    4.3 Intégration de l’agent conversationnel IA et latence", "33"),
    ("    4.4 Sécurité, contrôle d’accès (RBAC) et traçabilité des validations", "34"),
    ("    4.5 Contraintes de développement full-stack et gestion du calendrier en solo", "34"),
    ("    4.6 Fiabilité de l’envoi des e-mails transactionnels", "35"),
    ("5. Qualité, intégration continue et déploiement", "36"),
    ("    5.1 Stratégie de tests et validation", "36"),
    ("    5.2 Documentation interactive de l’API (OpenAPI / Swagger)", "37"),
    ("    5.3 Conteneurisation et environnement de déploiement", "38"),
    ("6. Bilan et perspectives", "39"),
    ("    6.1 Compétences acquises", "39"),
    ("    6.2 Couverture du cahier des charges", "40"),
    ("    6.3 Écarts par rapport au plan prévisionnel", "43"),
    ("    6.4 Perspectives d’évolution", "44"),
    ("Conclusion générale", "45"),
    ("Annexes", "46"),
    ("    Annexe A — Index des captures d’écran", "46"),
    ("    Annexe B — Index des diagrammes", "48"),
    ("    Annexe C — Glossaire technique et métier", "49")
]

for title, page_no in sommaire_items:
    is_main = not title.startswith("    ")
    dots = ". " * max(5, int((70 - len(title)) / 2))
    p_text = f"<b>{title}</b>" if is_main else title
    row_text = f"<font color='{'#1E2B37' if is_main else '#1E293B'}'>{p_text}</font> <font color='#CBD5E1'>{dots}</font> <b><font color='{'#B89B72' if is_main else '#64748B'}'>{page_no}</font></b>"
    story.append(Paragraph(row_text, ParagraphStyle('SommaireRow', parent=body_style, fontSize=8.5, leading=12.5, spaceAfter=2.5)))

story.append(PageBreak())

# ==========================================
# 3. INTRODUCTION GÉNÉRALE
# ==========================================
story.append(Paragraph("Introduction générale", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=10))

intro_p1 = "Le présent rapport rend compte des huit semaines de stage professionnel effectuées au sein du Groupe Kilani, dédiées à la conception et au développement complet d'une solution numérique unifiée de gestion des ressources humaines, intitulée <b>Kilani HR App</b>."
intro_p2 = "Dans un groupe multisectoriel employant plus de 1 800 salariés répartis sur de nombreux sites industriels et administratifs, le traitement manuel des requêtes d'absence, des ordres de mission et des attestations entraînait des ralentissements significatifs, des risques d'erreurs dans le décompte des soldes et une surcharge de travail constante pour le département RH."
intro_p3 = "Pour répondre à ces enjeux, notre mission a consisté à concevoir et développer en autonomie un écosystème logiciel full-stack complet :"
story.append(Paragraph(intro_p1, body_style))
story.append(Paragraph(intro_p2, body_style))
story.append(Paragraph(intro_p3, body_style))

bullets_intro = [
    "<b>Une application mobile multiplateforme (Flutter / Dart) :</b> dédiée aux employés et aux managers pour la soumission rapide, le suivi des statuts en temps réel et la validation en mobilité ;",
    "<b>Un portail web d'administration RH (React 19 / Vite / Recharts) :</b> offrant aux gestionnaires une vue consolidée, des tableaux de bord dynamiques et des outils d'export ;",
    "<b>Une API RESTful sécurisée (Node.js / Express) :</b> adossée au SGBD relationnel <b>Microsoft SQL Server (KilaniHRDB)</b> pour garantir l'intégrité transactionnelle des soldes ;",
    "<b>Un moteur de génération documentaire dynamique (PDFKit) :</b> permettant l'émission instantanée d'attestations et d'ordres de mission officiels munis du cachet de l'entreprise ;",
    "<b>Un assistant virtuel conversationnel basé sur l'IA (Google Gemini 2.21) :</b> capable de répondre en langage naturel aux requêtes RH des salariés et de vérifier la recevabilité de leurs demandes."
]
for b in bullets_intro:
    story.append(Paragraph(f"• {b}", bullet_style))

story.append(Spacer(1, 8))
story.append(Paragraph("Le projet a été conduit de bout en bout selon une méthode agile par tranches verticales livrables. Le rapport est découpé en six chapitres : le contexte et le cadre du stage (1), l'étude technique et les choix architecturaux (2), le détail des fonctionnalités réalisées (3), les difficultés rencontrées et leurs solutions (4), la démarche qualité et déploiement (5), et enfin le bilan personnel et les perspectives (6).", body_style))

story.append(PageBreak())

# Helper for Callout Table
def create_callout_table(title, text):
    content = [
        [Paragraph(f"<b>📌 {title} :</b> {text}", callout_style)]
    ]
    t = Table(content, colWidths=[495])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), C_LIGHT_BG),
        ('LINELEFT', (0, 0), (0, -1), 3.5, C_GOLD),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    return t

# ==========================================
# 4. CHAPITRE 1 : CONTEXTE DU PROJET
# ==========================================
story.append(Paragraph("1. Contexte du projet et cadre du stage", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("<i>Pourquoi ce projet existe, les limites des circuits antérieurs, les objectifs assignés et le découpage méthodologique du travail en huit semaines.</i>", body_style))

story.append(Paragraph("1.1 Présentation de l’entreprise d’accueil", h2_style))
story.append(Paragraph("Le Groupe Kilani est un groupe familial et industriel tunisien de premier plan, dont les origines remontent à 1947. Structuré autour de plusieurs filiales prestigieuses, le groupe intervient dans des secteurs stratégiques variés :", body_style))
story.append(Paragraph("• <b>Santé & Industrie Pharmaceutique :</b> laboratoires Adwya, fabrication et conditionnement de principes actifs et spécialités médicales ;", bullet_style))
story.append(Paragraph("• <b>Beauté, Cosmétique & Distribution :</b> chaînes de parfumeries, réseaux de distribution sélective et officinale ;", bullet_style))
story.append(Paragraph("• <b>Commerce spécialisé & Logistique :</b> plateformes d'approvisionnement desservant l'ensemble des gouvernorats de la Tunisie.", bullet_style))
story.append(Paragraph("Avec plus de 1 800 salariés répartis entre le siège social de la Charguia à Tunis et diverses unités régionales, Kilani Group a fait de la digitalisation de son fonctionnement interne une priorité stratégique, afin d'optimiser l'expérience collaborateur et d'éliminer les lourdeurs de gestion.", body_style))

story.append(Paragraph("1.2 Problématique et enjeux de la gestion des ressources humaines", h2_style))
story.append(Paragraph("Avant le déploiement de Kilani HR, la coordination des démarches de ressources humaines reposait sur un fonctionnement essentiellement manuel et fragmenté :", body_style))
story.append(Paragraph("• <b>Lenteur des circuits de validation :</b> Les fiches d'absence physiques devaient être transmises de la main à la main au responsable direct, puis expédiées au service RH. En cas de déplacement d'un signataire, les demandes restaient bloquées sans traçabilité.", bullet_style))
story.append(Paragraph("• <b>Complexité du décompte des soldes :</b> Entre congés annuels payés déductibles, congés pour événements familiaux non déductibles et autorisations d'absence partielles (demi-journées, quarts de journée), le calcul manuel du solde présentait un risque fréquent d'erreur et de litige.", bullet_style))
story.append(Paragraph("• <b>Charge bureaucratique sur les attestations :</b> L'édition répétitive d'attestations de travail, de salaire ou de présence accaparait le temps des gestionnaires RH au détriment de l'accompagnement humain.", bullet_style))
story.append(Paragraph("• <b>Sollicitations incessantes pour des questions récurrentes :</b> Les collaborateurs interrompaient fréquemment les équipes RH pour connaître leur solde ou le règlement interne, faute d'un canal d'accès direct et automatisé.", bullet_style))

story.append(Paragraph("1.3 Objectifs du stage et périmètre de la mission", h2_style))
story.append(Paragraph("La mission confiée couvrait la totalité de la chaîne d'ingénierie logicielle :", body_style))
story.append(Paragraph("• Concevoir le modèle de données relationnel et développer l'API RESTful sous Node.js / Express avec persistance SQL Server (KilaniHRDB) ;", bullet_style))
story.append(Paragraph("• Développer l'application mobile Flutter (Android/iOS) pour les salariés et les managers ;", bullet_style))
story.append(Paragraph("• Développer le portail web d'administration en React 19 pour les gestionnaires RH et administrateurs ;", bullet_style))
story.append(Paragraph("• Intégrer un assistant virtuel conversationnel basé sur Google Gemini AI 2.21 avec vérification prédictive des demandes ;", bullet_style))
story.append(Paragraph("• Automatiser la génération vectorielle de PDF administratifs avec PDFKit et les alertes e-mails avec Nodemailer.", bullet_style))

story.append(Spacer(1, 4))
story.append(create_callout_table("Périmètre et cibles ultérieures", "Ont été reportées en phase ultérieure : l'interconnexion bidirectionnelle directe avec l'ERP Sage X3 / SAP de Kilani Group et les notifications push natives Firebase Cloud Messaging (FCM), palliées avec succès par les alertes e-mails complètes."))
story.append(Spacer(1, 4))

story.append(Paragraph("1.4 Méthodologie de travail", h2_style))
story.append(Paragraph("Le projet a été exécuté en autonomie selon une démarche agile rythmée par des tranches verticales hebdomadaires, où chaque fonctionnalité était livrée de manière intégrée (SGBD, API, mobile et web) :", body_style))

plan_headers = ["Semaine", "Jalon Métier", "Composants & Fonctionnalités Livrés"]
plan_data = [
    ["Semaine 1", "Socle & Authentification", "Base SQL Server, API Express, authentification JWT, hash SHA256, login mobile et web."],
    ["Semaine 2", "Congés (Saisie & Calculs)", "CRUD Motifs, saisie mobile (jour/demi/quart), calcul auto jours/heures, déduction du solde."],
    ["Semaine 3", "Validation des congés", "Double validation (N+1 et RH), logique de recrédit transactionnel en cas de rejet/annulation."],
    ["Semaine 4", "Missions professionnelles", "Demandes de mission, trajets, transport, validation et génération PDF de l'ordre de mission."],
    ["Semaine 5", "Attestations administratives", "Types d'attestations dynamiques (JSON), moteur de génération automatique PDF avec PDFKit."],
    ["Semaine 6", "Assistant RH Intelligent (IA)", "Intégration Google Gemini 2.21, prompt contextualisé, persistance AiChats et AiMessages."],
    ["Semaine 7", "Back-Office d'administration", "Dashboard React 19, graphiques Recharts, gestion des collaborateurs et soldes, exports Excel/PDF."],
    ["Semaine 8", "Notifications & Déploiement", "Service e-mail Nodemailer, tests de charge, Swagger UI (/api-docs), Docker Compose."]
]
t_plan = Table([[Paragraph(f"<b>{c}</b>", body_style) for c in plan_headers]] + [[Paragraph(str(c), body_style) for c in row] for row in plan_data], colWidths=[65, 130, 300])
t_plan.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT_BG])
]))
story.append(t_plan)

story.append(PageBreak())

# ==========================================
# 5. CHAPITRE 2 : ÉTUDE TECHNIQUE ET ARCHITECTURE
# ==========================================
story.append(Paragraph("2. Étude technique et choix d’architecture", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("<i>L'architecture globale retenue, les justifications des technologies sélectionnées, la modélisation de la base de données et le schéma d'authentification et de sécurité RBAC.</i>", body_style))

story.append(Paragraph("2.1 Architecture générale du système", h2_style))
story.append(Paragraph("La solution Kilani HR suit une architecture 3-tiers découplée centrée sur une API RESTful unifiée :", body_style))
story.append(Paragraph("• <b>Couche Présentation :</b> Deux clients distincts consomment l'API : l'application mobile Flutter pour les salariés et managers en déplacement, et le portail web React 19 pour les gestionnaires RH et administrateurs ;", bullet_style))
story.append(Paragraph("• <b>Couche Logique Métier (API Gateway) :</b> Développée sous Node.js / Express, elle centralise les règles d'intégrité, orchestre la génération PDF avec PDFKit, dispatche les courriels et dialogue avec le service d'IA ;", bullet_style))
story.append(Paragraph("• <b>Couche Données & Services Tiers :</b> Instance Microsoft SQL Server (KilaniHRDB) pour les transactions, couplée au service d'inférence Google Gemini 2.21 dans le cloud.", bullet_style))

fig_arch = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_2_1_architecture.png"
if os.path.exists(fig_arch):
    story.append(RLImage(fig_arch, width=480, height=270))
    story.append(Paragraph("Figure 2.1 — Architecture générale du système Kilani HR : interactions entre les clients, l'API Express, SQL Server et les services externes (Gemini AI et SMTP).", caption_style))

story.append(Paragraph("2.2 Choix technologiques et justifications", h2_style))
tech_headers = ["Brique", "Technologie", "Justification technique"]
tech_data = [
    ["Client Mobile", "Flutter (Dart 3.5)", "Multiplateforme natif performant (iOS/Android), code unique, fidélité absolue à la charte Kilani."],
    ["Back-Office Web", "React 19 + Vite", "Productivité SPA maximale, réactivité de l'interface, riche écosystème avec Recharts."],
    ["API Backend", "Node.js + Express 4", "E/S asynchrones non-bloquantes, intégration aisée des bibliothèques métier (@google/genai, pdfkit)."],
    ["Base de Données", "Microsoft SQL Server", "Aligné sur le standard d'infrastructure Kilani Group, garantit les transactions ACID des soldes."],
    ["Authentification", "JWT (jsonwebtoken)", "Authentification stateless sans session serveur, idéal pour le passage à l'échelle."],
    ["Génération PDF", "PDFKit", "Génération vectorielle programmatique directe, maîtrise totale du cachet officiel et de la mise en page."],
    ["Intelligence Artificielle", "Google Gemini 2.21", "Modèle de pointe pour la compréhension du langage naturel en français et la logique RH."],
    ["Notifications", "Nodemailer (SMTP)", "Messagerie robuste pour l'expédition asynchrone des notifications e-mails transactionnelles."]
]
t_tech = Table([[Paragraph(f"<b>{c}</b>", body_style) for c in tech_headers]] + [[Paragraph(str(c), body_style) for c in row] for row in tech_data], colWidths=[95, 120, 280])
t_tech.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 3.5),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3.5),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT_BG])
]))
story.append(t_tech)

story.append(PageBreak())

story.append(Paragraph("2.3 Modélisation des données", h2_style))
story.append(Paragraph("La base de données relationnelle <b>KilaniHRDB</b> est organisée en huit tables interdépendantes assurant la cohérence de l'ensemble des processus :", body_style))
story.append(Paragraph("• <b>Utilisateurs :</b> Identifiés par le matricule (PK). Contient le rôle (Employé, Responsable Hiérarchique, Ressources Humaines, Administrateur), les coordonnées, le hash de passe, le Solde_Conge courant et le Droit_Mensuel (1.75j par défaut), avec clé étrangère vers le supérieur direct ;", bullet_style))
story.append(Paragraph("• <b>Motifs_Conge :</b> Référentiel des absences (libelle, nombre_max_jours, impact_solde, validation_hierarchique_obligatoire) ;", bullet_style))
story.append(Paragraph("• <b>Conges :</b> Demandes d'absence avec type_conge (Journée, Demi-journée, Quart de journée), dates, heures, calcul auto jours/heures, pièces jointes et double acceptation N+1 et RH ;", bullet_style))
story.append(Paragraph("• <b>Missions :</b> Déplacements avec objet, destination, transport, dates/heures et URL du PDF généré ;", bullet_style))
story.append(Paragraph("• <b>Types_Attestation & Attestations :</b> Types avec schéma JSON de champs complémentaires et demandes avec URL du PDF officiel signé ;", bullet_style))
story.append(Paragraph("• <b>AiChats & AiMessages :</b> Persistance des sessions conversationnelles avec l'assistant IA Gemini.", bullet_style))

fig_data = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_2_2_data_model.png"
if os.path.exists(fig_data):
    story.append(RLImage(fig_data, width=480, height=330))
    story.append(Paragraph("Figure 2.2 — Modèle Conceptuel et Entités-Associations de la base de données relationnelle KilaniHRDB sous SQL Server.", caption_style))

story.append(Paragraph("2.4 Authentification, sécurité et rôles", h2_style))
story.append(Paragraph("La sécurité repose sur un modèle d'habilitation RBAC rigoureux et le standard JWT :", body_style))
story.append(Paragraph("• À la connexion (POST /api/auth/login), le mot de passe est vérifié contre son empreinte SHA256. Un jeton JWT chiffré contenant matricule et rôle est généré pour 24 heures ;", bullet_style))
story.append(Paragraph("• Les middlewares authenticateToken, requireRH et requireAdmin contrôlent les accès et vérifient que les requêtes ne ciblent que les données autorisées (cloisonnement strict anti-IDOR).", bullet_style))

fig_seq_auth = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_2_sequence_auth.png"
if os.path.exists(fig_seq_auth):
    story.append(RLImage(fig_seq_auth, width=470, height=270))
    story.append(Paragraph("Figure 2.3 — Diagramme de séquence de l'authentification par jeton JWT et vérification des privilèges RBAC.", caption_style))

story.append(PageBreak())

# ==========================================
# 6. CHAPITRE 3 : FONCTIONNALITÉS RÉALISÉES
# ==========================================
story.append(Paragraph("3. Fonctionnalités réalisées", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("<i>Vue d’ensemble des acteurs et détail de chaque fonctionnalité livrée, illustrée par les captures d’écran de l’application.</i>", body_style))

fig_uc = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_1_use_case.png"
if os.path.exists(fig_uc):
    story.append(RLImage(fig_uc, width=480, height=310))
    story.append(Paragraph("Figure 3.1 — Diagramme global des cas d'utilisation illustrant les interactions des quatre acteurs avec la plateforme Kilani HR.", caption_style))

story.append(Paragraph("3.1 Authentification et gestion de profil utilisateur", h2_style))
story.append(Paragraph("L'application mobile accueille l'utilisateur sur une interface soignée reprenant la charte Kilani. Après saisie du matricule et du mot de passe, le collaborateur accède à son tableau de bord affichant son solde en temps réel et des raccourcis d'actions rapides.", body_style))

# Mobile Screenshots side by side
sc_01 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_01_login_mobile.png"
sc_02 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_02_dashboard_mobile.png"
sc_row1 = []
if os.path.exists(sc_01):
    sc_row1.append(RLImage(sc_01, width=175, height=310))
if os.path.exists(sc_02):
    sc_row1.append(RLImage(sc_02, width=175, height=310))

if len(sc_row1) == 2:
    t_sc1 = Table([sc_row1], colWidths=[245, 250])
    t_sc1.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
    story.append(t_sc1)
    story.append(Paragraph("Capture d'écran n°1 — Écran d'authentification mobile.   |   Capture d'écran n°2 — Tableau de bord mobile collaborateur.", caption_style))

story.append(PageBreak())

story.append(Paragraph("3.2 Gestion des demandes de congé", h2_style))
story.append(Paragraph("Le collaborateur sélectionne le motif, la typologie (Journée, Demi-journée, Quart de journée), les dates et horaires. Le système calcule automatiquement la durée en jours et en heures, vérifie la suffisance du solde et projette le solde restant. La demande suit un workflow à double validation (Supérieur N+1 puis RH).", body_style))

sc_03 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_03_create_leave.png"
sc_06 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_06_leave_list.png"
sc_row2 = []
if os.path.exists(sc_03):
    sc_row2.append(RLImage(sc_03, width=175, height=310))
if os.path.exists(sc_06):
    sc_row2.append(RLImage(sc_06, width=175, height=310))

if len(sc_row2) == 2:
    t_sc2 = Table([sc_row2], colWidths=[245, 250])
    t_sc2.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
    story.append(t_sc2)
    story.append(Paragraph("Capture d'écran n°3 — Saisie d'une demande de congé.   |   Capture d'écran n°4 — Historique et état des demandes.", caption_style))

fig_conge_life = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_3_lifecycle_conge.png"
if os.path.exists(fig_conge_life):
    story.append(RLImage(fig_conge_life, width=470, height=270))
    story.append(Paragraph("Figure 3.2 — Machine à états et cycle de vie d'une demande de congé au sein de Kilani HR.", caption_style))

story.append(PageBreak())

story.append(Paragraph("3.3 Gestion des ordres de mission", h2_style))
story.append(Paragraph("Le salarié formule sa demande de déplacement en précisant l'objet, la ville de destination, le mode de transport (voiture de service, personnelle, bus) et les plages horaires. Après validation managériale et RH, l'Ordre de Mission officiel est généré en PDF téléchargeable.", body_style))

story.append(Paragraph("3.4 Demande et génération d’attestations administratives", h2_style))
story.append(Paragraph("Ce module propose un catalogue dynamique (travail, salaire, fiche de paie, présence). Des champs spécifiques (destinataire, mois/année) sont saisis par l'employé. Dès validation, PDFKit produit un document officiel avec en-tête Kilani Group, cachet et signature.", body_style))

sc_07 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_07_create_mission.png"
sc_08 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_08_create_attestation.png"
sc_row3 = []
if os.path.exists(sc_07):
    sc_row3.append(RLImage(sc_07, width=175, height=310))
if os.path.exists(sc_08):
    sc_row3.append(RLImage(sc_08, width=175, height=310))

if len(sc_row3) == 2:
    t_sc3 = Table([sc_row3], colWidths=[245, 250])
    t_sc3.setStyle(TableStyle([('ALIGN', (0,0), (-1,-1), 'CENTER')]))
    story.append(t_sc3)
    story.append(Paragraph("Capture d'écran n°5 — Demande d'ordre de mission.   |   Capture d'écran n°6 — Demande dynamique d'attestation.", caption_style))

sc_09 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_09_attestation_pdf.png"
if os.path.exists(sc_09):
    story.append(RLImage(sc_09, width=280, height=340))
    story.append(Paragraph("Capture d’écran n°7 — Exemple d'attestation officielle de salaire produite au format PDF par PDFKit.", caption_style))

story.append(PageBreak())

story.append(Paragraph("3.5 Assistant virtuel RH intelligent et conseils prédictifs", h2_style))
story.append(Paragraph("Intégré nativement dans l'application mobile via le SDK @google/genai, l'assistant répond aux questions des salariés sur leur solde, leurs droits et les politiques Kilani Group. Une fonction prédictive (/api/ai/verify-leave) analyse également la viabilité d'une demande avant son dépôt.", body_style))

sc_04 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_04_ai_assistant.png"
fig_seq_ai = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_6_sequence_ai.png"

ai_row = []
if os.path.exists(sc_04):
    ai_row.append(RLImage(sc_04, width=170, height=305))
if os.path.exists(fig_seq_ai):
    ai_row.append(RLImage(fig_seq_ai, width=310, height=210))

if len(ai_row) == 2:
    t_ai = Table([ai_row], colWidths=[185, 310])
    t_ai.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (0,0), (-1,-1), 'CENTER')
    ]))
    story.append(t_ai)
    story.append(Paragraph("Capture d'écran n°8 — Discussion avec l'assistant IA Gemini.   |   Figure 3.3 — Diagramme de séquence de l'orchestration IA.", caption_style))

story.append(Paragraph("3.6 Système de notifications temps réel et par courriel", h2_style))
story.append(Paragraph("Le service Nodemailer dispatche automatiquement des e-mails HTML professionnels lors de la création d'une demande, des validations N+1 et RH, des refus motivés et de la mise à disposition des documents PDF officiels.", body_style))

story.append(Paragraph("3.7 Espace d’administration et pilotage RH (Back-office)", h2_style))
story.append(Paragraph("Développé en React 19 avec Vite et Recharts, le back-office permet aux gestionnaires RH de piloter l'activité : indicateurs clés, graphiques interactifs des motifs de congés, CRUD des collaborateurs, validation unitaire ou groupée et exports de données en un clic (Excel .xlsx et PDF).", body_style))

sc_05 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_05_backoffice_dashboard.png"
if os.path.exists(sc_05):
    story.append(RLImage(sc_05, width=480, height=280))
    story.append(Paragraph("Capture d’écran n°9 — Vue générale du tableau de bord d'administration RH avec graphiques Recharts et indicateurs.", caption_style))

story.append(Paragraph("3.8 Expérience utilisateur, charte graphique et ergonomie", h2_style))
story.append(Paragraph("L'ensemble des interfaces reflète l'identité corporative du Groupe Kilani : Bleu Nuit Deep Slate (#1E2B37), Or Bronze (#B89B72) et police Google Fonts Outfit, respectant les normes d'accessibilité et les directives Material Design 3.", body_style))

story.append(PageBreak())

# ==========================================
# 7. CHAPITRE 4 : DIFFICULTÉS ET SOLUTIONS
# ==========================================
story.append(Paragraph("4. Difficultés rencontrées et solutions apportées", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("<i>Les six problématiques techniques et algorithmiques majeures rencontrées au cours du développement et les réponses concrètes apportées.</i>", body_style))

story.append(Paragraph("4.1 Cohérence transactionnelle et calcul des soldes de congés", h2_style))
story.append(Paragraph("<b>Problème :</b> Risque d'incohérence si le solde était débité avant la validation RH finale et que le dossier était refusé, ou lors d'annulations de congés par le salarié. De plus, la gestion des fractions de jours (0.5j / 0.25j) risquait d'engendrer des erreurs d'arrondi.", body_style))
story.append(Paragraph("<b>Solution :</b> Déduction conditionnée à la validation RH finale, mise en place d'un recrédit transactionnel automatique en cas de refus RH ultérieur ou d'annulation (/api/conges/annuler), et utilisation stricte du type SQL DECIMAL(5,2).", body_style))

fig_tx = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_4_1_transaction_solde.png"
if os.path.exists(fig_tx):
    story.append(RLImage(fig_tx, width=470, height=265))
    story.append(Paragraph("Figure 4.1 — Préservation de la cohérence du solde et mécanismes de recrédit transactionnel.", caption_style))

story.append(Paragraph("4.2 Génération dynamique des attestations PDF personnalisées", h2_style))
story.append(Paragraph("<b>Problème :</b> Générer des documents vectoriels normalisés tout en gérant une variabilité de métadonnées selon le type d'attestation.<br/><b>Solution :</b> Schémas de formulaires stockés en JSON dans Types_Attestation et moteur de rendu dynamique modulaire avec PDFKit.", body_style))

story.append(Paragraph("4.3 Intégration de l’agent conversationnel IA et latence", h2_style))
story.append(Paragraph("<b>Problème :</b> Prévenir les hallucinations de l'IA sur les soldes et gérer les temps de réponse de l'inférence externe.<br/><b>Solution :</b> Injection des données chiffrées exactes du collaborateur dans le prompt système strict et indicateurs de chargement interactifs côté Flutter.", body_style))

story.append(Paragraph("4.4 Sécurité, contrôle d’accès (RBAC) et traçabilité des validations", h2_style))
story.append(Paragraph("<b>Problème :</b> Éviter qu'un salarié ne valide sa propre demande ou n'accède aux fiches d'autrui.<br/><b>Solution :</b> Vérification systématique côté serveur via le jeton JWT, contrôle de la relation hiérarchique et enregistrement de l'approbateur et de la date.", body_style))

story.append(Paragraph("4.5 Contraintes de développement full-stack et gestion du calendrier en solo", h2_style))
story.append(Paragraph("<b>Problème :</b> Développer seul la base, l'API, le mobile et le web en huit semaines.<br/><b>Solution :</b> Démarche en tranches verticales et factorisation de composants web et mobile réutilisables.", body_style))

story.append(Paragraph("4.6 Fiabilité de l’envoi des e-mails transactionnels", h2_style))
story.append(Paragraph("<b>Problème :</b> Éviter que les latences du serveur SMTP ne bloquent les réponses HTTP de l'API.<br/><b>Solution :</b> Exécution asynchrone découplée du retour utilisateur avec capture et journalisation des erreurs.", body_style))

story.append(PageBreak())

# ==========================================
# 8. CHAPITRE 5 : QUALITÉ ET DÉPLOIEMENT
# ==========================================
story.append(Paragraph("5. Qualité, intégration continue et déploiement", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("<i>Vérification de la fiabilité du code, documentation OpenAPI de l'API et stratégie de déploiement conteneurisé.</i>", body_style))

story.append(Paragraph("5.1 Stratégie de tests et validation", h2_style))
story.append(Paragraph("Une politique de tests rigoureuse a été menée : validation des contraintes d'intégrité relationnelles dans SQL Server, tests d'API sur les cas limites (solde insuffisant ➔ erreur 400, accès non autorisé ➔ 403) et validation des formulaires et de la persistance locale sur Flutter.", body_style))

story.append(Paragraph("5.2 Documentation interactive de l’API (OpenAPI / Swagger)", h2_style))
story.append(Paragraph("L'API intègre la spécification OpenAPI v3 via swagger-ui-express, accessible sur http://localhost:5050/api-docs pour documenter et tester l'ensemble des points d'entrée de manière interactive avec injection du jeton Bearer JWT.", body_style))

sc_10 = "/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_10_swagger_api.png"
if os.path.exists(sc_10):
    story.append(RLImage(sc_10, width=480, height=270))
    story.append(Paragraph("Capture d’écran n°10 — Documentation interactive de l'API REST Kilani HR sous Swagger UI.", caption_style))

story.append(Paragraph("5.3 Conteneurisation et environnement de déploiement", h2_style))
story.append(Paragraph("L'architecture a été packagée sous Docker Compose (service base de données Microsoft SQL Server 2022 Linux avec volume persistant, conteneur Node.js Alpine pour l'API et bundle Nginx pour le portail React 19).", body_style))

fig_dep = "/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_5_1_deployment.png"
if os.path.exists(fig_dep):
    story.append(RLImage(fig_dep, width=470, height=270))
    story.append(Paragraph("Figure 5.1 — Diagramme de déploiement de l'environnement Kilani HR conteneurisé sous Docker.", caption_style))

story.append(PageBreak())

# ==========================================
# 9. CHAPITRE 6 : BILAN ET PERSPECTIVES
# ==========================================
story.append(Paragraph("6. Bilan et perspectives", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("<i>Compétences développées, confrontation exhaustive avec le cahier des charges et perspectives d'évolution.</i>", body_style))

story.append(Paragraph("6.1 Compétences acquises", h2_style))
story.append(Paragraph("Ce stage m'a permis d'acquérir une vision complète du cycle d'ingénierie logicielle : maîtrise full-stack (Flutter, React 19, Node.js), modélisation relationnelle avancée sous SQL Server, intégration d'IA générative en contexte d'entreprise et gestion rigoureuse d'un calendrier de développement en autonomie.", body_style))

story.append(Paragraph("6.2 Couverture du cahier des charges", h2_style))
story.append(Paragraph("Le tableau ci-dessous confronte chaque exigence du cahier des charges officiel de Kilani Group à l'état réel du système livré :", body_style))

cdc_headers = ["Section CDC", "Exigence du Cahier des Charges", "Statut", "Commentaire & État Réel d'Implémentation"]
cdc_data = [
    ["1. Objet", "App mobile Android/iOS + BackOffice Web (Congés, Missions, Attestations)", "Réalisé", "Application mobile Flutter opérationnelle, Back-Office React 19 complet, API REST Express."],
    ["2. Utilisateurs", "Auth sécurisée, profil, CRUD, affectation N+1, 4 rôles RBAC", "Réalisé", "Authentification JWT, gestion des profils, 4 rôles (Employé, N+1, RH, Admin) cloisonnés."],
    ["3. Congés (Param)", "CRUD Motifs avec libellé, max jours, impact solde, validation", "Réalisé", "Table Motifs_Conge paramétrable dans le BackOffice avec impact_solde et plafonds."],
    ["3. Congés (Demande)", "Saisie motif, jour/demi/quart, dates, heures, calcul auto jours/heures", "Réalisé", "Formulaire mobile avec calcul en direct des jours/heures, simulation solde et pièce jointe."],
    ["3. Congés (Règles)", "Blocage si solde insuffisant, contrôle plafonds, non-déduction si sans impact", "Réalisé", "Contrôles stricts côté client et serveur, rejet automatique si solde insuffisant."],
    ["3. Congés (Workflow)", "Workflow employé ➔ N+1 ➔ RH, notifications, mise à jour auto solde", "Réalisé", "Double validation N+1 et RH, notifications e-mails automatiques, mise à jour sécurisée."],
    ["3. Congés (Solde)", "Solde actuel, droit mensuel (+1.75j), ajout mensuel automatique", "Réalisé", "Colonnes Solde_Conge et Droit_Mensuel en base, routine de crédit mensuel dans l'API."],
    ["4. Missions", "Demande avec objet, destination, transport, double validation, PDF", "Réalisé", "Module complet, formulaire mobile, workflow et génération d'ordre de mission PDF."],
    ["5. Attestations", "CRUD types d'attestation, champs personnalisés JSON, PDF officiel", "Réalisé", "Champs configurables dynamiquement, formulaires adaptatifs et génération PDF signée."],
    ["6. BackOffice (Admin)", "CRUD employés, gestion supérieurs, droits, motifs, types", "Réalisé", "Pages dédiées dans React 19 pour la gestion du personnel, des motifs et configurations."],
    ["6. BackOffice (Stats)", "Extraction Excel (.xlsx) et PDF des états consolidés", "Réalisé", "Intégration d'exportUtils.js générant des fichiers Excel et PDF téléchargeables."],
    ["7. Notifications", "Envoi auto d'e-mails lors de la création, validation, refus, génération", "Réalisé", "Service Nodemailer configuré sur tous les événements clés avec modèles HTML soignés."],
    ["8. Sécurité", "Auth sécurisée, rôles RBAC, audit, chiffrement des mots de passe", "Réalisé", "Hachage SHA-256, jetons JWT, traçabilité des validations avec horodatage et approbateur."],
    ["IA - Assistant RH", "Assistant conversationnel en langage naturel consultant les soldes (⭐⭐⭐⭐⭐)", "Réalisé", "Intégration de Google Gemini 2.21 avec injection du contexte RH et mémoire de discussion."],
    ["IA - Vérification", "Vérification intelligente prédictive des demandes avant envoi (⭐⭐⭐⭐)", "Réalisé", "Route /api/ai/verify-leave fournissant une recommandation prédictive sur la recevabilité."]
]
t_cdc = Table([[Paragraph(f"<b>{c}</b>", body_style) for c in cdc_headers]] + [[Paragraph(str(c), body_style) for c in row] for row in cdc_data], colWidths=[75, 140, 55, 225])
t_cdc.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT_BG])
]))
story.append(t_cdc)

story.append(Paragraph("6.3 Écarts par rapport au plan prévisionnel", h2_style))
story.append(Paragraph("Les alertes e-mails ont été privilégiées par rapport aux notifications push natives pour assurer une réception universelle sans friction d'autorisation sur mobile. De plus, la synchronisation directe avec l'ERP Sage X3 a été planifiée en phase 2 pour se concentrer sur l'ergonomie et l'assistant IA.", body_style))

story.append(Paragraph("6.4 Perspectives d’évolution", h2_style))
story.append(Paragraph("• Déploiement des notifications Push natives Firebase Cloud Messaging ;<br/>• Synchronisation bidirectionnelle directe avec l'ERP Sage X3 / SAP de Kilani Group ;<br/>• Module de pointage géolocalisé mobile pour les équipes industrielles ;<br/>• Signature électronique qualifiée conforme aux standards TunTrust ;<br/>• Publication officielle de l'application sur Google Play Store et Apple App Store.", body_style))

story.append(PageBreak())

# ==========================================
# 10. CONCLUSION GÉNÉRALE
# ==========================================
story.append(Paragraph("Conclusion générale", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=10))

c_p1 = "En huit semaines de stage au sein du Groupe Kilani, ce projet a permis de livrer un écosystème logiciel abouti et moderne de digitalisation des processus de ressources humaines : authentification sécurisée JWT, gestion fluide des congés et des soldes, ordre de mission et attestations générés en PDF officiel signé, alertes e-mails automatisées, portail de pilotage web réactif et assistant RH conversationnel propulsé par l'intelligence artificielle."
c_p2 = "Le périmètre a été scrupuleusement respecté, répondant point par point aux attentes du cahier des charges officiel. Les difficultés techniques rencontrées — notamment la garantie de cohérence transactionnelle du solde lors des refus ou annulations et l'orchestration contextuelle du modèle d'IA — ont donné lieu à des solutions concrètes et éprouvées dans le code."
c_p3 = "Ce projet confirme la viabilité d'une architecture full-stack moderne (Flutter, React 19, Express, SQL Server, Gemini AI) pour moderniser les processus d'entreprise et apporte à Kilani Group un socle technologique robuste, durable et évolutif."
story.append(Paragraph(c_p1, body_style))
story.append(Paragraph(c_p2, body_style))
story.append(Paragraph(c_p3, body_style))

story.append(PageBreak())

# ==========================================
# 11. ANNEXES
# ==========================================
story.append(Paragraph("Annexes", h1_style))
story.append(HRFlowable(width="100%", thickness=1, color=C_GOLD, spaceBefore=2, spaceAfter=8))

story.append(Paragraph("Annexe A — Index des captures d’écran", h2_style))
annexe_a_headers = ["N°", "Intitulé de la Capture d'Écran", "Section", "Plateforme / Technologie"]
annexe_a_data = [
    ["1", "Écran d'authentification mobile (Matricule / Mot de passe)", "§3.1", "Flutter / Mobile"],
    ["2", "Tableau de bord collaborateur avec solde de congés et actions", "§3.1", "Flutter / Mobile"],
    ["3", "Formulaire de demande de congé (calcul jours/heures, simulation)", "§3.2", "Flutter / Mobile"],
    ["4", "Historique et statut des demandes de congés de l'employé", "§3.2", "Flutter / Mobile"],
    ["5", "Formulaire de saisie d'un ordre de mission et transport", "§3.3", "Flutter / Mobile"],
    ["6", "Formulaire dynamique de demande d'attestation administrative", "§3.4", "Flutter / Mobile"],
    ["7", "Exemple d'attestation de salaire générée en PDF avec cachet", "§3.4", "PDFKit / Document"],
    ["8", "Interface conversationnelle de l'assistant virtuel RH IA", "§3.5", "Flutter / Google Gemini"],
    ["9", "Tableau de bord Back-Office (KPIs, graphiques Recharts)", "§3.7", "React 19 / Web"],
    ["10", "Documentation interactive des points de terminaison de l'API", "§5.2", "Swagger UI / OpenAPI"]
]
t_an_a = Table([[Paragraph(f"<b>{c}</b>", body_style) for c in annexe_a_headers]] + [[Paragraph(str(c), body_style) for c in row] for row in annexe_a_data], colWidths=[35, 240, 60, 160])
t_an_a.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT_BG])
]))
story.append(t_an_a)

story.append(Paragraph("Annexe B — Index des diagrammes", h2_style))
annexe_b_headers = ["Figure", "Type de Diagramme", "Sujet Modélisé & Description"]
annexe_b_data = [
    ["2.1", "Architecture logicielle", "Architecture globale 3-tiers : Clients Flutter/React, API Express, SQL Server, Gemini et SMTP."],
    ["2.2", "Entité-Association / Classes", "Modèle conceptuel de données : Utilisateurs, Conges, Motifs, Missions, Attestations, IA."],
    ["2.3", "Séquence UML", "Cinématique d'authentification par jeton JWT et validation des droits RBAC."],
    ["3.1", "Cas d'Utilisation UML", "Cartographie des cas d'utilisation par acteur (Employé, N+1, RH, Administrateur)."],
    ["3.2", "États-Transitions UML", "Machine à états et cycle de vie d'une demande de congé (de la soumission à la validation RH)."],
    ["3.3", "Séquence UML", "Orchestration de l'assistant virtuel RH : contexte local, inférence Gemini et persistance."],
    ["4.1", "Séquence UML", "Garantie de cohérence transactionnelle et recrédit automatique du solde de congé."],
    ["5.1", "Déploiement UML", "Topologie des conteneurs Docker, nœuds d'exécution et flux de communication réseau."]
]
t_an_b = Table([[Paragraph(f"<b>{c}</b>", body_style) for c in annexe_b_headers]] + [[Paragraph(str(c), body_style) for c in row] for row in annexe_b_data], colWidths=[50, 140, 305])
t_an_b.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), C_NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('GRID', (0, 0), (-1, -1), 0.5, C_BORDER),
    ('TOPPADDING', (0, 0), (-1, -1), 3),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, C_LIGHT_BG])
]))
story.append(t_an_b)

story.append(Paragraph("Annexe C — Glossaire", h2_style))
glossaire = [
    ("SIRH", "Système d'Information des Ressources Humaines informatisé regroupant la gestion du personnel, de la paie et des carrières."),
    ("RBAC", "Role-Based Access Control : Modèle d'habilitation limitant l'accès aux ressources selon le rôle opérationnel."),
    ("JWT", "JSON Web Token : Jeton d'authentification sécurisé et signé numériquement transmettant les informations d'identité sans session serveur."),
    ("API REST", "Style d'architecture logicielle définissant un ensemble de contraintes pour concevoir des services web légers via HTTP/JSON."),
    ("Flutter", "Framework multiplateforme développé par Google permettant de compiler des applications mobiles natives à partir d'une base de code unique."),
    ("SPA", "Single Page Application : Application web dont le rechargement s'effectue dynamiquement sans rafraîchir la page entière du navigateur."),
    ("Microsoft SQL Server", "Système de Gestion de Base de Données Relationnelle d'entreprise assurant les garanties transactionnelles ACID."),
    ("Google Gemini AI", "Grand modèle de langage multimodal développé par Google, intégré pour l'assistance RH en langage naturel."),
    ("SMTP", "Simple Mail Transfer Protocol : Protocole standard de communication pour l'acheminement de courriels électroniques."),
    ("Docker", "Outil de conteneurisation logicielle permettant d'isoler une application et ses dépendances dans un environnement reproductible.")
]
for sigle, defn in glossaire:
    story.append(Paragraph(f"• <b>{sigle} :</b> {defn}", bullet_style))

# Build Document
doc.build(story, canvasmaker=NumberedCanvas)
print(f"PDF built successfully: {out_pdf_path}")

# Copy to Downloads
downloads_pdf_path = "/Users/maymessaoud/Downloads/Rapport_de_Stage_Kilani_HR_May_Messaoud.pdf"
shutil.copyfile(out_pdf_path, downloads_pdf_path)
print(f"PDF copied to: {downloads_pdf_path}")
