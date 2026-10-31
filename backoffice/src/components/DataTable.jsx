import { useState } from 'react';
import { Download, FileText, Search, Filter } from 'lucide-react';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

export default function DataTable({ 
  title, 
  data, 
  columns, 
  onFilterChange, 
  exportName = 'Export',
  isLoading = false 
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return columns.some(col => {
      const val = item[col.dataKey];
      return val && String(val).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', margin: 0 }}>{title}</h2>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button 
            className="btn btn-outline"
            onClick={() => exportToExcel(filteredData, columns, `${exportName}.xlsx`)}
            title="Exporter vers Excel"
          >
            <Download size={16} /> Excel
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => exportToPDF(filteredData, columns, title, `${exportName}.pdf`)}
            title="Exporter en PDF"
          >
            <FileText size={16} /> PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            className="form-control" 
            placeholder="Rechercher..." 
            style={{ paddingLeft: '35px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* We can pass custom filter elements here via children if needed */}
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.dataKey}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center' }}>Chargement...</td></tr>
            ) : filteredData.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ textAlign: 'center' }}>Aucune donnée trouvée</td></tr>
            ) : (
              filteredData.map((row, idx) => (
                <tr key={idx}>
                  {columns.map(col => (
                    <td key={col.dataKey}>
                      {col.render ? col.render(row[col.dataKey], row) : row[col.dataKey]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
