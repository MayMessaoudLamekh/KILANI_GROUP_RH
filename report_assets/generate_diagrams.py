import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

os.makedirs('/Users/maymessaoud/kilani_hr_app/report_assets/figures', exist_ok=True)
out_dir = '/Users/maymessaoud/kilani_hr_app/report_assets/figures'

# Style config
plt.rcParams['font.sans-serif'] = 'Helvetica'
plt.rcParams['font.family'] = 'sans-serif'

# 1. Architecture Figure 2.1
fig, ax = plt.subplots(figsize=(11, 6.5), dpi=300)
ax.set_xlim(0, 11)
ax.set_ylim(0, 6.5)
ax.axis('off')

# Background boxes
ax.add_patch(patches.FancyBboxPatch((0.5, 0.5), 10, 5.5, boxstyle="round,pad=0.2", facecolor="#F8FAFC", edgecolor="#CBD5E1", linewidth=1.5))
ax.text(0.8, 5.7, "Architecture Globale du Système Kilani HR", fontsize=14, fontweight='bold', color="#1E293B")

# Client Layer
ax.add_patch(patches.FancyBboxPatch((0.8, 3.2), 2.8, 2.0, boxstyle="round,pad=0.1", facecolor="#EFF6FF", edgecolor="#3B82F6", linewidth=1.5))
ax.text(2.2, 4.9, "Couche Présentation (Clients)", fontsize=10, fontweight='bold', ha='center', color="#1D4ED8")
ax.add_patch(patches.FancyBboxPatch((1.0, 4.1), 2.4, 0.6, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#93C5FD", linewidth=1))
ax.text(2.2, 4.35, "App Mobile Flutter (iOS/Android)\nCollaborateurs & Managers", fontsize=8, ha='center', color="#1E3A8A")
ax.add_patch(patches.FancyBboxPatch((1.0, 3.4), 2.4, 0.55, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#93C5FD", linewidth=1))
ax.text(2.2, 3.65, "Back-Office Web React 19 (Vite)\nRH & Administrateurs", fontsize=8, ha='center', color="#1E3A8A")

# Gateway / API Layer
ax.add_patch(patches.FancyBboxPatch((4.3, 2.2), 3.0, 3.0, boxstyle="round,pad=0.1", facecolor="#F0FDF4", edgecolor="#22C55E", linewidth=1.5))
ax.text(5.8, 4.9, "API Backend (Node.js / Express)", fontsize=10, fontweight='bold', ha='center', color="#15803D")
modules = ["Auth & RBAC (JWT / bcrypt)", "Module Congés & Calcul Soldes", "Module Missions & Ordres PDF", "Module Attestations & PDFKit", "Documentation Swagger / OpenAPI"]
for idx, mod in enumerate(modules):
    ax.add_patch(patches.FancyBboxPatch((4.5, 4.3 - idx*0.48), 2.6, 0.38, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#86EFAC", linewidth=1))
    ax.text(5.8, 4.46 - idx*0.48, mod, fontsize=7.5, ha='center', color="#14532D")

# Services / Data Layer
# Database
ax.add_patch(patches.FancyBboxPatch((8.0, 3.6), 2.4, 1.6, boxstyle="round,pad=0.1", facecolor="#FEF2F2", edgecolor="#EF4444", linewidth=1.5))
ax.text(9.2, 4.9, "Base de Données", fontsize=10, fontweight='bold', ha='center', color="#B91C1C")
ax.text(9.2, 4.4, "Microsoft SQL Server", fontsize=9, fontweight='bold', ha='center', color="#7F1D1D")
ax.text(9.2, 4.0, "KilaniHRDB\nTransactions & Intégrité", fontsize=7.5, ha='center', color="#450A0A")

# External Services
ax.add_patch(patches.FancyBboxPatch((8.0, 1.8), 2.4, 1.5, boxstyle="round,pad=0.1", facecolor="#FAF5FF", edgecolor="#A855F7", linewidth=1.5))
ax.text(9.2, 3.0, "Services Tiers & IA", fontsize=10, fontweight='bold', ha='center', color="#7E22CE")
ax.add_patch(patches.FancyBboxPatch((8.2, 2.4), 2.0, 0.45, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#D8B4FE", linewidth=1))
ax.text(9.2, 2.6, "Google Gemini AI 2.21", fontsize=7.5, ha='center', fontweight='bold', color="#581C87")
ax.add_patch(patches.FancyBboxPatch((8.2, 1.9), 2.0, 0.42, boxstyle="round,pad=0.05", facecolor="#FFFFFF", edgecolor="#D8B4FE", linewidth=1))
ax.text(9.2, 2.08, "SMTP Nodemailer (E-mails)", fontsize=7.5, ha='center', color="#581C87")

# Arrows
ax.annotate('', xy=(4.3, 4.2), xytext=(3.6, 4.2), arrowprops=dict(arrowstyle="<->", color="#0284C7", lw=2))
ax.text(3.95, 4.35, "REST\nJSON/JWT", fontsize=7, ha='center', color="#0369A1", fontweight='bold')

ax.annotate('', xy=(8.0, 4.4), xytext=(7.3, 4.4), arrowprops=dict(arrowstyle="<->", color="#DC2626", lw=2))
ax.text(7.65, 4.55, "T-SQL\nmssql", fontsize=7, ha='center', color="#B91C1C", fontweight='bold')

ax.annotate('', xy=(8.0, 2.6), xytext=(7.3, 2.6), arrowprops=dict(arrowstyle="<->", color="#9333EA", lw=2))
ax.text(7.65, 2.75, "HTTPS\nAPI REST", fontsize=7, ha='center', color="#7E22CE", fontweight='bold')

# Footnote
ax.text(5.5, 0.8, "Conteneurisation Docker / Environnement multi-plateforme / Déploiement sécurisé", fontsize=8.5, ha='center', color="#64748B", style='italic')

plt.tight_layout()
plt.savefig(f"{out_dir}/figure_2_1_architecture.png", dpi=300)
plt.close()
print("Generated figure_2_1_architecture.png")
