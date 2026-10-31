import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

out_dir = '/Users/maymessaoud/kilani_hr_app/report_assets/figures'
os.makedirs(out_dir, exist_ok=True)
plt.rcParams['font.sans-serif'] = 'Helvetica'
plt.rcParams['font.family'] = 'sans-serif'

# ==========================================
# 2. Figure 2.2 - Diagramme de Classes / Entité-Association
# ==========================================
fig, ax = plt.subplots(figsize=(12, 8.5), dpi=300)
ax.set_xlim(0, 12)
ax.set_ylim(0, 8.5)
ax.axis('off')

ax.text(6.0, 8.1, "Modèle Conceptuel de Données - KilaniHRDB", fontsize=14, fontweight='bold', ha='center', color="#0F172A")

def draw_class(ax, x, y, w, h, title, fields, color_head="#1E3A8A", color_bg="#F8FAFC", border_color="#3B82F6"):
    # Box
    ax.add_patch(patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.04", facecolor=color_bg, edgecolor=border_color, linewidth=1.5))
    # Header
    ax.add_patch(patches.Rectangle((x, y + h - 0.5), w, 0.5, facecolor=color_head))
    ax.text(x + w/2, y + h - 0.28, title, fontsize=9, fontweight='bold', ha='center', va='center', color="#FFFFFF")
    # Content
    cur_y = y + h - 0.75
    for f in fields:
        ax.text(x + 0.15, cur_y, f, fontsize=7.5, va='center', color="#334155")
        cur_y -= 0.26

# Utilisateurs
fields_user = [
    "+ matricule: NVARCHAR(50) [PK]",
    "+ nom, prenom: NVARCHAR(100)",
    "+ email: NVARCHAR(150) [UNIQUE]",
    "+ password_hash: NVARCHAR(255)",
    "+ fonction, site, service: NVARCHAR(100)",
    "+ statut: NVARCHAR(30) [ROLE]",
    "+ solde_conge: DECIMAL(5,2)",
    "+ droit_mensuel: DECIMAL(4,2)",
    "+ superieur_hierarchique: NVARCHAR(50) [FK]"
]
draw_class(ax, 4.3, 4.8, 3.4, 2.9, "Utilisateurs (Comptes & Rôles)", fields_user, "#1E40AF", "#EFF6FF", "#3B82F6")

# Conges
fields_conges = [
    "+ id: INT [PK]",
    "+ matricule: NVARCHAR(50) [FK]",
    "+ motif_id: INT [FK]",
    "+ type_conge: NVARCHAR(30)",
    "+ jour_debut, jour_fin: DATE",
    "+ nombre_jours, nombre_heures: DECIMAL",
    "+ acceptation_superieur: NVARCHAR(20)",
    "+ acceptation_ressource: NVARCHAR(20)",
    "+ solde_conge_moment: DECIMAL(5,2)"
]
draw_class(ax, 0.5, 3.8, 3.3, 3.0, "Conges (Demandes d'absence)", fields_conges, "#047857", "#ECFDF5", "#10B981")

# Motifs_Conge
fields_motifs = [
    "+ id: INT [PK]",
    "+ libelle: NVARCHAR(100)",
    "+ description: NVARCHAR(255)",
    "+ nombre_max_jours: INT",
    "+ impact_solde: BIT",
    "+ validation_hierarchique: BIT",
    "+ actif: BIT"
]
draw_class(ax, 0.5, 0.6, 3.3, 2.4, "Motifs_Conge (Paramétrage)", fields_motifs, "#0F766E", "#F0FDFA", "#14B8A6")

# Missions
fields_missions = [
    "+ id: INT [PK]",
    "+ matricule: NVARCHAR(50) [FK]",
    "+ objet, destination: NVARCHAR(255)",
    "+ jour_debut, jour_fin: DATE",
    "+ moyen_transport: NVARCHAR(100)",
    "+ acceptation_superieur: NVARCHAR(20)",
    "+ acceptation_ressource: NVARCHAR(20)",
    "+ pdf_url: NVARCHAR(500)"
]
draw_class(ax, 4.3, 1.0, 3.4, 2.8, "Missions (Ordres de mission)", fields_missions, "#7C2D12", "#FFF7ED", "#F97316")

# Attestations
fields_attest = [
    "+ id: INT [PK]",
    "+ matricule: NVARCHAR(50) [FK]",
    "+ titre_attestation: NVARCHAR(150)",
    "+ intitule: NVARCHAR(200)",
    "+ etat_demande: NVARCHAR(20)",
    "+ details: NVARCHAR(MAX) [JSON]",
    "+ pdf_url: NVARCHAR(500)",
    "+ approbateur_rh: NVARCHAR(50) [FK]"
]
draw_class(ax, 8.2, 4.8, 3.3, 2.8, "Attestations (Demandes)", fields_attest, "#6B21A8", "#FAF5FF", "#A855F7")

# Types_Attestation
fields_type_attest = [
    "+ id: INT [PK]",
    "+ code: NVARCHAR(50)",
    "+ libelle: NVARCHAR(100)",
    "+ champs_complementaires: JSON",
    "+ validation_rh_requise: BIT",
    "+ actif: BIT"
]
draw_class(ax, 8.2, 2.2, 3.3, 2.2, "Types_Attestation (Modèles)", fields_type_attest, "#4C1D95", "#F5F3FF", "#8B5CF6")

# AiChats & AiMessages
fields_ai = [
    "+ id: INT [PK] | matricule [FK]",
    "+ titre: NVARCHAR(255)",
    "-- Table AiMessages --",
    "+ chat_id: INT [FK]",
    "+ role: 'user' | 'model'",
    "+ content: NVARCHAR(MAX)"
]
draw_class(ax, 8.2, 0.4, 3.3, 1.6, "AiChats & AiMessages (IA)", fields_ai, "#0369A1", "#F0F9FF", "#0EA5E9")

# Links and Cardinalities
ax.annotate('', xy=(3.8, 5.3), xytext=(4.3, 5.3), arrowprops=dict(arrowstyle="<-", color="#1E3A8A", lw=1.5))
ax.text(4.0, 5.45, "1..*", fontsize=7.5, fontweight='bold', color="#1E40AF")

ax.annotate('', xy=(2.1, 3.8), xytext=(2.1, 3.0), arrowprops=dict(arrowstyle="->", color="#047857", lw=1.5))
ax.text(2.25, 3.35, "concerne\n1..1", fontsize=7.5, color="#047857")

ax.annotate('', xy=(6.0, 4.8), xytext=(6.0, 3.8), arrowprops=dict(arrowstyle="<-", color="#EA580C", lw=1.5))
ax.text(6.15, 4.25, "1..*", fontsize=7.5, fontweight='bold', color="#EA580C")

ax.annotate('', xy=(7.7, 5.8), xytext=(8.2, 5.8), arrowprops=dict(arrowstyle="->", color="#6B21A8", lw=1.5))
ax.text(7.9, 5.95, "1..*", fontsize=7.5, fontweight='bold', color="#6B21A8")

ax.annotate('', xy=(9.8, 4.8), xytext=(9.8, 4.4), arrowprops=dict(arrowstyle="->", color="#8B5CF6", lw=1.5))
ax.text(10.0, 4.55, "type", fontsize=7.5, color="#8B5CF6")

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_2_2_data_model.png", dpi=300)
plt.close()
print("Generated figure_2_2_data_model.png")


# ==========================================
# 3. Figure 3.1 - Diagramme de Cas d'Utilisation
# ==========================================
fig, ax = plt.subplots(figsize=(11, 7.5), dpi=300)
ax.set_xlim(0, 11)
ax.set_ylim(0, 7.5)
ax.axis('off')

ax.text(5.5, 7.1, "Diagramme Global des Cas d'Utilisation - Système Kilani HR", fontsize=13, fontweight='bold', ha='center', color="#0F172A")

# Box Système
ax.add_patch(patches.FancyBboxPatch((2.6, 0.4), 5.8, 6.4, boxstyle="round,pad=0.1", facecolor="#F8FAFC", edgecolor="#94A3B8", linewidth=1.5))
ax.text(5.5, 6.55, "Application Kilani HR (Mobile & Web)", fontsize=10, fontweight='bold', ha='center', color="#334155")

# Use Cases Inside
use_cases = [
    (5.5, 5.95, "S'authentifier (JWT) / Gérer son profil"),
    (5.5, 5.25, "Effectuer une demande de congé (Jour/Demi/Quart)"),
    (5.5, 4.55, "Consulter le solde de congés en temps réel"),
    (5.5, 3.85, "Soumettre une demande de mission & itinéraire"),
    (5.5, 3.15, "Demander une attestation administrative (Travail/Salaire)"),
    (5.5, 2.45, "Interroger l'assistant virtuel RH (IA Gemini)"),
    (5.5, 1.75, "Valider / Refuser les demandes (N+1 & RH)"),
    (5.5, 1.05, "Piloter le Back-Office (KPIs, CRUD, Motifs, Exports)")
]

for uc_x, uc_y, uc_text in use_cases:
    ax.add_patch(patches.FancyBboxPatch((uc_x - 2.5, uc_y - 0.25), 5.0, 0.5, boxstyle="round,pad=0.08", facecolor="#FFFFFF", edgecolor="#3B82F6", linewidth=1.2))
    ax.text(uc_x, uc_y, uc_text, fontsize=8, ha='center', va='center', color="#1E293B")

# Acteurs
actors_left = [
    (1.2, 4.8, "Employé\n(Collaborateur)", "#1E40AF"),
    (1.2, 2.2, "Responsable\nHiérarchique (N+1)", "#D97706")
]
actors_right = [
    (9.8, 4.0, "Ressources\nHumaines (RH)", "#059669"),
    (9.8, 1.4, "Administrateur\nSystème", "#DC2626")
]

for act_x, act_y, act_label, act_color in actors_left + actors_right:
    # Actor symbol (circle head + text)
    ax.add_patch(patches.Circle((act_x, act_y + 0.35), 0.22, facecolor=act_color, edgecolor="#FFFFFF", lw=1.5))
    ax.text(act_x, act_y - 0.15, act_label, fontsize=8, fontweight='bold', ha='center', color=act_color)

# Connecting lines (Actor to UC)
# Employé links
ax.annotate('', xy=(2.9, 5.95), xytext=(1.5, 5.0), arrowprops=dict(arrowstyle="-", color="#94A3B8", lw=1))
ax.annotate('', xy=(2.9, 5.25), xytext=(1.5, 5.0), arrowprops=dict(arrowstyle="-", color="#94A3B8", lw=1))
ax.annotate('', xy=(2.9, 4.55), xytext=(1.5, 5.0), arrowprops=dict(arrowstyle="-", color="#94A3B8", lw=1))
ax.annotate('', xy=(2.9, 3.85), xytext=(1.5, 5.0), arrowprops=dict(arrowstyle="-", color="#94A3B8", lw=1))
ax.annotate('', xy=(2.9, 3.15), xytext=(1.5, 5.0), arrowprops=dict(arrowstyle="-", color="#94A3B8", lw=1))
ax.annotate('', xy=(2.9, 2.45), xytext=(1.5, 5.0), arrowprops=dict(arrowstyle="-", color="#94A3B8", lw=1))

# N+1 links
ax.annotate('', xy=(2.9, 1.75), xytext=(1.5, 2.4), arrowprops=dict(arrowstyle="-", color="#D97706", lw=1.2))

# RH links
ax.annotate('', xy=(8.1, 1.75), xytext=(9.5, 4.0), arrowprops=dict(arrowstyle="-", color="#059669", lw=1.2))
ax.annotate('', xy=(8.1, 1.05), xytext=(9.5, 4.0), arrowprops=dict(arrowstyle="-", color="#059669", lw=1.2))
ax.annotate('', xy=(8.1, 3.15), xytext=(9.5, 4.0), arrowprops=dict(arrowstyle="-", color="#059669", lw=1.2))

# Admin links
ax.annotate('', xy=(8.1, 1.05), xytext=(9.5, 1.6), arrowprops=dict(arrowstyle="-", color="#DC2626", lw=1.2))

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_3_1_use_case.png", dpi=300)
plt.close()
print("Generated figure_3_1_use_case.png")


# ==========================================
# 4. Figure 3.2 - Diagramme de Séquence (Authentification)
# ==========================================
fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.5)
ax.axis('off')

ax.text(5.0, 6.1, "Diagramme de Séquence - Authentification Sécurisée JWT & Contrôle RBAC", fontsize=12, fontweight='bold', ha='center', color="#0F172A")

lifelines = [
    (1.2, "Application Mobile\n/ Back-Office", "#1E3A8A"),
    (4.5, "API REST\n(server.js)", "#15803D"),
    (8.2, "SQL Server\n(KilaniHRDB)", "#B91C1C")
]

for lx, ltitle, lcolor in lifelines:
    ax.add_patch(patches.FancyBboxPatch((lx - 1.0, 5.2), 2.0, 0.65, boxstyle="round,pad=0.05", facecolor=lcolor))
    ax.text(lx, 5.52, ltitle, fontsize=8, fontweight='bold', ha='center', color="#FFFFFF")
    ax.plot([lx, lx], [0.8, 5.2], color="#94A3B8", linestyle="--", lw=1.5)

# Messages
steps = [
    (4.6, 1.2, 4.5, "POST /api/auth/login {identifiant, mot_de_passe}", True),
    (4.0, 4.5, 8.2, "SELECT * FROM Utilisateurs WHERE matricule/email=?", True),
    (3.4, 8.2, 4.5, "Données utilisateur + password_hash", False),
    (2.8, 4.5, 4.5, "Vérification SHA256 & État du compte ('Actif')", False, "self"),
    (2.2, 4.5, 1.2, "200 OK + JWT Token {matricule, rôle, nom} (Expire 24h)", False),
    (1.4, 1.2, 4.5, "GET /api/conges/mes-demandes [Header: Bearer JWT]", True),
    (0.8, 4.5, 1.2, "200 OK + Liste filtrée selon le rôle & matricule", False)
]

for item in steps:
    y = item[0]
    x1, x2 = item[1], item[2]
    label = item[3]
    is_fwd = item[4]
    if len(item) == 6 and item[5] == "self":
        ax.annotate('', xy=(x1+0.6, y-0.2), xytext=(x1, y), arrowprops=dict(arrowstyle="->", color="#0F172A", lw=1.2))
        ax.text(x1 + 0.8, y - 0.1, label, fontsize=7.5, color="#1E293B")
    else:
        style = "->" if is_fwd else "<-"
        color = "#2563EB" if is_fwd else "#059669"
        ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle=style, color=color, lw=1.3))
        ax.text((x1 + x2)/2, y + 0.12, label, fontsize=7.5, ha='center', color="#0F172A")

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_3_2_sequence_auth.png", dpi=300)
plt.close()
print("Generated figure_3_2_sequence_auth.png")


# ==========================================
# 5. Figure 3.3 - Cycle de vie d'une demande de congé
# ==========================================
fig, ax = plt.subplots(figsize=(10, 6.0), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.0)
ax.axis('off')

ax.text(5.0, 5.6, "Diagramme d'États-Transitions - Cycle de Vie d'une Demande de Congé", fontsize=12, fontweight='bold', ha='center', color="#0F172A")

# States
# Initial
ax.add_patch(patches.Circle((1.0, 3.5), 0.15, facecolor="#0F172A"))
# En attente N+1
ax.add_patch(patches.FancyBboxPatch((2.2, 3.0), 1.8, 1.0, boxstyle="round,pad=0.08", facecolor="#FEF3C7", edgecolor="#F59E0B", lw=1.5))
ax.text(3.1, 3.5, "En attente\n(Supérieur N+1)", fontsize=8, fontweight='bold', ha='center', va='center', color="#92400E")

# Validé N+1 / En attente RH
ax.add_patch(patches.FancyBboxPatch((5.2, 3.0), 1.8, 1.0, boxstyle="round,pad=0.08", facecolor="#E0F2FE", edgecolor="#0284C7", lw=1.5))
ax.text(6.1, 3.5, "Validé N+1\n(En attente RH)", fontsize=8, fontweight='bold', ha='center', va='center', color="#075985")

# Validé Définitif
ax.add_patch(patches.FancyBboxPatch((8.0, 3.0), 1.6, 1.0, boxstyle="round,pad=0.08", facecolor="#DCFCE7", edgecolor="#16A34A", lw=1.5))
ax.text(8.8, 3.5, "Validé Définitif\n(Solde déduit)", fontsize=8, fontweight='bold', ha='center', va='center', color="#166534")

# Refusé
ax.add_patch(patches.FancyBboxPatch((5.2, 0.8), 1.8, 0.9, boxstyle="round,pad=0.08", facecolor="#FEE2E2", edgecolor="#DC2626", lw=1.5))
ax.text(6.1, 1.25, "Refusé\n(Solde préservé)", fontsize=8, fontweight='bold', ha='center', va='center', color="#991B1B")

# Annulé
ax.add_patch(patches.FancyBboxPatch((2.2, 0.8), 1.8, 0.9, boxstyle="round,pad=0.08", facecolor="#F1F5F9", edgecolor="#64748B", lw=1.5))
ax.text(3.1, 1.25, "Annulé par l'employé\n(Avant validation finale)", fontsize=7.5, ha='center', va='center', color="#334155")

# Arrows
ax.annotate('', xy=(2.2, 3.5), xytext=(1.2, 3.5), arrowprops=dict(arrowstyle="->", color="#0F172A", lw=1.5))
ax.text(1.7, 3.7, "Soumission", fontsize=7.5, ha='center', color="#475569")

ax.annotate('', xy=(5.2, 3.5), xytext=(4.0, 3.5), arrowprops=dict(arrowstyle="->", color="#0284C7", lw=1.5))
ax.text(4.6, 3.75, "Validation N+1", fontsize=7.5, ha='center', color="#0369A1", fontweight='bold')

ax.annotate('', xy=(8.0, 3.5), xytext=(7.0, 3.5), arrowprops=dict(arrowstyle="->", color="#16A34A", lw=1.5))
ax.text(7.5, 3.75, "Validation RH\n(Définitif)", fontsize=7.5, ha='center', color="#15803D", fontweight='bold')

# Rejections
ax.annotate('', xy=(5.5, 1.7), xytext=(3.5, 3.0), arrowprops=dict(arrowstyle="->", color="#DC2626", lw=1.3))
ax.text(4.2, 2.2, "Refus N+1", fontsize=7.5, color="#DC2626")

ax.annotate('', xy=(6.1, 1.7), xytext=(6.1, 3.0), arrowprops=dict(arrowstyle="->", color="#DC2626", lw=1.3))
ax.text(6.25, 2.3, "Refus RH", fontsize=7.5, color="#DC2626")

# Cancellation
ax.annotate('', xy=(3.1, 1.7), xytext=(3.1, 3.0), arrowprops=dict(arrowstyle="->", color="#64748B", lw=1.3))
ax.text(2.6, 2.3, "Annulation", fontsize=7.5, color="#475569")

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_3_3_lifecycle_conge.png", dpi=300)
plt.close()
print("Generated figure_3_3_lifecycle_conge.png")


# ==========================================
# 6. Figure 3.6 - Séquence Assistant IA (Gemini)
# ==========================================
fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.2)
ax.axis('off')

ax.text(5.0, 5.8, "Diagramme de Séquence - Assistant RH Intelligent (Google Gemini)", fontsize=12, fontweight='bold', ha='center', color="#0F172A")

lifelines = [
    (1.2, "Application Mobile\n(ai_chat_screen)", "#1E3A8A"),
    (4.2, "Backend API\n(Express / server.js)", "#15803D"),
    (7.0, "SQL Server\n(KilaniHRDB)", "#B91C1C"),
    (9.0, "Google Gemini AI\n(@google/genai)", "#6B21A8")
]

for lx, ltitle, lcolor in lifelines:
    ax.add_patch(patches.FancyBboxPatch((lx - 0.9, 4.9), 1.8, 0.65, boxstyle="round,pad=0.05", facecolor=lcolor))
    ax.text(lx, 5.22, ltitle, fontsize=7.5, fontweight='bold', ha='center', color="#FFFFFF")
    ax.plot([lx, lx], [0.6, 4.9], color="#94A3B8", linestyle="--", lw=1.5)

steps_ai = [
    (4.3, 1.2, 4.2, "POST /api/ai/chat {message, chat_id}", True),
    (3.7, 4.2, 7.0, "Récupération historique AiMessages + Solde congé employé", True),
    (3.1, 7.0, 4.2, "Contexte RH & solde actuel", False),
    (2.5, 4.2, 9.0, "Envoi prompt enrichi (Politique Kilani + Contexte)", True),
    (1.9, 9.0, 4.2, "Génération de réponse personnalisée en français", False),
    (1.3, 4.2, 7.0, "INSERT AiMessages (role='model', content=...)", True),
    (0.8, 4.2, 1.2, "200 OK {response, chat_id} affichée instantanément", False)
]

for y, x1, x2, label, is_fwd in steps_ai:
    style = "->" if is_fwd else "<-"
    color = "#2563EB" if is_fwd else "#059669"
    ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle=style, color=color, lw=1.3))
    ax.text((x1 + x2)/2, y + 0.12, label, fontsize=7, ha='center', color="#0F172A")

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_3_6_sequence_ai.png", dpi=300)
plt.close()
print("Generated figure_3_6_sequence_ai.png")


# ==========================================
# 7. Figure 4.1 - Gestion Concurrence et Déduction Solde
# ==========================================
fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.2)
ax.axis('off')

ax.text(5.0, 5.8, "Diagramme de Séquence - Intégrité et Cohérence Transactionnelle du Solde", fontsize=11.5, fontweight='bold', ha='center', color="#0F172A")

lifelines_tx = [
    (1.2, "Client Mobile / Web\n(Responsable / RH)", "#1E3A8A"),
    (4.5, "Contrôleur Backend\n(server.js / valider)", "#15803D"),
    (8.2, "SQL Server\n(KilaniHRDB)", "#B91C1C")
]

for lx, ltitle, lcolor in lifelines_tx:
    ax.add_patch(patches.FancyBboxPatch((lx - 0.9, 4.9), 1.8, 0.65, boxstyle="round,pad=0.05", facecolor=lcolor))
    ax.text(lx, 5.22, ltitle, fontsize=7.5, fontweight='bold', ha='center', color="#FFFFFF")
    ax.plot([lx, lx], [0.6, 4.9], color="#94A3B8", linestyle="--", lw=1.5)

steps_tx = [
    (4.3, 1.2, 4.5, "POST /api/conges/valider {conge_id, commentaire}", True),
    (3.7, 4.5, 8.2, "BEGIN TRANSACTION : Vérification verrouillée du solde", True),
    (3.1, 8.2, 4.5, "Contrôle solde >= nombre_jours ET motif.impact_solde=1", False),
    (2.5, 4.5, 8.2, "UPDATE Utilisateurs SET Solde_Conge = Solde - ? WHERE matricule=?", True),
    (1.9, 4.5, 8.2, "UPDATE Conges SET acceptation_ressource='Validé' + COMMIT", True),
    (1.3, 4.5, 8.2, "(Si Refus ultérieur RH ou annulation: RESTAURATION auto du solde)", False),
    (0.8, 4.5, 1.2, "200 OK + Notification e-mail envoyée au collaborateur", False)
]

for y, x1, x2, label, is_fwd in steps_tx:
    style = "->" if is_fwd else "<-"
    color = "#2563EB" if is_fwd else "#059669"
    ax.annotate('', xy=(x2, y), xytext=(x1, y), arrowprops=dict(arrowstyle=style, color=color, lw=1.3))
    ax.text((x1 + x2)/2, y + 0.12, label, fontsize=7, ha='center', color="#0F172A")

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_4_1_transaction_solde.png", dpi=300)
plt.close()
print("Generated figure_4_1_transaction_solde.png")


# ==========================================
# 8. Figure 5.1 - Déploiement du système
# ==========================================
fig, ax = plt.subplots(figsize=(10, 6.2), dpi=300)
ax.set_xlim(0, 10)
ax.set_ylim(0, 6.2)
ax.axis('off')

ax.text(5.0, 5.8, "Diagramme de Déploiement - Environnement et Services Kilani HR", fontsize=12, fontweight='bold', ha='center', color="#0F172A")

# Nodes
# Client Mobile Node
ax.add_patch(patches.FancyBboxPatch((0.5, 2.5), 2.5, 2.2, boxstyle="round,pad=0.1", facecolor="#EFF6FF", edgecolor="#3B82F6", lw=1.5))
ax.text(1.75, 4.4, "<<device>> Smartphone", fontsize=8.5, ha='center', color="#1E40AF")
ax.text(1.75, 4.0, "App Kilani HR (Flutter)", fontsize=9, fontweight='bold', ha='center', color="#1E3A8A")
ax.text(1.75, 3.4, "Dart VM / Android APK / iOS", fontsize=7.5, ha='center', color="#334155")
ax.text(1.75, 2.9, "Stockage: SharedPreferences", fontsize=7.5, ha='center', color="#64748B")

# Web Browser Node
ax.add_patch(patches.FancyBboxPatch((0.5, 0.4), 2.5, 1.8, boxstyle="round,pad=0.1", facecolor="#EFF6FF", edgecolor="#3B82F6", lw=1.5))
ax.text(1.75, 1.9, "<<device>> Poste Client RH", fontsize=8.5, ha='center', color="#1E40AF")
ax.text(1.75, 1.5, "Navigateur Web (React 19)", fontsize=9, fontweight='bold', ha='center', color="#1E3A8A")
ax.text(1.75, 1.0, "SPA Vite / Recharts / CSS3", fontsize=7.5, ha='center', color="#334155")

# Application Server Node
ax.add_patch(patches.FancyBboxPatch((3.8, 1.0), 2.8, 3.7, boxstyle="round,pad=0.1", facecolor="#F0FDF4", edgecolor="#16A34A", lw=1.5))
ax.text(5.2, 4.4, "<<server>> Serveur Applicatif", fontsize=8.5, ha='center', color="#15803D")
ax.text(5.2, 4.0, "Node.js 20+ Runtime", fontsize=9, fontweight='bold', ha='center', color="#14532D")
ax.text(5.2, 3.4, "Express.js REST Engine (Port 5050)", fontsize=7.5, ha='center', color="#14532D")
ax.text(5.2, 2.9, "Moteur PDFKit (Attestations)", fontsize=7.5, ha='center', color="#14532D")
ax.text(5.2, 2.4, "Service Nodemailer (SMTP)", fontsize=7.5, ha='center', color="#14532D")
ax.text(5.2, 1.9, "Swagger UI (/api-docs)", fontsize=7.5, ha='center', color="#14532D")
ax.text(5.2, 1.4, "Client SDK Google GenAI", fontsize=7.5, ha='center', color="#14532D")

# Database Server Node
ax.add_patch(patches.FancyBboxPatch((7.3, 2.7), 2.4, 2.0, boxstyle="round,pad=0.1", facecolor="#FEF2F2", edgecolor="#DC2626", lw=1.5))
ax.text(8.5, 4.4, "<<database>> Base de Données", fontsize=8.5, ha='center', color="#991B1B")
ax.text(8.5, 4.0, "Microsoft SQL Server", fontsize=9, fontweight='bold', ha='center', color="#7F1D1D")
ax.text(8.5, 3.4, "Instance KilaniHRDB\nPort 1433 (Chiffré)", fontsize=7.5, ha='center', color="#450A0A")

# Cloud AI
ax.add_patch(patches.FancyBboxPatch((7.3, 0.7), 2.4, 1.6, boxstyle="round,pad=0.1", facecolor="#FAF5FF", edgecolor="#9333EA", lw=1.5))
ax.text(8.5, 2.0, "<<cloud>> Google Cloud", fontsize=8.5, ha='center', color="#6B21A8")
ax.text(8.5, 1.6, "Gemini 2.21 API", fontsize=9, fontweight='bold', ha='center', color="#581C87")
ax.text(8.5, 1.1, "Modèle IA Multimodal", fontsize=7.5, ha='center', color="#3B0764")

# Links
ax.annotate('', xy=(3.8, 3.6), xytext=(3.0, 3.6), arrowprops=dict(arrowstyle="<->", color="#0284C7", lw=1.5))
ax.annotate('', xy=(3.8, 1.8), xytext=(3.0, 1.8), arrowprops=dict(arrowstyle="<->", color="#0284C7", lw=1.5))
ax.annotate('', xy=(7.3, 3.6), xytext=(6.6, 3.6), arrowprops=dict(arrowstyle="<->", color="#DC2626", lw=1.5))
ax.annotate('', xy=(7.3, 1.5), xytext=(6.6, 1.5), arrowprops=dict(arrowstyle="<->", color="#9333EA", lw=1.5))

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_5_1_deployment.png", dpi=300)
plt.close()
print("Generated figure_5_1_deployment.png")
