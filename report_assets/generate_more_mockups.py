import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

out_dir = '/Users/maymessaoud/kilani_hr_app/report_assets/screenshots'
os.makedirs(out_dir, exist_ok=True)
plt.rcParams['font.sans-serif'] = 'Helvetica'
plt.rcParams['font.family'] = 'sans-serif'

def create_mobile_screen(title, content_func, filename):
    fig, ax = plt.subplots(figsize=(4.2, 7.5), dpi=250)
    ax.set_xlim(0, 4.2)
    ax.set_ylim(0, 7.5)
    ax.axis('off')
    ax.add_patch(patches.FancyBboxPatch((0.1, 0.1), 4.0, 7.3, boxstyle="round,pad=0.15", facecolor="#F8F9FA", edgecolor="#1E2B37", lw=3))
    ax.add_patch(patches.FancyBboxPatch((1.4, 7.05), 1.4, 0.22, boxstyle="round,pad=0.05", facecolor="#000000"))
    ax.text(0.5, 7.15, "09:41", fontsize=7.5, fontweight='bold', color="#1E2B37")
    ax.text(3.7, 7.15, "5G  100%", fontsize=7, fontweight='bold', ha='right', color="#1E2B37")
    ax.add_patch(patches.Rectangle((0.15, 6.35), 3.9, 0.65, facecolor="#1E2B37"))
    ax.text(2.1, 6.68, title, fontsize=10, fontweight='bold', ha='center', color="#FFFFFF")
    content_func(ax)
    ax.add_patch(patches.FancyBboxPatch((1.5, 0.25), 1.2, 0.08, boxstyle="round,pad=0.02", facecolor="#1E2B37"))
    plt.tight_layout()
    plt.savefig(f"{out_dir}/{filename}", dpi=250)
    plt.close()

# 6. Leave List Mobile
def draw_leave_list(ax):
    cards = [
        ("Congé annuel", "Du 10/08/2026 au 12/08/2026 (3j)", "En attente N+1", "#FEF3C7", "#D97706"),
        ("Congé annuel", "Du 01/07/2026 au 03/07/2026 (3j)", "Validé", "#DCFCE7", "#15803D"),
        ("Mariage", "Du 15/05/2026 au 17/05/2026 (3j)", "Validé", "#DCFCE7", "#15803D"),
        ("Congé maladie", "Du 12/03/2026 au 13/03/2026 (2j)", "Validé", "#DCFCE7", "#15803D")
    ]
    cur_y = 5.2
    for motif, dates, status, bg, col in cards:
        ax.add_patch(patches.FancyBboxPatch((0.4, cur_y), 3.4, 0.9, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor="#E2E8F0", lw=1))
        ax.text(0.6, cur_y + 0.62, motif, fontsize=8, fontweight='bold', color="#1E2B37")
        ax.text(0.6, cur_y + 0.35, dates, fontsize=7, color="#64748B")
        ax.add_patch(patches.FancyBboxPatch((2.6, cur_y + 0.25), 1.05, 0.35, boxstyle="round,pad=0.03", facecolor=bg))
        ax.text(3.12, cur_y + 0.42, status, fontsize=6.5, fontweight='bold', ha='center', color=col)
        cur_y -= 1.05

create_mobile_screen("Mes Demandes de Congé", draw_leave_list, "capture_06_leave_list.png")

# 7. Create Mission Mobile
def draw_create_mission(ax):
    ax.text(0.4, 5.9, "Objet de la mission", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 5.45), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 5.65, "Réunion technique client", fontsize=7.5, color="#1E2B37")
    
    ax.text(0.4, 5.15, "Destination", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 4.7), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 4.9, "Sfax - Siège Régional", fontsize=7.5, color="#1E2B37")
    
    ax.text(0.4, 4.4, "Dates et Horaires", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 3.9), 1.6, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.55, 4.1, "01/08/2026 (08:00)", fontsize=7, color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((2.2, 3.9), 1.6, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(2.35, 4.1, "02/08/2026 (18:00)", fontsize=7, color="#1E2B37")
    
    ax.text(0.4, 3.6, "Moyen de transport", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 3.1), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 3.3, "Voiture de service", fontsize=7.5, color="#1E2B37")
    
    ax.add_patch(patches.FancyBboxPatch((0.4, 1.2), 3.4, 0.55, boxstyle="round,pad=0.05", facecolor="#B89B72"))
    ax.text(2.1, 1.47, "Soumettre l'ordre de mission", fontsize=9, fontweight='bold', ha='center', color="#FFFFFF")

create_mobile_screen("Demande de Mission", draw_create_mission, "capture_07_create_mission.png")

# 8. Create Attestation Mobile
def draw_create_attest(ax):
    ax.text(0.4, 5.9, "Type de document souhaité", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 5.45), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 5.65, "Attestation de salaire", fontsize=7.5, color="#1E2B37")
    
    ax.text(0.4, 5.15, "Champs complémentaires dynamiques", fontsize=8, fontweight='bold', color="#B89B72")
    ax.text(0.4, 4.8, "Destinataire", fontsize=7.5, color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 4.35), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 4.55, "Banque de l'Habitat (BH Bank)", fontsize=7.5, color="#1E2B37")
    
    ax.text(0.4, 4.05, "Objet", fontsize=7.5, color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 3.6), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 3.8, "Dossier de prêt immobilier", fontsize=7.5, color="#1E2B37")
    
    ax.add_patch(patches.FancyBboxPatch((0.4, 2.5), 3.4, 0.75, boxstyle="round,pad=0.04", facecolor="#F0FDF4", edgecolor="#16A34A"))
    ax.text(0.6, 2.95, "Validation requise par le service RH", fontsize=7.5, fontweight='bold', color="#15803D")
    ax.text(0.6, 2.7, "Document officiel généré en PDF avec cachet Kilani", fontsize=6.8, color="#166534")
    
    ax.add_patch(patches.FancyBboxPatch((0.4, 1.2), 3.4, 0.55, boxstyle="round,pad=0.05", facecolor="#B89B72"))
    ax.text(2.1, 1.47, "Envoyer la demande RH", fontsize=9, fontweight='bold', ha='center', color="#FFFFFF")

create_mobile_screen("Demande d'Attestation", draw_create_attest, "capture_08_create_attestation.png")

# 9. Attestation PDF Generated
fig, ax = plt.subplots(figsize=(6, 8.0), dpi=250)
ax.set_xlim(0, 6)
ax.set_ylim(0, 8.0)
ax.axis('off')
ax.add_patch(patches.Rectangle((0.2, 0.2), 5.6, 7.6, facecolor="#FFFFFF", edgecolor="#94A3B8", lw=1.5))
# Header Kilani
ax.text(3.0, 7.3, "GROUPE KILANI", fontsize=14, fontweight='bold', ha='center', color="#1E2B37")
ax.text(3.0, 7.05, "Direction des Ressources Humaines", fontsize=9, ha='center', color="#B89B72")
ax.plot([0.8, 5.2], [6.85, 6.85], color="#CBD5E1", lw=1)

ax.text(3.0, 6.2, "ATTESTATION DE SALAIRE", fontsize=12, fontweight='bold', ha='center', color="#1E2B37")
ax.text(4.8, 5.7, "Tunis, le 10 Juillet 2026", fontsize=7.5, ha='right', color="#64748B")

corps = [
    "Nous soussignés, KILANI GROUP, attestons par la présente que :",
    "Monsieur Youssef TRABELSI",
    "Matricule : EMP001",
    "Fonction : Ingénieur Réseau au sein du département Logistique",
    "Date d'embauche : 15 Septembre 2022",
    "",
    "Perçoit une rémunération mensuelle nette régulière et ne fait l'objet",
    "d'aucune procédure d'opposition sur salaire.",
    "",
    "La présente attestation est délivrée à la demande de l'intéressé",
    "pour servir et valoir ce que de droit auprès de : Banque BH."
]
y_text = 5.2
for l in corps:
    ax.text(0.8, y_text, l, fontsize=7.5, color="#1E293B", fontweight=('bold' if 'Monsieur' in l or 'Matricule' in l else 'normal'))
    y_text -= 0.28

# Signature box
ax.add_patch(patches.Rectangle((3.5, 1.2), 1.8, 1.2, facecolor="#F8FAFC", edgecolor="#CBD5E1"))
ax.text(4.4, 2.15, "Pour la Direction RH", fontsize=7.5, ha='center', color="#64748B")
ax.text(4.4, 1.7, "Cachet & Signature\nKilani Group", fontsize=8, fontweight='bold', ha='center', color="#1E2B37")

plt.tight_layout()
plt.savefig(f"{out_dir}/capture_09_attestation_pdf.png", dpi=250)
plt.close()

# 10. Swagger UI
fig, ax = plt.subplots(figsize=(9, 5.5), dpi=250)
ax.set_xlim(0, 9)
ax.set_ylim(0, 5.5)
ax.axis('off')
ax.add_patch(patches.Rectangle((0, 0), 9, 5.5, facecolor="#F8FAFC"))
ax.add_patch(patches.Rectangle((0, 4.6), 9, 0.9, facecolor="#1B1B1B"))
ax.text(0.5, 5.05, "swagger", fontsize=16, fontweight='bold', color="#85EA2D")
ax.text(2.2, 5.05, "Kilani HR REST API v1.0.0", fontsize=12, fontweight='bold', color="#FFFFFF")
ax.add_patch(patches.FancyBboxPatch((7.2, 4.85), 1.4, 0.4, boxstyle="round,pad=0.03", facecolor="#4990E2"))
ax.text(7.9, 5.02, "Authorize (JWT)", fontsize=7.5, fontweight='bold', ha='center', color="#FFFFFF")

endpoints = [
    ("POST", "/api/auth/login", "Authentification et délivrance du token JWT", "#49CC90"),
    ("GET", "/api/conges/mes-demandes", "Récupérer la liste des congés de l'utilisateur", "#61AFFE"),
    ("POST", "/api/conges/demandes", "Créer une demande de congé avec calcul de solde", "#49CC90"),
    ("POST", "/api/conges/valider", "Validation à 2 niveaux (Supérieur N+1 / RH)", "#FCA130"),
    ("POST", "/api/ai/chat", "Assistant IA conversationnel Google Gemini", "#49CC90"),
    ("GET", "/api/attestations/:id/pdf", "Téléchargement du document PDF généré", "#61AFFE")
]
y_ep = 4.0
for method, route, desc, col in endpoints:
    ax.add_patch(patches.FancyBboxPatch((0.5, y_ep), 8.0, 0.48, boxstyle="round,pad=0.02", facecolor="#FFFFFF", edgecolor=col, lw=1))
    ax.add_patch(patches.Rectangle((0.5, y_ep), 1.2, 0.48, facecolor=col))
    ax.text(1.1, y_ep + 0.22, method, fontsize=8, fontweight='bold', ha='center', va='center', color="#FFFFFF")
    ax.text(1.9, y_ep + 0.24, route, fontsize=8, fontweight='bold', color="#0F172A")
    ax.text(5.0, y_ep + 0.24, desc, fontsize=7.5, color="#64748B")
    y_ep -= 0.62

plt.tight_layout()
plt.savefig(f"{out_dir}/capture_10_swagger_api.png", dpi=250)
plt.close()

print("More mockups generated successfully!")
