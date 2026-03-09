/**
 * Genera un reporte PDF con los datos del proyecto y bases seleccionadas
 * 
 * @param {Object} input - Datos de entrada
 * @param {Object} input.project - Información del proyecto
 * @param {Array} input.foundations - Array de bases a incluir en el reporte
 * @param {boolean} input.includeGraphics - Si incluir gráficos
 * @param {boolean} input.includeCalculations - Si incluir memoria de cálculo
 * 
 * @returns {Object} - { fileUrl: string } URL del PDF generado
 */

export default async function generatePDFReport(input, context) {
  const { project, foundations, includeGraphics = true, includeCalculations = true } = input;
  
  // Construir el HTML del reporte
  const html = buildReportHTML(project, foundations, includeGraphics, includeCalculations);
  
  // Usar la integración Core.InvokeLLM con un prompt para generar el PDF
  // O usar una biblioteca de generación de PDF
  
  // Por ahora, generamos un HTML y lo convertimos
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Reporte - ${project.name}</title>
  <style>
    body { 
      font-family: Arial, sans-serif; 
      margin: 40px;
      color: #1e293b;
    }
    h1 { 
      color: #0f172a; 
      border-bottom: 3px solid #334155;
      padding-bottom: 10px;
    }
    h2 { 
      color: #334155; 
      border-bottom: 2px solid #94a3b8;
      padding-bottom: 8px;
      margin-top: 30px;
    }
    h3 { 
      color: #475569;
      margin-top: 20px;
    }
    table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0;
      font-size: 12px;
    }
    th, td { 
      border: 1px solid #cbd5e1; 
      padding: 8px; 
      text-align: left; 
    }
    th { 
      background-color: #f1f5f9; 
      font-weight: bold;
    }
    .header { 
      text-align: center; 
      margin-bottom: 40px; 
    }
    .section { 
      margin: 30px 0; 
      page-break-inside: avoid;
    }
    .data-grid { 
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 15px; 
      margin: 20px 0; 
    }
    .data-item { 
      border: 1px solid #e2e8f0;
      padding: 10px;
      border-radius: 4px;
    }
    .data-label { 
      font-size: 11px; 
      color: #64748b; 
      font-weight: 600;
      text-transform: uppercase;
    }
    .data-value { 
      font-size: 16px; 
      color: #0f172a; 
      margin-top: 4px;
    }
    .check-ok { color: #10b981; font-weight: bold; }
    .check-fail { color: #ef4444; font-weight: bold; }
    @media print {
      .page-break { page-break-after: always; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>CÁLCULO DE FUNDACIONES</h1>
    <h2>${project.name}</h2>
    ${project.client ? `<p><strong>Cliente:</strong> ${project.client}</p>` : ''}
    ${project.location ? `<p><strong>Ubicación:</strong> ${project.location}</p>` : ''}
    ${project.engineer ? `<p><strong>Ingeniero:</strong> ${project.engineer}</p>` : ''}
    <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-AR')}</p>
    <p><strong>Normativa:</strong> ${project.normative || 'CIRSOC 201-2005'}</p>
  </div>

  <div class="section">
    <h2>1. DATOS DEL PROYECTO</h2>
    <div class="data-grid">
      <div class="data-item">
        <div class="data-label">Tensión adm. terreno</div>
        <div class="data-value">${project.soil_bearing_capacity || 2} kg/cm²</div>
      </div>
      <div class="data-item">
        <div class="data-label">f'c hormigón</div>
        <div class="data-value">${project.concrete_strength || 210} kg/cm²</div>
      </div>
      <div class="data-item">
        <div class="data-label">fy acero</div>
        <div class="data-value">${project.steel_yield || 4200} kg/cm²</div>
      </div>
    </div>
    ${project.notes ? `<p><strong>Observaciones:</strong> ${project.notes}</p>` : ''}
  </div>

  <div class="section">
    <h2>2. RESUMEN DE BASES</h2>
    <table>
      <thead>
        <tr>
          <th>Base</th>
          <th>Tipo</th>
          <th>N (kg)</th>
          <th>Dimensiones (cm)</th>
          <th>Armadura X</th>
          <th>Armadura Y</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        ${foundations.map(f => `
          <tr>
            <td><strong>${f.name}</strong></td>
            <td>${f.type}</td>
            <td>${(f.column_load_N || 0).toLocaleString()}</td>
            <td>${f.results?.dimensions?.A || f.base_width_A} × ${f.results?.dimensions?.B || f.base_length_B} × ${f.base_height_H}</td>
            <td>${f.results?.reinforcement?.bars_x?.description || '-'}</td>
            <td>${f.results?.reinforcement?.bars_y?.description || '-'}</td>
            <td class="${f.status === 'verified' ? 'check-ok' : f.status === 'failed' ? 'check-fail' : ''}">
              ${f.status === 'verified' ? '✓ Verificada' : f.status === 'failed' ? '✗ No verifica' : '-'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  ${foundations.map((f, idx) => `
    <div class="section page-break">
      <h2>${idx + 3}. BASE ${f.name}</h2>
      
      <h3>Datos de Entrada</h3>
      <div class="data-grid">
        <div class="data-item">
          <div class="data-label">Tipo</div>
          <div class="data-value">${f.type}</div>
        </div>
        <div class="data-item">
          <div class="data-label">Carga N</div>
          <div class="data-value">${(f.column_load_N || 0).toLocaleString()} kg</div>
        </div>
        <div class="data-item">
          <div class="data-label">Carga P</div>
          <div class="data-value">${(f.total_load_P || 0).toLocaleString()} kg</div>
        </div>
        <div class="data-item">
          <div class="data-label">Columna cx</div>
          <div class="data-value">${f.column_cx} cm</div>
        </div>
        <div class="data-item">
          <div class="data-label">Columna cy</div>
          <div class="data-value">${f.column_cy} cm</div>
        </div>
        <div class="data-item">
          <div class="data-label">Altura H</div>
          <div class="data-value">${f.base_height_H} cm</div>
        </div>
      </div>

      ${f.results ? `
        <h3>Resultados</h3>
        <div class="data-grid">
          <div class="data-item">
            <div class="data-label">Dimensiones</div>
            <div class="data-value">${f.results.dimensions?.A} × ${f.results.dimensions?.B} cm</div>
          </div>
          <div class="data-item">
            <div class="data-label">σ actuante</div>
            <div class="data-value">${f.results.stresses?.sigma?.toFixed(3)} kg/cm²</div>
          </div>
          <div class="data-item">
            <div class="data-label">Utilización</div>
            <div class="data-value">${f.results.stresses?.utilization?.toFixed(1)}%</div>
          </div>
        </div>

        <h3>Armadura</h3>
        <div class="data-grid">
          <div class="data-item">
            <div class="data-label">Armadura X</div>
            <div class="data-value" style="color: #dc2626;">${f.results.reinforcement?.bars_x?.description}</div>
          </div>
          <div class="data-item">
            <div class="data-label">Armadura Y</div>
            <div class="data-value" style="color: #2563eb;">${f.results.reinforcement?.bars_y?.description}</div>
          </div>
          <div class="data-item">
            <div class="data-label">As X</div>
            <div class="data-value">${f.results.reinforcement?.As_x?.toFixed(2)} cm²</div>
          </div>
        </div>

        <h3>Verificaciones</h3>
        <table>
          <tr>
            <td>Tensión del terreno</td>
            <td class="${f.results.checks?.soil_ok ? 'check-ok' : 'check-fail'}">
              ${f.results.checks?.soil_ok ? '✓ OK' : '✗ NO VERIFICA'}
            </td>
          </tr>
          <tr>
            <td>Punzonado</td>
            <td class="${f.results.checks?.punching?.ok ? 'check-ok' : 'check-fail'}">
              ${f.results.checks?.punching?.ok ? '✓ OK' : '✗ NO VERIFICA'}
            </td>
          </tr>
          <tr>
            <td>Corte en X</td>
            <td class="${f.results.checks?.shear_x?.ok ? 'check-ok' : 'check-fail'}">
              ${f.results.checks?.shear_x?.ok ? '✓ OK' : '✗ NO VERIFICA'}
            </td>
          </tr>
          <tr>
            <td>Corte en Y</td>
            <td class="${f.results.checks?.shear_y?.ok ? 'check-ok' : 'check-fail'}">
              ${f.results.checks?.shear_y?.ok ? '✓ OK' : '✗ NO VERIFICA'}
            </td>
          </tr>
        </table>
      ` : ''}
    </div>
  `).join('')}

</body>
</html>
  `;

  // Subir el HTML como archivo temporal
  const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
  const htmlFile = new File([htmlBlob], 'report.html');
  
  // Usar la integración de UploadFile
  const uploadResult = await context.integrations.Core.UploadFile({ file: htmlFile });
  
  // Retornar URL del HTML (el usuario puede abrirlo y guardarlo como PDF desde el navegador)
  return {
    success: true,
    fileUrl: uploadResult.file_url,
    fileName: `${project.name}_reporte.html`,
    message: 'Reporte HTML generado. Ábralo y use Ctrl+P para guardar como PDF.'
  };
}

function buildReportHTML(project, foundations, includeGraphics, includeCalculations) {
  // Función auxiliar para construir el HTML
  return '';
}