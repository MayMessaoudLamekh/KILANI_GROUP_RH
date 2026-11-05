// Remet la démo à zéro : annule les congés de EMP001 créés aujourd'hui (le solde est rendu),
// puis supprime les congés, missions, attestations et discussions IA de EMP001 créés aujourd'hui.
// Usage : node soutenance/reset_demo.js
const path = require('path');
const backend = path.join(__dirname, '..', 'backend');
require(path.join(backend, 'node_modules', 'dotenv')).config({ path: path.join(backend, '.env') });
const sql = require(path.join(backend, 'node_modules', 'mssql'));

const API = 'http://localhost:5050/api';

async function login(identifier) {
  const r = await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier, password: 'password123' }) });
  return (await r.json()).token;
}

(async () => {
  const pool = await sql.connect({
    user: process.env.DB_USER, password: process.env.DB_PASSWORD, server: process.env.DB_SERVER,
    port: +process.env.DB_PORT, database: process.env.DB_NAME, options: { encrypt: false, trustServerCertificate: true },
  });
  const today = "CAST(GETDATE() AS DATE)";

  // 1. Annulation par l'API : rend les jours au solde si le congé était validé par les RH
  const rh = await login('RH001');
  const conges = (await pool.request().query(`SELECT id FROM Conges WHERE matricule='EMP001' AND Date_emission_demande >= ${today} AND acceptation_ressource <> N'Annulé'`)).recordset;
  for (const { id } of conges) {
    await fetch(`${API}/conges/annuler`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${rh}` }, body: JSON.stringify({ conge_id: id }) });
  }

  // 2. Suppression des lignes de démo du jour
  const del = await pool.request().query(`
    DELETE FROM Conges WHERE matricule='EMP001' AND Date_emission_demande >= ${today};
    DELETE FROM Missions WHERE matricule='EMP001' AND Date_emission_demande >= ${today};
    DELETE FROM Attestations WHERE matricule='EMP001' AND [Datetime] >= ${today};
    DELETE FROM AiChats WHERE matricule='EMP001' AND date_creation >= ${today};`);
  const solde = (await pool.request().query(`SELECT Solde_Conge FROM Utilisateurs WHERE matricule='EMP001'`)).recordset[0].Solde_Conge;
  console.log(`Supprimé (congés, missions, attestations, chats IA) : ${del.rowsAffected.join(', ')}`);
  console.log(`Solde EMP001 : ${solde} jours`);
  await pool.close();
})().catch(e => { console.error('Erreur :', e.message); process.exit(1); });
