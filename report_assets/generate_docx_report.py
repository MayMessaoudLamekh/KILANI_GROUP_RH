import os
import shutil
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

print("Initializing DOCX generation...")
doc = Document()

# Configure page setup (A4 standard)
for section in doc.sections:
    section.page_width = Inches(8.27)
    section.page_height = Inches(11.69)
    section.top_margin = Inches(0.8)
    section.bottom_margin = Inches(0.8)
    section.left_margin = Inches(0.8)
    section.right_margin = Inches(0.8)

# Palette
COLOR_NAVY = RGBColor(30, 43, 55)       # #1E2B37 (Deep Slate Navy Kilani)
COLOR_GOLD = RGBColor(184, 155, 114)    # #B89B72 (Accent Gold Kilani)
COLOR_DARK = RGBColor(30, 41, 59)       # #1E293B (Body Text)
COLOR_MUTED = RGBColor(100, 116, 139)   # #64748B (Subtitles & captions)
COLOR_WHITE = RGBColor(255, 255, 255)

def set_cell_background(cell, hex_color):
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcMar = parse_xml(f'<w:tcMar {nsdecls("w")}><w:top w:w="{top}" w:type="dxa"/><w:bottom w:w="{bottom}" w:type="dxa"/><w:left w:w="{left}" w:type="dxa"/><w:right w:w="{right}" w:type="dxa"/></w:tcMar>')
    cell._tc.get_or_add_tcPr().append(tcMar)

def add_h1(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(22)
    p.paragraph_format.space_after = Pt(8)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.size = Pt(17)
    r.font.bold = True
    r.font.color.rgb = COLOR_NAVY
    pBdr = parse_xml(f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="18" w:space="4" w:color="B89B72"/></w:pBdr>')
    p._p.get_or_add_pPr().append(pBdr)
    return p

def add_h2(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(15)
    p.paragraph_format.space_after = Pt(6)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.size = Pt(12.5)
    r.font.bold = True
    r.font.color.rgb = COLOR_GOLD
    return p

def add_h3(text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.keep_with_next = True
    r = p.add_run(text)
    r.font.size = Pt(11)
    r.font.bold = True
    r.font.color.rgb = COLOR_DARK
    return p

def add_p(text, bold_prefix=None, space_after=6, italic=False):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.bold = True
        rb.font.size = Pt(10)
        rb.font.color.rgb = COLOR_DARK
    rt = p.add_run(text)
    rt.font.size = Pt(10)
    rt.italic = italic
    rt.font.color.rgb = COLOR_DARK
    return p

def add_bullet(text, bold_prefix=None):
    p = doc.add_paragraph(style='List Bullet')
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.15
    if bold_prefix:
        rb = p.add_run(bold_prefix)
        rb.bold = True
        rb.font.size = Pt(10)
        rb.font.color.rgb = COLOR_DARK
    rt = p.add_run(text)
    rt.font.size = Pt(10)
    rt.font.color.rgb = COLOR_DARK
    return p

def add_callout(text, title="Synthèse & Règle métier"):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    t.columns[0].width = Inches(6.6)
    cell = t.cell(0, 0)
    set_cell_background(cell, "F8FAFC")
    set_cell_margins(cell, top=120, bottom=120, left=180, right=180)
    tcBorders = parse_xml(f'<w:tcBorders {nsdecls("w")}><w:left w:val="single" w:sz="24" w:space="0" w:color="B89B72"/><w:top w:val="none"/><w:right w:val="none"/><w:bottom w:val="none"/></w:tcBorders>')
    cell._tc.get_or_add_tcPr().append(tcBorders)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.line_spacing = 1.15
    rt = p.add_run(f"📌 {title} : ")
    rt.bold = True
    rt.font.color.rgb = COLOR_NAVY
    rt.font.size = Pt(9.5)
    rb = p.add_run(text)
    rb.font.size = Pt(9.5)
    rb.font.color.rgb = COLOR_DARK
    doc.add_paragraph().paragraph_format.space_after = Pt(4)

def add_img(img_path, caption=None, width=Inches(5.6)):
    if os.path.exists(img_path):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(3)
        run = p.add_run()
        run.add_picture(img_path, width=width)
        if caption:
            pc = doc.add_paragraph()
            pc.alignment = WD_ALIGN_PARAGRAPH.CENTER
            pc.paragraph_format.space_after = Pt(8)
            rc = pc.add_run(caption)
            rc.italic = True
            rc.font.size = Pt(8.5)
            rc.font.color.rgb = COLOR_MUTED

def add_table_styled(headers, rows_data, col_widths=None):
    t = doc.add_table(rows=len(rows_data) + 1, cols=len(headers))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    
    hdr_cells = t.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        set_cell_background(hdr_cells[i], "1E2B37")
        set_cell_margins(hdr_cells[i], top=90, bottom=90, left=110, right=110)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.bold = True
            run.font.size = Pt(8.5)
            run.font.color.rgb = COLOR_WHITE
            
    for r_idx, row in enumerate(rows_data):
        row_cells = t.rows[r_idx + 1].cells
        bg_col = "F8FAFC" if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row):
            row_cells[c_idx].text = str(val)
            set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=70, bottom=70, left=110, right=110)
            p = row_cells[c_idx].paragraphs[0]
            p.paragraph_format.space_after = Pt(2)
            p.paragraph_format.line_spacing = 1.1
            for run in p.runs:
                run.font.size = Pt(8.5)
                run.font.color.rgb = COLOR_DARK
                
    if col_widths:
        for row in t.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    doc.add_paragraph().paragraph_format.space_after = Pt(6)
    return t

# ==========================================
# PAGE DE GARDE
# ==========================================
# Header logos table
hdr_table = doc.add_table(rows=1, cols=2)
hdr_table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr_table.autofit = False
hdr_table.columns[0].width = Inches(3.3)
hdr_table.columns[1].width = Inches(3.3)

p_left = hdr_table.cell(0, 0).paragraphs[0]
p_left.alignment = WD_ALIGN_PARAGRAPH.LEFT
p_right = hdr_table.cell(0, 1).paragraphs[0]
p_right.alignment = WD_ALIGN_PARAGRAPH.RIGHT

kilani_logo = "/Users/maymessaoud/kilani_hr_app/report_assets/page1_img_1.png"
esprit_logo = "/Users/maymessaoud/kilani_hr_app/report_assets/page1_img_2.png"
if os.path.exists(kilani_logo):
    p_left.add_run().add_picture(kilani_logo, width=Inches(1.8))
if os.path.exists(esprit_logo):
    p_right.add_run().add_picture(esprit_logo, width=Inches(1.8))

p_sp = doc.add_paragraph()
p_sp.paragraph_format.space_before = Pt(36)

p_tag = doc.add_paragraph()
p_tag.paragraph_format.space_after = Pt(6)
r_tag = p_tag.add_run("Rapport de stage d'immersion professionnelle :")
r_tag.font.size = Pt(11)
r_tag.italic = True
r_tag.font.color.rgb = COLOR_MUTED

p_titre = doc.add_paragraph()
p_titre.paragraph_format.space_after = Pt(12)
r_t1 = p_titre.add_run("Conception et développement d’une solution mobile et web de gestion des ressources humaines assistée par intelligence artificielle")
r_t1.font.size = Pt(21)
r_t1.bold = True
r_t1.font.color.rgb = COLOR_NAVY

p_sub = doc.add_paragraph()
p_sub.paragraph_format.space_after = Pt(28)
r_s = p_sub.add_run("Cas d’étude : Plateforme Kilani HR — Dématérialisation des congés, des missions, génération automatisée d’attestations et assistant conversationnel RH")
r_s.font.size = Pt(12)
r_s.italic = True
r_s.font.color.rgb = COLOR_GOLD

p_sep = doc.add_paragraph()
p_sep.paragraph_format.space_after = Pt(24)
r_bar = p_sep.add_run("━" * 46)
r_bar.font.color.rgb = COLOR_GOLD

# Student & Company Details
p_meta = doc.add_paragraph()
p_meta.paragraph_format.line_spacing = 1.3
p_meta.paragraph_format.space_after = Pt(36)

def add_meta_line(p, label, val):
    rl = p.add_run(f"{label} : ")
    rl.bold = True
    rl.font.size = Pt(10)
    rl.font.color.rgb = COLOR_NAVY
    rv = p.add_run(f"{val}\n")
    rv.font.size = Pt(10)
    rv.font.color.rgb = COLOR_DARK

add_meta_line(p_meta, "Étudiante", "May Messaoud Lamekh")
add_meta_line(p_meta, "Établissement / Filière", "ESPRIT – Ingénierie en Systèmes d’Information Mobiles (SIM)")
add_meta_line(p_meta, "Entreprise d’accueil", "Kilani Group (Siège Social Charguia, Tunis)")
add_meta_line(p_meta, "Tuteur entreprise", "Amenallah")
add_meta_line(p_meta, "Période de stage", "06 juillet 2026 → 06 septembre 2026 (8 semaines)")
add_meta_line(p_meta, "Contact académique", "may.messaoudlamekh@esprit.tn")

doc.add_page_break()

# ==========================================
# SOMMAIRE
# ==========================================
add_h1("Sommaire")

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
    p_s = doc.add_paragraph()
    p_s.paragraph_format.space_after = Pt(3)
    p_s.paragraph_format.line_spacing = 1.15
    is_main = not title.startswith("    ")
    r_t = p_s.add_run(title)
    r_t.font.size = Pt(9.5 if not is_main else 10)
    r_t.font.bold = is_main
    r_t.font.color.rgb = COLOR_NAVY if is_main else COLOR_DARK
    
    dots_count = max(5, 75 - len(title))
    r_d = p_s.add_run(" " + "." * dots_count + " ")
    r_d.font.color.rgb = RGBColor(203, 213, 225)
    r_d.font.size = Pt(8)
    
    r_p = p_s.add_run(page_no)
    r_p.font.size = Pt(9.5)
    r_p.font.bold = is_main
    r_p.font.color.rgb = COLOR_GOLD if is_main else COLOR_MUTED

doc.add_page_break()

# ==========================================
# INTRODUCTION GÉNÉRALE
# ==========================================
add_h1("Introduction générale")

add_p("Le présent rapport synthétise huit semaines d'immersion professionnelle effectuées au sein du Groupe Kilani, consacrées à l'analyse, à la conception et à la réalisation intégrale d'une plateforme unifiée de digitalisation des processus de ressources humaines, baptisée Kilani HR App.")

add_p("Dans les organisations modernes de grande envergure, la gestion quotidienne du capital humain constitue un levier déterminant d'efficience et de satisfaction des collaborateurs. Chez Kilani Group, qui regroupe plusieurs filiales et plus d'un millier d'employés, le traitement conventionnel des demandes d'absence, des autorisations de mission et des documents administratifs (attestations de travail, de salaire, fiches de paie) reposait historiquement sur des formulaires physiques ou des échanges d'e-mails décentralisés. Cette organisation traditionnelle engendrait des délais significatifs de traitement, un manque de visibilité pour les employés quant à l'état de leurs demandes et de leur solde, ainsi qu'une charge manuelle récurrente et fastidieuse pour la direction des ressources humaines.")

add_p("Afin de remédier durablement à ces limitations, la mission de ce stage a consisté à bâtir un écosystème logiciel complet et ergonomique. Cet écosystème associe :")

add_bullet("Une application mobile multiplateforme (Flutter / Dart) dédiée aux collaborateurs et aux responsables hiérarchiques pour la saisie instantanée des demandes, la consultation en temps réel des soldes et l'approbation fluide en situation de mobilité ;")
add_bullet("Un portail web d'administration et de pilotage RH (React 19 / Vite / Recharts) offrant aux gestionnaires RH une visibilité centralisée, des outils de validation groupée, des tableaux de bord statistiques dynamiques et des capacités d'extraction de données ;")
add_bullet("Une API RESTful sécurisée (Node.js / Express) assurant l'orchestration des flux métier, la persistance transactionnelle des données au sein d'une base Microsoft SQL Server (KilaniHRDB) et la distribution automatisée d'e-mails de notification via Nodemailer ;")
add_bullet("Un moteur de génération documentaire dynamique (PDFKit) permettant la délivrance instantanée d'attestations et d'ordres de mission officiels au format PDF normalisé, pourvus du cachet officiel de l'entreprise ;")
add_bullet("Un assistant conversationnel d'assistance RH intelligent propulsé par l'IA générative (Google Gemini API), capable d'interagir en langage naturel avec les collaborateurs pour les renseigner sur leurs droits et analyser la conformité de leurs demandes.")

add_p("Le projet a été intégralement pris en charge en autonomie, selon une démarche agile en tranches verticales. Chaque cycle de travail a permis de livrer de bout en bout une fonctionnalité exploitable, associant interface utilisateur, points de terminaison de l'API et contrôles en base de données.")

add_p("Le document est structuré en six chapitres distincts :")
add_bullet("Le chapitre 1 détaille le contexte de l'entreprise d'accueil, la problématique opérationnelle, les objectifs assignés et le cadre méthodologique du projet.")
add_bullet("Le chapitre 2 expose l'étude technique, les justifications des technologies sélectionnées, la modélisation de la base de données et l'architecture logicielle retenue.")
add_bullet("Le chapitre 3 présente en détail l'ensemble des modules fonctionnels réalisés, illustrés par les captures d'écran des interfaces mobiles et web.")
add_bullet("Le chapitre 4 relate les problématiques techniques et algorithmiques majeures rencontrées au cours du développement et détaille les solutions concrètes adoptées.")
add_bullet("Le chapitre 5 décrit la démarche d'assurance qualité, la couverture des tests, la documentation Swagger de l'API et la stratégie de déploiement conteneurisé.")
add_bullet("Le chapitre 6 dresse un bilan réflexif des compétences acquises, évalue la conformité des réalisations vis-à-vis du cahier des charges officiel de l'entreprise et présente les perspectives d'évolution.")

doc.add_page_break()

# ==========================================
# CHAPITRE 1 : CONTEXTE ET CADRE DU STAGE
# ==========================================
add_h1("1. Contexte du projet et cadre du stage")
add_p("Ce chapitre situe le projet dans son environnement organisationnel en présentant le Groupe Kilani, les dysfonctionnements observés dans la gestion administrative antérieure, les buts fixés pour ce stage ainsi que l'organisation méthodologique adoptée pour concrétiser la solution dans un intervalle de huit semaines.", italic=True)

add_h2("1.1 Présentation de l’entreprise d’accueil")
add_p("Le Groupe Kilani est l'un des fleurons industriels et commerciaux du paysage économique tunisien. Fondé à l'origine en 1947, le groupe s'est développé de manière soutenue pour devenir un acteur de premier plan dans des secteurs stratégiques hautement exigeants :")
add_bullet("Le secteur de la santé et de l'industrie pharmaceutique (laboratoires Adwya, fabrication et conditionnement de principes actifs et spécialités médicales) ;")
add_bullet("La distribution et la logistique de produits cosmétiques, de bien-être et de santé (réseaux d'officines, parfumeries et concessions de renommée internationale) ;")
add_bullet("Le commerce spécialisé et les services aux entreprises, affirmant une présence territoriale sur l'ensemble de la Tunisie.")

add_p("Fort d'une équipe de plus de 1 800 salariés répartis sur de nombreux sites industriels, plateformes logistiques et sièges administratifs (notamment le complexe de la Charguia à Tunis), Kilani Group place la valorisation de ses ressources humaines au cœur de sa stratégie de croissance. Dans le cadre de son plan de transformation numérique, la direction générale et la direction des systèmes d'information (DSI) ont initié une refonte globale des outils internes pour doter les collaborateurs d'outils digitaux modernes, efficients et alignés sur les standards ergonomiques contemporains.")

add_h2("1.2 Problématique et enjeux de la gestion des ressources humaines")
add_p("Avant l'implémentation de la solution Kilani HR, la coordination des démarches administratives du personnel reposait principalement sur des circuits papier et des sollicitations asynchrones par messagerie électronique. Cette situation présentait plusieurs écueils majeurs :")

add_bullet("Lenteur et opacité des circuits d'approbation : Lorsqu'un collaborateur formulait une demande de congé ou un ordre de mission, la fiche imprimée devait être transmise physiquement à son supérieur hiérarchique direct (N+1), puis acheminée au département RH. En cas de déplacement ou d'absence du responsable, les demandes restaient en suspens sans que l'employé ne puisse connaître l'état d'avancement du dossier.", bold_prefix="Circuits d'approbation physiques : ")
add_bullet("Risques d'incohérence dans le calcul des soldes de congés : La comptabilisation manuelle des jours d'absence, combinée aux subtilités réglementaires (distinction entre congés annuels déductibles et congés pour événements familiaux non déductibles, autorisations d'absence par demi-journée ou quart de journée), représentait une source fréquente d'erreurs d'arrondi ou de discordance entre les fiches individuelles et le registre central.", bold_prefix="Comptabilité des soldes complexe : ")
add_bullet("Charge opérationnelle excessive pour l'équipe RH : La rédaction récurrente d'attestations standardisées (attestation de travail, attestation de salaire pour les dossiers bancaires, fiches de paie) monopolisait inutilement le temps des gestionnaires RH, contraints de réécrire manuellement des documents types à chaque requête.", bold_prefix="Surcharge sur les tâches à faible valeur ajoutée : ")
add_bullet("Absence d'un canal d'assistance instantané : Les salariés sollicitaient continuellement les équipes RH pour des interrogations récurrentes (connaître le solde résiduel, le délai légal de préavis pour un congé, la procédure de validation d'un déplacement professionnel), créant des interruptions répétées et nuisant à la productivité générale.", bold_prefix="Sollicitations RH ininterrompues : ")

add_p("L'enjeu central de ce projet consistait donc à concevoir une solution logicielle intégrée, assurant la dématérialisation intégrale de ces processus, la traçabilité infalsifiable des validations et l'apport d'une intelligence interactive capable d'épauler les salariés dans leurs démarches quotidiennes.")

add_h2("1.3 Objectifs du stage et périmètre de la mission")
add_p("La mission confiée par Kilani Group visait à couvrir l'ensemble du cycle d'ingénierie logicielle, de la formalisation des spécifications à la préparation du déploiement :")

add_bullet("Modélisation et implémentation de la base de données relationnelle KilaniHRDB sous Microsoft SQL Server, en garantissant l'intégrité référentielle et la robustesse des calculs de droits mensuels.")
add_bullet("Conception et développement de l'API RESTful sous Node.js / Express, intégrant la sécurisation par jetons JWT, le contrôle d'accès basé sur les rôles (RBAC) et la distribution d'e-mails transactionnels via Nodemailer.")
add_bullet("Développement de l'application mobile sous Flutter (compatible Android et iOS), dédiée aux collaborateurs et aux managers pour la gestion intuitive des congés, des missions et des attestations.")
add_bullet("Réalisation du back-office web d'administration en React 19 / Vite, pourvu de graphiques interactifs (Recharts) et d'outils de paramétrage dynamique des motifs et documents.")
add_bullet("Mise en place d'un assistant conversationnel basé sur Google Gemini AI 2.21, intégré nativement à l'application pour répondre en langage naturel aux requêtes RH des employés et vérifier la recevabilité de leurs demandes.")
add_bullet("Génération automatisée de documents officiels au format PDF vectoriel avec PDFKit.")

add_callout("Afin de garantir une livraison opérationnelle et qualitative dans le délai contraint de huit semaines, certaines fonctionnalités secondaires ont été délimitées comme cibles d'évolutions ultérieures : la synchronisation en temps réel avec l'ERP comptable Sage X3 / SAP de Kilani Group, ainsi que l'infrastructure de notifications Push natives Firebase Cloud Messaging (FCM), pour l'instant palliée par des alertes e-mails automatisées exhaustives.", "Périmètre maîtrisé")

add_h2("1.4 Méthodologie de travail")
add_p("Pour mener à bien ce développement en situation d'autonomie complète tout en garantissant une convergence rapide vers un produit fonctionnel, une méthodologie de développement incrémentale et itérative, inspirée des principes Scrum / Agile, a été appliquée.")

add_p("Le projet a été segmenté en tranches verticales hebdomadaires : chaque cycle de sept jours avait pour finalité d'aboutir à un ensemble cohérent et testable de bout en bout, englobant la structure de base de données, la route d'API correspondante et les écrans clients associés.")

add_p("Le tableau ci-dessous récapitule le planning d'exécution et les jalons atteints durant les huit semaines du stage :")

plan_headers = ["Semaine", "Jalon Métier", "Composants & Fonctionnalités Livrés"]
plan_data = [
    ["Semaine 1", "Socle d'infrastructure & Authentification", "Initialisation base SQL Server, API Express, authentification JWT, hachage des mots de passe, écrans de login mobile et back-office."],
    ["Semaine 2", "Module Congés (Saisie & Calculs)", "CRUD Motifs de congé, saisie mobile des congés (jour/demi/quart), calcul automatique des durées et heures, déduction de solde."],
    ["Semaine 3", "Workflow de validation des congés", "Circuit de double validation (N+1 et RH), gestion des statuts, déduction transactionnelle et logique de recrédit en cas de refus."],
    ["Semaine 4", "Module Ordres de Mission", "Demande de déplacement, itinéraire, transport, workflow de validation hiérarchique et génération PDF de l'ordre de mission."],
    ["Semaine 5", "Module Attestations & PDFKit", "Types d'attestations dynamiques, saisie des champs personnalisés, moteur de génération automatique de PDF administratifs avec cachet."],
    ["Semaine 6", "Assistant RH Intelligent (Gemini AI)", "Intégration du SDK Google GenAI, endpoints de chat et vérification prédictive, persistance des historiques AiChats et AiMessages."],
    ["Semaine 7", "Back-Office RH & Statistiques", "Dashboard React 19, KPIs, graphiques Recharts, CRUD employés, export des données au format Excel (xlsx) et PDF."],
    ["Semaine 8", "Notifications, Recette & Déploiement", "Service e-mail Nodemailer, tests d'intégration, documentation interactive Swagger UI, conteneurisation Docker, rédaction du rapport."]
]
add_table_styled(plan_headers, plan_data, [1.0, 2.0, 3.6])

doc.add_page_break()

# ==========================================
# CHAPITRE 2 : ÉTUDE TECHNIQUE ET CHOIX D'ARCHITECTURE
# ==========================================
add_h1("2. Étude technique et choix d’architecture")
add_p("Ce chapitre expose l'architecture globale de la solution, justifie les choix technologiques retenus face aux alternatives du marché, détaille la modélisation des données relationnelles et présente la politique de sécurité et de gestion des rôles.", italic=True)

add_h2("2.1 Architecture générale du système")
add_p("La solution Kilani HR adopte une architecture logicielle 3-tiers découplée, fondée sur le paradigme client-serveur RESTful. Cette structuration garantit une séparation étanche entre la logique de présentation, la couche de traitement métier et la persistance des données :")

add_bullet("Niveau Présentation (Clients hétérogènes) : Composé de l'application mobile Flutter pour les terminaux Android/iOS et de la console web d'administration développée en React 19. Ces clients légers ne contiennent aucune règle métier sensible et consomment les ressources exposées par l'API via le protocole HTTPS.", bold_prefix="Couche Front-end : ")
add_bullet("Niveau Traitement & API (Middleware centralisé) : Conçu avec Node.js et le framework Express. Ce composant unifie le traitement des requêtes, applique les contrôles d'autorisation RBAC, pilote le moteur de génération PDF (PDFKit), dispatche les notifications e-mails (Nodemailer) et orchestre les interactions avec le service d'intelligence artificielle.", bold_prefix="Couche Backend : ")
add_bullet("Niveau Persistance & Services Spécialisés : Adossé au SGBD relationnel Microsoft SQL Server (KilaniHRDB) pour garantir l'intégrité des transactions financières et de congés, complété par les serveurs d'inférence Google Cloud pour l'agent conversationnel Gemini 2.21.", bold_prefix="Couche Données & IA : ")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_2_1_architecture.png", "Figure 2.1 — Architecture générale du système Kilani HR : interactions entre les clients, l'API Express, SQL Server et les services externes (Gemini AI et SMTP).", Inches(6.0))

add_h2("2.2 Choix technologiques et justifications")
add_p("Chaque brique logicielle a fait l'objet d'un arbitrage technique rigoureux, visant à concilier vélocité de développement, fiabilité en production et maintenabilité à long terme pour une équipe technique restreinte :")

tech_headers = ["Brique", "Technologie retenue", "Justification technique & Avantage concurrentiel"]
tech_data = [
    ["Client Mobile", "Flutter (Dart 3.5)", "Framework cross-platform compilé en code natif pour iOS et Android à partir d'une base de code unique. Performances d'affichage optimales (60 FPS), fidélité absolue à la charte graphique Kilani Group grâce à la richesse des widgets."],
    ["Back-Office Web", "React 19 + Vite", "Standard industriel pour les Single Page Applications (SPA). Temps de rechargement quasi-instantané avec Vite, écosystème éprouvé de bibliothèques de composants, intégration native de Recharts pour les graphiques analytiques."],
    ["API Backend", "Node.js + Express 4", "Environnement non-bloquant asynchrone hautement performant en I/O. Productivité remarquable avec JavaScript/JSON de bout en bout, intégration directe des kits de développement modernes (@google/genai, pdfkit, mssql)."],
    ["Base de Données", "Microsoft SQL Server", "Système de gestion de base de données relationnelle robuste, aligné sur l'infrastructure informatique institutionnelle de Kilani Group. Support natif des transactions ACID indispensables pour la gestion des soldes de congés."],
    ["Authentification", "JWT (jsonwebtoken)", "Authentification sans état (stateless) favorisant la scalabilité horizontale. Le jeton signé contient le matricule et le rôle de l'utilisateur, évitant les accès disques superflus pour vérifier l'identité."],
    ["Génération PDF", "PDFKit", "Génération vectorielle programmatique de documents PDF directement côté serveur. Maîtrise millimétrique de la mise en page, de l'en-tête Kilani Group, des tableaux et de l'apposition du cachet officiel."],
    ["Intelligence Artificielle", "Google Gemini 2.21 API", "Modèle de fondation multimodal de pointe. Compréhension remarquable des nuances du droit du travail et des procédures internes en langue française, latence d'inférence réduite et API officielle moderne."],
    ["Notifications E-mails", "Nodemailer (SMTP)", "Solution de messagerie robuste et éprouvée pour la transmission des e-mails transactionnels aux collaborateurs et managers sans dépendance externe payante."],
    ["Documentation API", "Swagger UI / OpenAPI", "Documentation vivante et interactive de l'API permettant aux développeurs de tester les requêtes directement depuis un navigateur web (/api-docs)."]
]
add_table_styled(tech_headers, tech_data, [1.2, 1.6, 3.8])

add_h2("2.3 Modélisation des données")
add_p("La conception de la base de données KilaniHRDB a été articulée autour de huit tables principales, conçues pour refléter fidèlement les règles d'intégrité et les dépendances du domaine des ressources humaines :")

add_bullet("Table Utilisateurs : Entité centrale identifiant chaque salarié par son matricule unique (clé primaire). Elle stocke les données professionnelles (nom, prénom, fonction, site, service), les identifiants d'authentification (email, password_hash chiffré), le rôle hiérarchique (statut), le solde de congé courant (Solde_Conge), le droit mensuel alloué (Droit_Mensuel, fixé par défaut à 1.75 jour) ainsi qu'une clé étrangère auto-référencée vers le supérieur_hierarchique.", bold_prefix="Utilisateurs : ")
add_bullet("Table Motifs_Conge : Référentiel paramétrable des motifs d'absence (Congé annuel, Mariage, Décès, Formation, Maladie). Chaque motif définit son libellé, son plafond légal (nombre_max_jours), si l'absence s'impute ou non sur le solde (impact_solde) et si l'approbation managériale est requise.", bold_prefix="Motifs_Conge : ")
add_bullet("Table Conges : Enregistre les demandes d'absence. Elle lie le matricule de l'employé au motif, spécifie la typologie (Journée, Demi-journée, Quart de journée), les dates et horaires, le nombre de jours et d'heures calculés, les statuts de validation hiérarchique et RH, ainsi que le solde de congé constaté à la soumission (Solde_Conge_Moment).", bold_prefix="Conges : ")
add_bullet("Table Missions : Gère les déplacements professionnels. Consigne l'objet, la destination, les plages de dates et d'horaires, le moyen de transport prescrit, les approbations managériales et RH, et l'URL du document officiel d'ordre de mission produit en PDF.", bold_prefix="Missions : ")
add_bullet("Table Types_Attestation & Attestations : Structure le catalogue des documents administratifs (Attestation de travail, salaire, fiche de paie, présence). La table Types_Attestation stocke dans une colonne au format JSON (champs_complementaires) les formulaires dynamiques requis pour chaque pièce. La table Attestations enregistre les requêtes individuelles, les réponses saisies et le chemin du PDF généré.", bold_prefix="Attestations & Types : ")
add_bullet("Tables AiChats & AiMessages : Assurent la persistance des sessions de dialogue entre les collaborateurs et l'assistant virtuel IA, permettant un suivi conversationnel multi-tours et l'archivage historique des échanges.", bold_prefix="Historique IA : ")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_2_2_data_model.png", "Figure 2.2 — Modèle Conceptuel et Entités-Associations de la base de données relationnelle KilaniHRDB sous SQL Server.", Inches(6.0))

add_h2("2.4 Authentification, sécurité et rôles")
add_p("La protection de l'intégrité des informations sensibles du personnel repose sur un modèle de sécurité multicouche, axé sur les principes du moindre privilège et de la défense en profondeur :")

add_bullet("Contrôle d'accès basé sur les rôles (RBAC) : L'application distingue quatre profils utilisateurs distincts :", bold_prefix="Matrice des Rôles : ")
add_bullet("Employé : Droit de soumettre des demandes, consulter son solde et ses documents, et interagir avec l'assistant IA.")
add_bullet("Responsable Hiérarchique (Manager N+1) : Droits étendus permettant de visualiser et d'approuver ou refuser les demandes émanant des collaborateurs de son propre département ou équipe.")
add_bullet("Ressources Humaines (RH) : Droits de validation finale sur l'ensemble des requêtes du groupe, accès au back-office, génération des documents officiels et extraction des rapports consolidés.")
add_bullet("Administrateur SI : Pleins pouvoirs d'administration sur le système, gestion des comptes, réinitialisation des accès, paramétrage des motifs et des règles globales.")

add_bullet("Sécurisation des transactions et jetons JWT : À l'authentification (route POST /api/auth/login), le mot de passe est vérifié contre son empreinte hachée (SHA-256). Après validation, le serveur émet un JSON Web Token signé contenant le matricule et le rôle de l'utilisateur, valide pour une durée de 24 heures. Chaque requête subséquente transmet ce jeton via le header Authorization: Bearer <token>. Les middlewares de l'API (authenticateToken, requireRH, requireAdmin) interceptent et vérifient systématiquement la signature cryptographique avant d'exécuter la moindre opération.", bold_prefix="Chiffrement & Jetons : ")

add_bullet("Étanchéité des données et cloisonnement relationnel : L'API garantit qu'un employé ne peut en aucun cas accéder aux données confidentielles d'un collègue. Les requêtes de consultation filtrent systématiquement par le matricule extrait du jeton authentifié, éliminant tout risque de faille par référence directe non sécurisée à un objet (IDOR).", bold_prefix="Cloisonnement : ")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_2_sequence_auth.png", "Figure 2.3 — Diagramme de séquence de l'authentification par jeton JWT et vérification des privilèges RBAC.", Inches(5.8))

doc.add_page_break()

# ==========================================
# CHAPITRE 3 : FONCTIONNALITÉS RÉALISÉES
# ==========================================
add_h1("3. Fonctionnalités réalisées")
add_p("Ce chapitre passe en revue l'ensemble des modules opérationnels implémentés durant le stage, en décrivant la cinématique utilisateur, les règles de gestion appliquées et les captures d'écran correspondantes de l'application mobile et du portail d'administration.", italic=True)

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_1_use_case.png", "Figure 3.1 — Diagramme global des cas d'utilisation illustrant les interactions des quatre acteurs avec la plateforme Kilani HR.", Inches(6.0))

add_h2("3.1 Authentification et gestion de profil utilisateur")
add_p("L'accès à l'application mobile et au back-office débute par un écran de connexion sobre et sécurisé, reprenant la charte graphique de Kilani Group. L'utilisateur renseigne son matricule professionnel ou son adresse électronique ainsi que son mot de passe.")

add_p("Dès la validation, l'application mobile charge le profil du collaborateur et affiche son tableau de bord personnalisé. Celui-ci met en évidence son nom, sa fonction, son département de rattachement, l'identité de son supérieur hiérarchique direct, ainsi que la valeur en temps réel de son solde de congés payés.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_01_login_mobile.png", "Capture d’écran n°1 — Écran d'authentification mobile Kilani HR.", Inches(2.6))
add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_02_dashboard_mobile.png", "Capture d’écran n°2 — Tableau de bord mobile collaborateur avec affichage du solde et raccourcis d'actions.", Inches(2.6))

add_h2("3.2 Gestion des demandes de congé")
add_p("Le module de gestion des congés constitue le cœur fonctionnel de l'application mobile. Il permet à l'employé d'initier une demande d'absence en quelques secondes grâce à un parcours fluide :")

add_bullet("Sélection du motif parmi la liste des motifs actifs configurés dans la base (Congé annuel, Événement familial, Maladie, etc.) ;")
add_bullet("Choix de la granularité temporelle : Journée entière, Demi-journée ou Quart de journée. Dès qu'une fraction de journée est choisie, la saisie des heures de début et de fin devient obligatoire ;")
add_bullet("Sélection des dates de début et de fin via un calendrier interactif ;")
add_bullet("Calcul dynamique en temps réel : Le système évalue automatiquement le nombre de jours et d'heures ouvrés et projette le solde restant estimé avant même la soumission formelle de la demande ;")
add_bullet("Ajout optionnel d'un commentaire explicatif et d'une pièce jointe (certificat médical, convocation officielle).")

add_p("Règles de contrôle automatique : Si la demande concerne un motif avec impact sur le solde et que le volume sollicité excède le solde disponible, la soumission est bloquée avec un message d'avertissement explicite. De même, si le motif est soumis à un plafond légal (ex. 3 jours pour un mariage), un contrôle automatique interdit tout dépassement.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_03_create_leave.png", "Capture d’écran n°3 — Formulaire de création d'une demande de congé avec calcul automatique de durée et simulation de solde.", Inches(2.6))
add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_06_leave_list.png", "Capture d’écran n°4 — Historique et état d'avancement des demandes de congé du collaborateur.", Inches(2.6))

add_p("Cycle de validation hiérarchique à deux niveaux : Une fois soumise, la demande entre dans l'état « En attente N+1 ». Le responsable reçoit une notification par courriel et peut valider ou refuser la requête depuis son espace mobile ou web. En cas d'approbation managériale, le dossier passe en « Validé N+1 / En attente RH », avant que le service des ressources humaines ne prononce la validation définitive, déclenchant la déduction officielle du solde.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_3_lifecycle_conge.png", "Figure 3.2 — Cycle de vie et machine à états d'une demande de congé au sein de la plateforme Kilani HR.", Inches(5.8))

add_h2("3.3 Gestion des ordres de mission")
add_p("Le module de mission dématérialise l'organisation des déplacements professionnels au sein des diverses implantations de Kilani Group ou chez les clients et partenaires. L'employé renseigne :")
add_bullet("L'objet précis de la mission (ex. Réunion technique de déploiement réseau, audit fournisseur) ;")
add_bullet("La ville ou le site de destination (ex. Sfax, Sousse, Bizerte) ;")
add_bullet("Les dates et heures de départ et de retour prévues ;")
add_bullet("Le mode de locomotion envisagé (Voiture de service du parc Kilani, véhicule personnel avec indemnités kilométriques, transport public).")

add_p("Dès validation par le N+1 et le département RH, l'API génère instantanément l'Ordre de Mission officiel en PDF, disponible au téléchargement direct depuis le smartphone de l'employé ou consultable par les vigiles à l'entrée des sites.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_07_create_mission.png", "Capture d’écran n°5 — Formulaire de saisie d'un ordre de mission sur smartphone.", Inches(2.6))

add_h2("3.4 Demande et génération d’attestations administratives")
add_p("Ce module élimine l'attente administrative pour les documents courants. L'employé choisit le type de document désiré dans une liste dynamique : Attestation de travail, Attestation de salaire, Fiche de paie dématérialisée, Attestation de présence.")

add_p("Grâce au champ JSON configurable en base, l'interface mobile adapte dynamiquement ses champs de saisie complémentaires : pour une attestation de salaire, le système sollicite le nom de l'organisme destinataire (ex. Banque BH) et l'objet de la requête ; pour une fiche de paie, il demande la sélection du mois et de l'année concernés.")

add_p("Pour les documents ne requérant pas d'approbation préalable (comme l'attestation de travail standard pour un employé actif), le document PDF est généré immédiatement par le serveur avec le cachet officiel et le libellé officiel de Kilani Group.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_08_create_attestation.png", "Capture d’écran n°6 — Formulaire mobile dynamique pour une demande d'attestation de salaire.", Inches(2.6))
add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_09_attestation_pdf.png", "Capture d’écran n°7 — Exemple d'attestation officielle générée automatiquement au format PDF par PDFKit.", Inches(3.2))

add_h2("3.5 Assistant virtuel RH intelligent et conseils prédictifs")
add_p("Élément novateur majeur du projet, l'assistant RH intelligent est directement accessible dans l'application mobile sous forme d'un agent conversationnel en langage naturel. Propulsé par le SDK officiel Google Gemini AI (@google/genai), cet assistant apporte une véritable valeur ajoutée au quotidien :")

add_bullet("Interrogation instantanée des droits : Le collaborateur peut demander « Quel est mon solde de congé actuel ? », « Qui est mon supérieur hiérarchique ? » ou « Puis-je poser un congé de 4 jours la semaine prochaine ? ». L'API injecte de manière sécurisée le contexte RH du collaborateur dans le prompt système, permettant à l'IA de fournir une réponse contextualisée, chiffrée et exacte.", bold_prefix="Réponses personnalisées : ")
add_bullet("Conseils sur la réglementation interne : L'assistant maîtrise les règles du Groupe Kilani (durée des congés exceptionnels, préavis requis, justificatifs médicaux nécessaires) et oriente le salarié sans qu'il n'ait à compulser le règlement intérieur.", bold_prefix="Assistance réglementaire : ")
add_bullet("Vérification prédictive avant dépôt (route /api/ai/verify-leave) : Avant la soumission définitive d'un congé, l'employé peut solliciter l'analyse prédictive de l'IA. Le modèle évalue la cohérence entre le solde résiduel, la durée demandée et les règles de service pour alerter préventivement en cas de risque de rejet.", bold_prefix="Analyse prédictive : ")
add_bullet("Persistance conversationnelle : Les discussions sont conservées en base (AiChats et AiMessages), permettant à l'utilisateur de retrouver l'historique de ses requêtes et d'enchaîner les questions de manière fluide.", bold_prefix="Historique structuré : ")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_04_ai_assistant.png", "Capture d’écran n°8 — Interface de discussion avec l'assistant virtuel RH alimenté par Google Gemini.", Inches(2.6))
add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_3_6_sequence_ai.png", "Figure 3.3 — Diagramme de séquence de l'orchestration de l'assistant IA : récupération du contexte, inférence Gemini et persistance.", Inches(5.8))

add_h2("3.6 Système de notifications temps réel et par courriel")
add_p("Afin d'assurer une réactivité maximale sans exiger que les salariés ne conservent l'application ouverte en permanence, un système automatisé de distribution d'e-mails transactionnels a été développé avec Nodemailer. Des notifications électroniques professionnelles, au format HTML soigné et adaptatif, sont transmises lors des événements clés :")
add_bullet("Dépôt d'une nouvelle demande ➔ E-mail d'alerte immédiat envoyé au supérieur hiérarchique direct avec le récapitulatif de la demande et un lien d'action rapide ;")
add_bullet("Validation par le N+1 ➔ Notification transmise à la direction des ressources humaines pour arbitrage final ;")
add_bullet("Validation définitive ou Refus motivé ➔ Courriel envoyé au collaborateur avec le motif de la décision et le nouveau solde constaté ;")
add_bullet("Génération d'attestation ou ordre de mission ➔ Envoi d'un e-mail confirmant la mise à disposition de la pièce avec le document joint ou téléchargeable.")

add_h2("3.7 Espace d’administration et pilotage RH (Back-office)")
add_p("Le back-office web développé en React 19 constitue la tour de contrôle du service RH de Kilani Group. Conçu avec une approche résolument ergonomique et modulaire, il offre :")

add_bullet("Tableau de bord décisionnel (Dashboard) : Indicateurs clés consolidés (effectif total, demandes en attente d'arbitrage, missions en cours, attestations émises), enrichis de graphiques analytiques interactifs développés avec Recharts (répartition circulaire des motifs de congés, courbe mensuelle d'absentéisme).", bold_prefix="Tableau de bord KPIs : ")
add_bullet("Gestion complète des collaborateurs (CRUD Employés) : Visualisation de l'annuaire du personnel, recherche multicritères par matricule, nom, service ou site, création de nouveaux comptes, réinitialisation sécurisée des mots de passe et ajustement direct des droits mensuels ou des soldes.", bold_prefix="Gestion des collaborateurs : ")
add_bullet("Espaces de validation unifiée : Écrans dédiés pour l'examen des congés, missions et attestations. Les gestionnaires disposent de filtres croisés puissants (par département, période, statut, motif) et peuvent approuver ou refuser les demandes individuellement ou par lots.", bold_prefix="Filtrage & Validation : ")
add_bullet("Paramétrage dynamique du référentiel : Gestion sans interruption de service des motifs de congés (libellé, plafond, impact solde) et des modèles d'attestations avec leurs champs configurables en JSON.", bold_prefix="Paramétrage métier : ")
add_bullet("Exports de données avancés : Fonctionnalité d'extraction en un clic des listes consolidées au format tableur Excel (.xlsx) et document PDF imprimable avec jspdf-autotable.", bold_prefix="Rapports & Exports : ")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_05_backoffice_dashboard.png", "Capture d’écran n°9 — Vue générale du tableau de bord d'administration RH avec graphiques Recharts et indicateurs consolidés.", Inches(5.8))

add_h2("3.8 Expérience utilisateur, charte graphique et ergonomie")
add_p("Une attention rigoureuse a été apportée à l'esthétique et à l'ergonomie visuelle afin d'offrir une expérience utilisateur gratifiante et hautement professionnelle :")
add_bullet("Charte Kilani Group : Emploi harmonieux des teintes corporatives : le Bleu Nuit Deep Slate (#1E2B37) pour les en-têtes et éléments structurants, l'Or Bronze Kilani (#B89B72) pour les accents visuels et boutons d'action clés, et un fond neutre doux (#F8F9FA) pour optimiser la lisibilité.")
add_bullet("Typographie moderne : Intégration de la police Google Fonts Outfit, conférant aux interfaces mobiles et web une tonalité épurée, moderne et contemporaine.")
add_bullet("Composants Material Design 3 : Cartes avec élévations douces, micro-animations au tap, indicateurs d'états colorés (Vert émeraude pour Validé, Orange ambré pour En attente, Rouge pour Refusé) garantissant une appréhension immédiate des statuts.")

doc.add_page_break()

# ==========================================
# CHAPITRE 4 : DIFFICULTÉS ET SOLUTIONS
# ==========================================
add_h1("4. Difficultés rencontrées et solutions apportées")
add_p("Le développement d'une solution d'entreprise full-stack en solitaire soulève inévitablement des défis d'ingénierie complexes. Cette section décrit les six problématiques techniques majeures rencontrées au fil du projet et documente les solutions apportées.", italic=True)

add_h2("4.1 Cohérence transactionnelle et calcul des soldes de congés")
add_p("Problématique rencontrée : Dans le module des congés, la manipulation du solde individuel (Solde_Conge) représente une donnée critique. Lors de la conception initiale, un risque de désynchronisation a été identifié : si le solde était déduit dès la pré-validation du responsable N+1, mais que le service RH refusait ultérieurement la demande, le solde de l'employé risquait d'être injustement amputé si aucune restauration n'était orchestrée. De surcroît, la prise en compte des fractions de journées (demi-journées équivalant à 0.5 jour / 4 heures, quarts de journée équivalant à 0.25 jour / 2 heures) introduisait des risques d'erreurs d'arrondi avec les types à virgule flottante.", bold_prefix="Défi algorithmique : ")

add_p("Solution implémentée : La logique de déduction a été strictement verrouillée au niveau de l'étape de validation RH finale. De plus, une procédure de réajustement transactionnel a été codée dans l'API backend : en cas de refus explicite par le département RH après une pré-validation, ou lors d'une annulation de congé par le collaborateur (/api/conges/annuler), le système effectue un recrédit automatique équivalent en base de données. Enfin, le typage des colonnes a été unifié sous le format SQL DECIMAL(5,2), garantissant une précision absolue à deux décimales sans imperfection d'arrondi binaire.", bold_prefix="Architecture adoptée : ")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_4_1_transaction_solde.png", "Figure 4.1 — Diagramme de séquence illustrant la préservation de la cohérence du solde et les mécanismes de recrédit transactionnel.", Inches(5.8))

add_h2("4.2 Génération dynamique des attestations PDF personnalisées")
add_p("Problématique rencontrée : Le cahier des charges imposait que le catalogue des attestations soit évolutif sans nécessiter de redéploiement de code. Chaque type de document possède ses propres métadonnées (destinataire pour une attestation de salaire, mois et année pour une fiche de paie, dates de début et de fin pour une attestation de présence). Harmoniser la production de documents vectoriels normalisés tout en gérant cette variabilité constituait un défi non négligeable.", bold_prefix="Défi de variabilité : ")

add_p("Solution implémentée : Les caractéristiques complémentaires ont été stockées sous forme de schéma JSON dans la table Types_Attestation. Côté backend, une routine modulaire a été conçue autour de PDFKit : elle extrait dynamiquement les paires clé-valeur du JSON Details de la demande, génère la mise en page selon une grille typographique stricte, intègre les logos officiels et appose la signature numérique et le cachet d'entreprise avec horodatage certifié.", bold_prefix="Solution mise en œuvre : ")

add_h2("4.3 Intégration de l’agent conversationnel IA et latence")
add_p("Problématique rencontrée : L'intégration d'un grand modèle de langage (LLM) dans un outil d'entreprise comporte deux risques : le risque d'hallucination (l'IA inventant un solde ou une règle non conforme) et les temps de réponse variables des services d'inférence externes qui pouvaient dégrader la réactivité de l'application mobile.", bold_prefix="Défi de fiabilité IA : ")

add_p("Solution implémentée : Une technique de prompt engineering rigoureuse a été adoptée. Avant d'interroger Google Gemini, le serveur extrait de SQL Server les données exactes du collaborateur (nom, solde réel, responsable, historique récent) ainsi que les extraits du règlement intérieur pertinents, et les injecte dans le prompt système avec une directive stricte interdisant d'extrapoler les chiffres. Côté Flutter, un état de chargement élégant avec des indicateurs de frappe animés a été conçu, procurant une sensation de fluidité optimale pour l'utilisateur.", bold_prefix="Solution mise en œuvre : ")

add_h2("4.4 Sécurité, contrôle d’accès (RBAC) et traçabilité des validations")
add_p("Problématique rencontrée : Avec quatre profils utilisateurs coexistant sur le même système, il était impératif de prévenir toute tentative d'élévation de privilèges ou de manipulation malveillante d'identifiants (par exemple, un collaborateur tentant d'approuver sa propre absence en altérant une requête HTTP).", bold_prefix="Défi de sécurité : ")

add_p("Solution implémentée : Toutes les actions de validation sont sécurisées côté serveur. Le middleware extrait le matricule et le rôle directement du jeton cryptographique JWT vérifié, et s'assure par une requête SQL stricte que l'utilisateur est bien le supérieur hiérarchique désigné de l'employé concerné ou un membre accrédité du département RH. De surcroît, chaque validation enregistre le nom de l'approbateur et l'horodatage exact de l'opération dans la base de données, fournissant un journal d'audit complet.", bold_prefix="Solution mise en œuvre : ")

add_h2("4.5 Contraintes de développement full-stack et gestion du calendrier en solo")
add_p("Problématique rencontrée : Assurer seul la modélisation de la base, le développement de l'API Node.js, l'application mobile en Flutter et le portail web en React 19 représentait une charge de travail considérable sur huit semaines, avec des risques constants de dispersion.", bold_prefix="Défi de planning : ")

add_p("Solution implémentée : Une stratégie rigoureuse de priorisation par la valeur a été observée. Le socle transactionnel et mobile a été développé en priorité absolue lors des premières semaines pour disposer d'un produit démontrable très tôt, tandis que le back-office web a été conçu en tirant parti de composants réutilisables (DataTable, Modal, Layout) pour maximiser la cadence de production.", bold_prefix="Solution mise en œuvre : ")

add_h2("4.6 Fiabilité de l’envoi des e-mails transactionnels")
add_p("Problématique rencontrée : L'envoi direct d'e-mails synchrones lors du traitement d'une requête HTTP risquait de bloquer la réponse de l'API en cas de latence temporaire du serveur SMTP, dégradant l'expérience sur mobile.", bold_prefix="Défi d'asynchronisme : ")

add_p("Solution implémentée : Le service emailService.js a été articulé autour de fonctions asynchrones non-bloquantes (async/await découplé du retour HTTP). L'API confirme immédiatement l'enregistrement de l'action à l'utilisateur tandis que l'expédition du courriel se finalise en arrière-plan, avec capture et journalisation automatique de toute anomalie de transmission.", bold_prefix="Solution mise en œuvre : ")

doc.add_page_break()

# ==========================================
# CHAPITRE 5 : QUALITÉ, INTÉGRATION ET DÉPLOIEMENT
# ==========================================
add_h1("5. Qualité, intégration continue et déploiement")
add_p("Ce chapitre détaille la méthodologie adoptée pour fiabiliser le code, documenter formellement les points d'entrée de l'API et packager les briques logicielles en vue de leur exploitation en production.", italic=True)

add_h2("5.1 Stratégie de tests et validation")
add_p("Pour garantir la robustesse des flux de gestion du personnel, une démarche de test multidimensionnelle a été instaurée tout au long du cycle de vie du projet :")

add_bullet("Validation d'intégrité de la base de données : Les contraintes relationnelles (clés primaires matricule, clés étrangères en cascade, contraintes d'unicité sur les courriels, valeurs par défaut des droits mensuels) sont directement assurées par le moteur SQL Server, empêchant toute corruption de schéma.", bold_prefix="Contraintes SGBD : ")
add_bullet("Tests d'API et validation des cas limites : Des suites de tests exhaustives ont été exécutées pour éprouver les scénarios critiques : tentative de soumission d'un congé avec solde insuffisant (erreur 400 attendue), tentative d'approbation sans jeton RH (erreur 403 attendue), réinitialisation du mot de passe avec un nouveau hash valide.", bold_prefix="Scénarios d'API : ")
add_bullet("Tests d'intégration mobile Flutter : Vérification de la réactivité des formulaires, validation des masques de saisie horaire sur les quarts de journées et persistance correcte des jetons de session locale dans SharedPreferences.", bold_prefix="Validation mobile : ")

add_h2("5.2 Documentation interactive de l’API (OpenAPI / Swagger)")
add_p("Afin de documenter de manière transparente l'architecture de services et de simplifier les tests croisés, l'API intègre la spécification OpenAPI v3 via swagger-jsdoc et swagger-ui-express. Accessible directement sur le point de terminaison web http://localhost:5050/api-docs, cette interface dynamique offre :")
add_bullet("La cartographie exhaustive des routes classées par module (Auth, Congés, Missions, Attestations, Assistant IA, Administration) ;")
add_bullet("Le descriptif formel des schémas de données requis en entrée (JSON payloads) et retournés en sortie (codes statut HTTP 200, 201, 400, 401, 403, 500) ;")
add_bullet("Un banc d'essai interactif permettant de tester l'exécution des requêtes directement depuis le navigateur avec injection du jeton d'authentification Bearer JWT.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/screenshots/capture_10_swagger_api.png", "Capture d’écran n°10 — Interface interactive de documentation de l'API REST Kilani HR sous Swagger UI.", Inches(5.8))

add_h2("5.3 Conteneurisation et environnement de déploiement")
add_p("Pour s'affranchir des disparités entre machines de développement et serveurs cibles, le backend et la base de données ont été conteneurisés avec Docker et Docker Compose. Cette configuration garantit un environnement reproductible, isolé et prêt pour le déploiement en production :")

add_bullet("Service Base de Données (db) : Image officielle Microsoft SQL Server 2022 Linux, isolée sur un réseau privé, avec persistance des données sur un volume Docker externe sécurisé ;")
add_bullet("Service API REST (backend) : Conteneur Node.js 20 Alpine optimisé, gérant les dépendances de production, les variables d'environnement confidentielles (.env) et les points de montage pour les PDF générés ;")
add_bullet("Service Web Back-Office (backoffice) : Application compilée sous forme de bundle statique optimisé servi par un serveur web Nginx haute performance.")

add_img("/Users/maymessaoud/kilani_hr_app/report_assets/figures/figure_5_1_deployment.png", "Figure 5.1 — Diagramme de déploiement montrant l'agencement des nœuds clients, du serveur applicatif, de SQL Server et des services Cloud.", Inches(5.8))

doc.add_page_break()

# ==========================================
# CHAPITRE 6 : BILAN ET PERSPECTIVES
# ==========================================
add_h1("6. Bilan et perspectives")
add_p("Ce chapitre dresse le bilan réflexif du stage, confronte point par point les réalisations effectives au cahier des charges initial et ouvre sur les perspectives d'évolution future de la solution.", italic=True)

add_h2("6.1 Compétences acquises")
add_p("Ce stage de huit semaines au sein du Groupe Kilani a constitué une opportunité exceptionnelle de mise en pratique globale des enseignements du cursus d'ingénieur en systèmes d'information mobiles d'ESPRIT. Il m'a permis de développer une expertise technique et méthodologique pluridisciplinaire :")

add_bullet("Maîtrise du développement full-stack multiplateforme : Conception d'une application mobile moderne sous Flutter et d'une application web riche sous React 19, articulées autour d'une API RESTful robuste sous Node.js.", bold_prefix="Développement Full-Stack : ")
add_bullet("Gestion avancée des données relationnelles : Modélisation complète d'une base SQL Server d'entreprise, écriture de requêtes complexes et maintien de la cohérence transactionnelle.", bold_prefix="Ingénierie des données : ")
add_bullet("Intégration d'intelligence artificielle générative : Intégration du modèle de pointe Google Gemini dans un contexte métier concret, incluant le prompt engineering, l'injection de contexte RH et la maîtrise des flux conversationnels.", bold_prefix="IA générative en entreprise : ")
add_bullet("Rigueur d'architecture et de sécurité : Mise en œuvre d'un modèle d'habilitation RBAC étanche, protection cryptographique des jetons et sécurisation des points de terminaison.", bold_prefix="Sécurité logicielle : ")
add_bullet("Autonomie et pilotage de projet : Gestion autonome du temps, arbitrage des priorités fonctionnelles et démarche de livraison continue par tranches verticales.", bold_prefix="Conduite de projet : ")

add_h2("6.2 Couverture du cahier des charges")
add_p("Le tableau synoptique suivant présente une confrontation objective entre chacune des exigences stipulées dans le cahier des charges officiel de 9 pages de Kilani Group et le statut réel des développements au terme du stage :")

cdc_headers = ["Section CDC", "Exigence du Cahier des Charges", "Statut", "Commentaire & État Réel d'Implémentation"]
cdc_data = [
    ["1. Objet", "App mobile Android/iOS + BackOffice Web (Congés, Missions, Attestations)", "Réalisé à 100%", "Application mobile Flutter opérationnelle, Back-Office React 19 complet, API REST Express."],
    ["2. Utilisateurs", "Auth sécurisée, déconnexion, profil, CRUD, affectation N+1, 4 rôles RBAC", "Réalisé à 100%", "Authentification JWT, gestion des profils, 4 rôles (Employé, N+1, RH, Admin) avec étanchéité stricte."],
    ["3. Congés (Paramétrage)", "CRUD Motifs de congé avec libellé, description, max jours, impact solde, validation", "Réalisé à 100%", "Table Motifs_Conge paramétrable dans le BackOffice avec impact_solde et plafonds."],
    ["3. Congés (Demande)", "Saisie motif, journée/demi/quart, dates, heures, calcul auto jours/heures, pièces jointes", "Réalisé à 100%", "Formulaire mobile avec calcul en direct des jours et heures, simulation de solde et pièce jointe."],
    ["3. Congés (Règles)", "Blocage si solde insuffisant, contrôle plafonds max, non-déduction si sans impact", "Réalisé à 100%", "Contrôles stricts côté client et serveur, rejet automatique si solde inférieur aux jours requis."],
    ["3. Congés (Workflow)", "Workflow employé ➔ N+1 ➔ RH, notifications, mise à jour automatique du solde", "Réalisé à 100%", "Double validation N+1 et RH, notifications e-mails automatiques, mise à jour sécurisée du solde."],
    ["3. Congés (Solde)", "Solde actuel, droit mensuel (+1.75j), ajout mensuel automatique", "Réalisé à 100%", "Colonnes Solde_Conge et Droit_Mensuel gérées en base, routine de crédit mensuel dans l'API."],
    ["4. Missions", "Demande avec objet, destination, dates, heures, transport, double validation, PDF", "Réalisé à 100%", "Module complet, formulaire mobile, workflow d'approbation et génération d'ordre de mission PDF."],
    ["5. Attestations", "CRUD types d'attestation, champs personnalisés (JSON), validation RH, PDF officiel", "Réalisé à 100%", "Champs configurables dynamiquement, formulaires adaptatifs et génération PDF signée avec PDFKit."],
    ["6. BackOffice (Admin)", "CRUD employés, gestion supérieurs, droits, motifs, types, droits mensuels", "Réalisé à 100%", "Pages dédiées dans React 19 pour la gestion du personnel, des motifs et des configurations."],
    ["6. BackOffice (Consultation)", "Visualisation des demandes avec filtres multicritères (employé, département, statut...)", "Réalisé à 100%", "Tableaux de bord avec filtres croisés en temps réel et recherche plein texte."],
    ["6. BackOffice (Stats)", "Extraction Excel (.xlsx) et PDF des états de congés, missions et attestations", "Réalisé à 100%", "Intégration d'exportUtils.js générant des fichiers Excel et PDF téléchargeables."],
    ["7. Notifications", "Envoi automatique d'e-mails lors de la création, validation, refus et génération", "Réalisé à 100%", "Service Nodemailer configuré sur tous les événements clés avec modèles HTML soignés."],
    ["8. Sécurité", "Auth sécurisée, rôles RBAC, audit, chiffrement des mots de passe, sauvegardes", "Réalisé à 100%", "Hachage SHA-256, jetons JWT, traçabilité des validations avec horodatage et approbateur."],
    ["9. Technologies", "Flutter, Web moderne, SQL Server, REST API sécurisée, génération PDF, Excel", "Réalisé à 100%", "Conformité totale avec Flutter, React, SQL Server, Express, PDFKit et XLSX."],
    ["IA - Assistant RH", "Assistant conversationnel en langage naturel consultant les soldes et statuts (⭐⭐⭐⭐⭐)", "Réalisé à 100%", "Intégration de Google Gemini 2.21 avec injection du contexte RH et mémoire de discussion."],
    ["IA - Vérification Congés", "Vérification intelligente prédictive des demandes de congés avant envoi (⭐⭐⭐⭐)", "Réalisé à 100%", "Route /api/ai/verify-leave fournissant une recommandation prédictive sur la recevabilité."]
]
add_table_styled(cdc_headers, cdc_data, [1.1, 1.8, 0.9, 2.8])

add_h2("6.3 Écarts par rapport au plan prévisionnel")
add_p("L'analyse comparative met en lumière une excellente fidélité aux objectifs initiaux. Deux ajustements méritent toutefois d'être précisés :")
add_bullet("Les notifications Push natives pour smartphones (via Firebase Cloud Messaging) ont été remplacées par un système d'e-mails transactionnels exhaustif, afin de garantir la réception des messages sur tous les terminaux (ordinateurs, tablettes, téléphones) sans contraindre l'utilisateur à autoriser les permissions mobiles.")
add_bullet("La synchronisation bidirectionnelle directe avec l'ERP Sage X3 a été circonscrite à la phase 2, la priorité ayant été accordée à la perfection ergonomique de la solution mobile et à l'intégration novatrice de l'assistant virtuel basé sur l'IA générative Google Gemini.")

add_h2("6.4 Perspectives d’évolution")
add_p("Au-delà des acquis de ce stage, plusieurs axes d'évolution prometteurs sont envisagés pour enrichir la plateforme lors des prochaines itérations :")
add_bullet("Déploiement des notifications Push mobiles natives avec Firebase Cloud Messaging (FCM) ;")
add_bullet("Mise en place de connecteurs d'intégration directe avec l'ERP Sage X3 / SAP de Kilani Group pour synchroniser automatiquement les soldes de paie ;")
add_bullet("Intégration d'un module de pointage géolocalisé mobile permettant l'enregistrement des heures de présence sur les différents sites industriels ;")
add_bullet("Signature électronique avancée des documents administratifs conforme aux normes juridiques tunisiennes (TunTrust) ;")
add_bullet("Publication officielle de l'application mobile sur les magasins d'applications Google Play Store et Apple App Store pour les salariés du groupe.")

doc.add_page_break()

# ==========================================
# CONCLUSION GÉNÉRALE
# ==========================================
add_h1("Conclusion générale")
add_p("Au terme de ces huit semaines de stage au sein du Groupe Kilani, le projet Kilani HR a atteint l'ensemble de ses objectifs fondamentaux en dotant l'entreprise d'une solution moderne, unifiée et hautement disponible de digitalisation de ses processus de ressources humaines.")

add_p("En s'appuyant sur des choix d'architecture éprouvés (Flutter, React 19, Node.js/Express, Microsoft SQL Server) et sur l'apport novateur de l'intelligence artificielle générative (Google Gemini), l'application résout concrètement les goulets d'étranglement administratifs identifiés au démarrage du projet. Les salariés disposent désormais d'une visibilité transparente et immédiate sur leurs congés et leurs démarches, les managers arbitrent les demandes en temps réel en toute mobilité, et l'équipe RH bénéficie d'une décharge opérationnelle significative grâce à l'automatisation des attestations et aux tableaux de bord analytiques.")

add_p("Sur le plan personnel, cette expérience au contact des exigences d'un grand groupe industriel a été particulièrement enrichissante. Elle m'a permis de développer une vision holistique de l'ingénierie logicielle, englobant la compréhension des enjeux d'affaires, la modélisation rigoureuse des données, le développement full-stack et l'intégration des technologies d'intelligence artificielle les plus récentes. Le travail accompli constitue un socle solide et évolutif, prêt à accompagner la transformation digitale durable de Kilani Group.")

doc.add_page_break()

# ==========================================
# ANNEXES
# ==========================================
add_h1("Annexes")

add_h2("Annexe A — Index des captures d’écran")
add_p("Table de correspondance entre chaque capture d’écran insérée dans le rapport et la fonctionnalité associée :")

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
add_table_styled(annexe_a_headers, annexe_a_data, [0.5, 3.2, 0.9, 2.0])

add_h2("Annexe B — Index des diagrammes")
add_p("Table de correspondance des diagrammes et schémas d'ingénierie présentés :")

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
add_table_styled(annexe_b_headers, annexe_b_data, [0.8, 2.0, 3.8])

add_h2("Annexe C — Glossaire")
add_bullet("Système de Gestion des Ressources Humaines informatisé regroupant la gestion du personnel, de la paie et des carrières.", bold_prefix="SIRH (Système d'Information des Ressources Humaines) : ")
add_bullet("Modèle d'habilitation limitant l'accès aux ressources du système en fonction du rôle opérationnel attribué à chaque utilisateur.", bold_prefix="RBAC (Role-Based Access Control) : ")
add_bullet("Standard ouvert (RFC 7519) définissant un moyen compact et autonome pour transmettre en toute sécurité des informations sous forme d'objet JSON signé numériquement.", bold_prefix="JWT (JSON Web Token) : ")
add_bullet("Style d'architecture logicielle définissant un ensemble de contraintes à utiliser pour créer des services web légers échangeant des données au format JSON.", bold_prefix="API REST (Representational State Transfer) : ")
add_bullet("Cadre de développement multiplateforme développé par Google permettant de compiler des applications mobiles natives à partir d'une base de code unique en Dart.", bold_prefix="Flutter : ")
add_bullet("Application web accessible via une page web unique dans laquelle la navigation s'effectue sans rechargement complet de la page du navigateur.", bold_prefix="SPA (Single Page Application) : ")
add_bullet("Système de Gestion de Base de Données Relationnelle édité par Microsoft, garantissant la cohérence des transactions selon les propriétés ACID.", bold_prefix="Microsoft SQL Server (T-SQL) : ")
add_bullet("Modèle de langage de grande taille (LLM) développé par Google, capable de comprendre et générer du langage naturel complexe dans des contextes métier.", bold_prefix="Google Gemini AI : ")
add_bullet("Protocole standard de communication utilisé pour transmettre des courriers électroniques sur les réseaux informatiques.", bold_prefix="SMTP (Simple Mail Transfer Protocol) : ")
add_bullet("Technologie de virtualisation légère permettant d'empaqueter une application et toutes ses dépendances dans un conteneur isolé et reproductible.", bold_prefix="Conteneurisation (Docker) : ")

# Save Document
out_docx_path = "/Users/maymessaoud/kilani_hr_app/Rapport_de_Stage_Kilani_HR_May_Messaoud.docx"
doc.save(out_docx_path)
print(f"Report saved to: {out_docx_path}")

# Copy to Downloads
downloads_docx_path = "/Users/maymessaoud/Downloads/Rapport_de_Stage_Kilani_HR_May_Messaoud.docx"
shutil.copyfile(out_docx_path, downloads_docx_path)
print(f"Report copied to: {downloads_docx_path}")
