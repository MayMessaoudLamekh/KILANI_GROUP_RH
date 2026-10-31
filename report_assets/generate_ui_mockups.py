import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
import os

out_dir = '/Users/maymessaoud/kilani_hr_app/report_assets/screenshots'
os.makedirs(out_dir, exist_ok=True)
plt.rcParams['font.sans-serif'] = 'Helvetica'
plt.rcParams['font.family'] = 'sans-serif'

# Helper for Mobile Screen Mockup
def create_mobile_screen(title, content_func, filename):
    fig, ax = plt.subplots(figsize=(4.2, 7.5), dpi=250)
    ax.set_xlim(0, 4.2)
    ax.set_ylim(0, 7.5)
    ax.axis('off')
    
    # Phone frame
    ax.add_patch(patches.FancyBboxPatch((0.1, 0.1), 4.0, 7.3, boxstyle="round,pad=0.15", facecolor="#F8F9FA", edgecolor="#1E2B37", lw=3))
    
    # Status bar (notch / dynamic island)
    ax.add_patch(patches.FancyBboxPatch((1.4, 7.05), 1.4, 0.22, boxstyle="round,pad=0.05", facecolor="#000000"))
    ax.text(0.5, 7.15, "09:41", fontsize=7.5, fontweight='bold', color="#1E2B37")
    ax.text(3.7, 7.15, "5G  100%", fontsize=7, fontweight='bold', ha='right', color="#1E2B37")
    
    # Top App Bar
    ax.add_patch(patches.Rectangle((0.15, 6.35), 3.9, 0.65, facecolor="#1E2B37"))
    ax.text(2.1, 6.68, title, fontsize=10, fontweight='bold', ha='center', color="#FFFFFF")
    
    # Custom Content
    content_func(ax)
    
    # Bottom Navigation bar indicator
    ax.add_patch(patches.FancyBboxPatch((1.5, 0.25), 1.2, 0.08, boxstyle="round,pad=0.02", facecolor="#1E2B37"))
    
    plt.tight_layout()
    plt.savefig(f"{out_dir}/{filename}", dpi=250)
    plt.close()

# 1. Login Mobile
def draw_login(ax):
    # Logo Kilani
    ax.add_patch(patches.Circle((2.1, 5.3), 0.5, facecolor="#B89B72", edgecolor="#1E2B37", lw=1.5))
    ax.text(2.1, 5.25, "KILANI", fontsize=8, fontweight='bold', ha='center', color="#FFFFFF")
    ax.text(2.1, 4.5, "Portail RH Collaborateur", fontsize=11, fontweight='bold', ha='center', color="#1E2B37")
    ax.text(2.1, 4.2, "Connectez-vous avec votre matricule", fontsize=7.5, ha='center', color="#6C757D")
    
    # Inputs
    ax.add_patch(patches.FancyBboxPatch((0.5, 3.4), 3.2, 0.5, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1))
    ax.text(0.7, 3.65, "Matricule (ex: EMP001)", fontsize=8, color="#94A3B8")
    
    ax.add_patch(patches.FancyBboxPatch((0.5, 2.7), 3.2, 0.5, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1))
    ax.text(0.7, 2.95, "••••••••••••", fontsize=9, color="#1E2B37")
    
    # Button
    ax.add_patch(patches.FancyBboxPatch((0.5, 1.8), 3.2, 0.55, boxstyle="round,pad=0.06", facecolor="#1E2B37"))
    ax.text(2.1, 2.07, "Se connecter", fontsize=9.5, fontweight='bold', ha='center', color="#FFFFFF")
    
    ax.text(2.1, 1.3, "Mot de passe oublié ? Contactez le service RH", fontsize=7, ha='center', color="#B89B72")

create_mobile_screen("Connexion Kilani HR", draw_login, "capture_01_login_mobile.png")

# 2. Dashboard Mobile
def draw_dashboard(ax):
    # Welcome card
    ax.add_patch(patches.FancyBboxPatch((0.4, 5.2), 3.4, 0.95, boxstyle="round,pad=0.05", facecolor="#1E2B37"))
    ax.text(0.6, 5.8, "Bonjour, Youssef Trabelsi", fontsize=9.5, fontweight='bold', color="#FFFFFF")
    ax.text(0.6, 5.5, "Ingénieur Réseau • Logistique", fontsize=7.5, color="#CBD5E1")
    ax.text(0.6, 5.3, "Site : Siège Charguia", fontsize=7, color="#B89B72")
    
    # Leave Balance KPI
    ax.add_patch(patches.FancyBboxPatch((0.4, 4.0), 3.4, 1.05, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#B89B72", lw=1.5))
    ax.text(0.6, 4.75, "SOLDE DE CONGÉS DISPONIBLE", fontsize=7.5, fontweight='bold', color="#B89B72")
    ax.text(0.6, 4.3, "15.00 Jours", fontsize=15, fontweight='bold', color="#1E2B37")
    ax.text(2.4, 4.35, "+1.75 j / mois", fontsize=8, color="#16A34A", fontweight='bold')
    
    # Quick Actions
    ax.text(0.4, 3.65, "Actions Rapides", fontsize=8.5, fontweight='bold', color="#1E2B37")
    actions = [("Demande Congé", 0.4, 2.8), ("Ordre Mission", 2.15, 2.8), ("Attestation", 0.4, 1.9), ("Assistant IA", 2.15, 1.9)]
    for atitle, ax_pos, ay_pos in actions:
        ax.add_patch(patches.FancyBboxPatch((ax_pos, ay_pos), 1.65, 0.7, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1))
        ax.text(ax_pos + 0.82, ay_pos + 0.35, atitle, fontsize=7.5, fontweight='bold', ha='center', color="#1E2B37")
    
    # Recent Request status
    ax.add_patch(patches.FancyBboxPatch((0.4, 0.9), 3.4, 0.85, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor="#CBD5E1", lw=1))
    ax.text(0.6, 1.45, "Dernière demande : Congé Annuel (3j)", fontsize=7.5, fontweight='bold', color="#1E2B37")
    ax.text(0.6, 1.2, "Du 01/07 au 03/07/2026", fontsize=7, color="#64748B")
    ax.add_patch(patches.FancyBboxPatch((2.7, 1.15), 0.9, 0.3, boxstyle="round,pad=0.02", facecolor="#DCFCE7", edgecolor="#16A34A"))
    ax.text(3.15, 1.3, "VALIDÉ", fontsize=6.5, fontweight='bold', ha='center', color="#15803D")

create_mobile_screen("Tableau de Bord RH", draw_dashboard, "capture_02_dashboard_mobile.png")

# 3. Create Leave Mobile
def draw_create_leave(ax):
    # Form fields
    ax.text(0.4, 5.9, "Motif du congé", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 5.4), 3.4, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 5.6, "Congé annuel (Déduit du solde)", fontsize=7.5, color="#1E2B37")
    
    ax.text(0.4, 5.1, "Type de congé", fontsize=8, fontweight='bold', color="#1E2B37")
    types = [("Journée", 0.4, True), ("Demi-journée", 1.55, False), ("Quart", 2.8, False)]
    for tlabel, tx_pos, is_sel in types:
        bg = "#1E2B37" if is_sel else "#FFFFFF"
        fg = "#FFFFFF" if is_sel else "#64748B"
        ax.add_patch(patches.FancyBboxPatch((tx_pos, 4.6), 1.0, 0.38, boxstyle="round,pad=0.03", facecolor=bg, edgecolor="#1E2B37"))
        ax.text(tx_pos + 0.5, 4.78, tlabel, fontsize=7, fontweight='bold', ha='center', color=fg)
    
    # Dates
    ax.text(0.4, 4.3, "Période du congé", fontsize=8, fontweight='bold', color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 3.8), 1.6, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.55, 4.0, "Début: 10/08/2026", fontsize=7, color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((2.2, 3.8), 1.6, 0.42, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(2.35, 4.0, "Fin: 12/08/2026", fontsize=7, color="#1E2B37")
    
    # Auto calculated summary
    ax.add_patch(patches.FancyBboxPatch((0.4, 2.8), 3.4, 0.8, boxstyle="round,pad=0.04", facecolor="#EFF6FF", edgecolor="#3B82F6", lw=1))
    ax.text(0.6, 3.35, "Calcul automatique : 3 jours (24 heures)", fontsize=8, fontweight='bold', color="#1E40AF")
    ax.text(0.6, 3.05, "Solde actuel: 15.00 j  ->  Nouveau solde: 12.00 j", fontsize=7.5, color="#1D4ED8")
    
    # Comment
    ax.text(0.4, 2.5, "Commentaire (optionnel)", fontsize=8, color="#1E2B37")
    ax.add_patch(patches.FancyBboxPatch((0.4, 1.8), 3.4, 0.6, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 2.15, "Mariage familial à Sfax", fontsize=7.5, color="#64748B")
    
    # Submit button
    ax.add_patch(patches.FancyBboxPatch((0.4, 0.9), 3.4, 0.55, boxstyle="round,pad=0.05", facecolor="#B89B72"))
    ax.text(2.1, 1.17, "Soumettre la demande", fontsize=9, fontweight='bold', ha='center', color="#FFFFFF")

create_mobile_screen("Demande de Congé", draw_create_leave, "capture_03_create_leave.png")

# 4. AI Chat Mobile
def draw_ai_chat(ax):
    # Chat header
    ax.add_patch(patches.FancyBboxPatch((0.4, 5.6), 3.4, 0.65, boxstyle="round,pad=0.03", facecolor="#F0F9FF", edgecolor="#0EA5E9"))
    ax.text(2.1, 5.95, "Assistant RH Intelligent (Gemini)", fontsize=8, fontweight='bold', ha='center', color="#0369A1")
    ax.text(2.1, 5.75, "Consulte vos soldes & la politique Kilani", fontsize=6.8, ha='center', color="#0284C7")
    
    # User message
    ax.add_patch(patches.FancyBboxPatch((1.0, 4.6), 2.8, 0.75, boxstyle="round,pad=0.04", facecolor="#1E2B37"))
    ax.text(1.2, 5.05, "Combien de jours me reste-t-il", fontsize=7.5, color="#FFFFFF")
    ax.text(1.2, 4.8, "et puis-je prendre 4 jours en août ?", fontsize=7.5, color="#FFFFFF")
    
    # Bot message
    ax.add_patch(patches.FancyBboxPatch((0.4, 2.6), 3.4, 1.8, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor="#E2E8F0", lw=1.2))
    bot_reply = [
        "Bonjour Youssef ! D'après vos données RH :",
        "• Votre solde actuel est de 15,00 jours.",
        "• Vous recevrez +1,75 jour le 1er août.",
        "• Vous pouvez tout à fait poser 4 jours.",
        "N'oubliez pas de soumettre au moins 48h",
        "à l'avance pour la validation de Karim Ben Salah."
    ]
    cur_y = 4.1
    for line in bot_reply:
        ax.text(0.6, cur_y, line, fontsize=7.2, color="#1E293B")
        cur_y -= 0.26
        
    # Input bottom
    ax.add_patch(patches.FancyBboxPatch((0.4, 0.9), 2.7, 0.5, boxstyle="round,pad=0.03", facecolor="#FFFFFF", edgecolor="#CBD5E1"))
    ax.text(0.6, 1.15, "Posez une question à l'assistant...", fontsize=7, color="#94A3B8")
    ax.add_patch(patches.Circle((3.5, 1.15), 0.25, facecolor="#B89B72"))
    ax.text(3.5, 1.12, ">", fontsize=8, ha='center', color="#FFFFFF")

create_mobile_screen("Assistant RH IA", draw_ai_chat, "capture_04_ai_assistant.png")

# 5. Back-Office Web Dashboard (Recharts / KPIs)
fig, ax = plt.subplots(figsize=(10, 6.0), dpi=250)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.0)
ax.axis('off')

# Background
ax.add_patch(patches.Rectangle((0, 0), 10, 6.0, facecolor="#F1F5F9"))

# Sidebar
ax.add_patch(patches.Rectangle((0, 0), 2.2, 6.0, facecolor="#1E2B37"))
ax.text(1.1, 5.5, "KILANI GROUP", fontsize=11, fontweight='bold', ha='center', color="#B89B72")
ax.text(1.1, 5.25, "Portail d'Administration RH", fontsize=7, ha='center', color="#94A3B8")

nav_items = [" Tableau de Bord", " Collaborateurs", " Gestion des Congés", " Ordres de Mission", " Attestations RH", " Motifs & Paramètres"]
for idx, item in enumerate(nav_items):
    bg_color = "#334155" if idx == 0 else "#1E2B37"
    ax.add_patch(patches.FancyBboxPatch((0.15, 4.4 - idx*0.55), 1.9, 0.42, boxstyle="round,pad=0.02", facecolor=bg_color))
    ax.text(0.3, 4.62 - idx*0.55, item, fontsize=7.5, color="#FFFFFF", fontweight=('bold' if idx==0 else 'normal'))

# Topbar
ax.add_patch(patches.Rectangle((2.2, 5.3), 7.8, 0.7, facecolor="#FFFFFF", edgecolor="#E2E8F0"))
ax.text(2.6, 5.65, "Vue d'ensemble et Pilotage RH", fontsize=11, fontweight='bold', color="#0F172A")
ax.text(9.5, 5.65, "Monia Ben Ahmed (RH)", fontsize=8, ha='right', color="#475569")

# KPI Cards
kpis = [
    ("Effectif Total", "248", "Collaborateurs", "#3B82F6", 2.5),
    ("Congés en attente", "12", "À traiter N+1/RH", "#F59E0B", 4.4),
    ("Missions du mois", "28", "Validées", "#10B981", 6.3),
    ("Attestations générées", "45", "Format PDF", "#8B5CF6", 8.2)
]
for title, val, sub, col, px in kpis:
    ax.add_patch(patches.FancyBboxPatch((px, 4.0), 1.7, 1.05, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor=col, lw=1.5))
    ax.text(px + 0.15, 4.8, title, fontsize=7.5, color="#64748B", fontweight='bold')
    ax.text(px + 0.15, 4.35, val, fontsize=16, fontweight='bold', color=col)
    ax.text(px + 0.15, 4.12, sub, fontsize=6.8, color="#94A3B8")

# Chart 1: Répartition des motifs de congés (Pie Chart simulated)
ax.add_patch(patches.FancyBboxPatch((2.5, 0.6), 3.4, 3.1, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor="#E2E8F0"))
ax.text(2.7, 3.45, "Répartition des Congés par Motif", fontsize=8.5, fontweight='bold', color="#1E293B")
# Circle pie
ax.add_patch(patches.Wedge((4.2, 2.0), 1.0, 0, 180, facecolor="#3B82F6"))
ax.add_patch(patches.Wedge((4.2, 2.0), 1.0, 180, 260, facecolor="#10B981"))
ax.add_patch(patches.Wedge((4.2, 2.0), 1.0, 260, 310, facecolor="#F59E0B"))
ax.add_patch(patches.Wedge((4.2, 2.0), 1.0, 310, 360, facecolor="#EC4899"))
ax.text(4.2, 0.75, "- Annuel (50%)  - Maladie (22%)  - Événement (14%)", fontsize=6.5, ha='center', color="#64748B")

# Table / Chart 2: Dernières demandes de validation
ax.add_patch(patches.FancyBboxPatch((6.2, 0.6), 3.6, 3.1, boxstyle="round,pad=0.04", facecolor="#FFFFFF", edgecolor="#E2E8F0"))
ax.text(6.4, 3.45, "Demandes Récentes à Valider", fontsize=8.5, fontweight='bold', color="#1E293B")
headers = ["Employé", "Type", "Durée", "Statut"]
ax.text(6.4, 3.1, "Youssef Trabelsi • Congé annuel • 3j • Validé N+1", fontsize=7, color="#334155")
ax.text(6.4, 2.7, "Amira Saidi • Attest. Salaire • Banque BH • En attente", fontsize=7, color="#334155")
ax.text(6.4, 2.3, "Karim Ben Salah • Mission Sfax • 2j • En attente RH", fontsize=7, color="#334155")
ax.text(6.4, 1.9, "Youssef Trabelsi • Mission Formation • 2j • En attente", fontsize=7, color="#334155")
ax.add_patch(patches.FancyBboxPatch((6.4, 1.0), 3.2, 0.5, boxstyle="round,pad=0.03", facecolor="#1E2B37"))
ax.text(8.0, 1.25, "Exporter le rapport mensuel (Excel / PDF)", fontsize=7.5, fontweight='bold', ha='center', color="#FFFFFF")

plt.tight_layout()
plt.savefig(f"{out_dir}/capture_05_backoffice_dashboard.png", dpi=250)
plt.close()
print("Generated capture_05_backoffice_dashboard.png")

print("All mockups generated successfully!")
