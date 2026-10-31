import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Exporte des données en PDF
 * @param {Array} data - Tableau d'objets (données)
 * @param {Array} columns - Tableau d'objets { header: 'Titre', dataKey: 'cle' }
 * @param {String} title - Titre du document
 * @param {String} filename - Nom du fichier de sortie
 */
export const exportToPDF = (data, columns, title = 'Rapport', filename = 'export.pdf') => {
  const doc = new jsPDF();
  
  // Titre
  doc.setFontSize(16);
  doc.text(`KILANI RH - ${title}`, 14, 15);
  doc.setFontSize(10);
  doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 22);

  const head = [columns.map(col => col.header)];
  const body = data.map(row => columns.map(col => {
    const val = row[col.dataKey];
    return val !== null && val !== undefined ? String(val) : '';
  }));

  doc.autoTable({
    startY: 30,
    head: head,
    body: body,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [26, 37, 48], textColor: 255 } // Primary Navy
  });

  doc.save(filename);
};

/**
 * Exporte des données en Excel (XLSX)
 * @param {Array} data - Tableau d'objets (données)
 * @param {Array} columns - Tableau d'objets { header: 'Titre', dataKey: 'cle' }
 * @param {String} filename - Nom du fichier de sortie
 */
export const exportToExcel = (data, columns, filename = 'export.xlsx') => {
  // Transformer les données pour n'avoir que les colonnes choisies
  const exportData = data.map(row => {
    const newRow = {};
    columns.forEach(col => {
      newRow[col.header] = row[col.dataKey];
    });
    return newRow;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rapport');
  
  // Fix column widths
  const wscols = columns.map(() => ({ wch: 15 }));
  worksheet['!cols'] = wscols;

  XLSX.writeFile(workbook, filename);
};
