/**
 * Genera un reporte Excel con los datos del proyecto y bases seleccionadas
 * 
 * @param {Object} input - Datos de entrada
 * @param {Object} input.project - Información del proyecto
 * @param {Array} input.foundations - Array de bases a incluir en el reporte
 * 
 * @returns {Object} - { fileUrl: string } URL del archivo Excel generado
 */

export default async function generateExcelReport(input, context) {
  const { project, foundations } = input;
  
  // Construir datos en formato CSV (compatible con Excel)
  const sheets = {
    proyecto: buildProjectSheet(project),
    bases: buildFoundationsSheet(foundations),
    detalles: buildDetailsSheet(foundations)
  };
  
  // Crear CSV para cada hoja
  let csvContent = '';
  
  // Hoja 1: Proyecto
  csvContent += 'INFORMACIÓN DEL PROYECTO\n\n';
  csvContent += `Nombre,${project.name}\n`;
  csvContent += `Cliente,${project.client || '-'}\n`;
  csvContent += `Ubicación,${project.location || '-'}\n`;
  csvContent += `Ingeniero,${project.engineer || '-'}\n`;
  csvContent += `Normativa,${project.normative || 'CIRSOC 201-2005'}\n`;
  csvContent += `Fecha,${new Date().toLocaleDateString('es-AR')}\n`;
  csvContent += `\n`;
  csvContent += `Parámetros del Terreno\n`;
  csvContent += `Tensión admisible,${project.soil_bearing_capacity || 2} kg/cm²\n`;
  csvContent += `f'c hormigón,${project.concrete_strength || 210} kg/cm²\n`;
  csvContent += `fy acero,${project.steel_yield || 4200} kg/cm²\n`;
  csvContent += `\n\n`;
  
  // Hoja 2: Resumen de Bases
  csvContent += 'RESUMEN DE BASES\n\n';
  csvContent += 'Base,Tipo,N (kg),P (kg),cx (cm),cy (cm),A (cm),B (cm),H (cm),σ act (kg/cm²),σ adm (kg/cm²),Util %,Mx (kg·cm/cm),My (kg·cm/cm),As X (cm²),As Y (cm²),Arm X,Arm Y,Verif Suelo,Verif Punzonado,Verif Corte X,Verif Corte Y,Estado\n';
  
  foundations.forEach(f => {
    csvContent += `${f.name || ''},`;
    csvContent += `${f.type || ''},`;
    csvContent += `${f.column_load_N || ''},`;
    csvContent += `${f.total_load_P || ''},`;
    csvContent += `${f.column_cx || ''},`;
    csvContent += `${f.column_cy || ''},`;
    csvContent += `${f.results?.dimensions?.A || f.base_width_A || ''},`;
    csvContent += `${f.results?.dimensions?.B || f.base_length_B || ''},`;
    csvContent += `${f.base_height_H || ''},`;
    csvContent += `${f.results?.stresses?.sigma?.toFixed(3) || ''},`;
    csvContent += `${f.results?.stresses?.sigma_adm?.toFixed(3) || ''},`;
    csvContent += `${f.results?.stresses?.utilization?.toFixed(1) || ''},`;
    csvContent += `${f.results?.stresses?.Mx?.toFixed(2) || ''},`;
    csvContent += `${f.results?.stresses?.My?.toFixed(2) || ''},`;
    csvContent += `${f.results?.reinforcement?.As_x?.toFixed(2) || ''},`;
    csvContent += `${f.results?.reinforcement?.As_y?.toFixed(2) || ''},`;
    csvContent += `"${f.results?.reinforcement?.bars_x?.description || ''}",`;
    csvContent += `"${f.results?.reinforcement?.bars_y?.description || ''}",`;
    csvContent += `${f.results?.checks?.soil_ok ? 'OK' : 'NO'},`;
    csvContent += `${f.results?.checks?.punching?.ok ? 'OK' : 'NO'},`;
    csvContent += `${f.results?.checks?.shear_x?.ok ? 'OK' : 'NO'},`;
    csvContent += `${f.results?.checks?.shear_y?.ok ? 'OK' : 'NO'},`;
    csvContent += `${f.status || ''}\n`;
  });
  
  csvContent += `\n\n`;
  
  // Hoja 3: Detalles por Base
  foundations.forEach((f, idx) => {
    csvContent += `\nBASE ${f.name} - DETALLE COMPLETO\n\n`;
    csvContent += `DATOS DE ENTRADA\n`;
    csvContent += `Tipo de base,${f.type}\n`;
    csvContent += `Modo de cálculo,${f.calculation_mode}\n`;
    csvContent += `Carga N,${f.column_load_N} kg\n`;
    csvContent += `Carga P,${f.total_load_P} kg\n`;
    csvContent += `Dimensión cx,${f.column_cx} cm\n`;
    csvContent += `Dimensión cy,${f.column_cy} cm\n`;
    csvContent += `Altura H,${f.base_height_H} cm\n`;
    csvContent += `Recubrimiento,${f.cover} cm\n`;
    csvContent += `\n`;
    
    if (f.results) {
      csvContent += `RESULTADOS\n`;
      csvContent += `Ancho A,${f.results.dimensions?.A} cm\n`;
      csvContent += `Largo B,${f.results.dimensions?.B} cm\n`;
      csvContent += `Área,${((f.results.dimensions?.A * f.results.dimensions?.B) / 10000).toFixed(2)} m²\n`;
      csvContent += `\n`;
      csvContent += `TENSIONES\n`;
      csvContent += `σ actuante,${f.results.stresses?.sigma?.toFixed(3)} kg/cm²\n`;
      csvContent += `σ admisible,${f.results.stresses?.sigma_adm?.toFixed(3)} kg/cm²\n`;
      csvContent += `Utilización,${f.results.stresses?.utilization?.toFixed(1)} %\n`;
      csvContent += `Momento Mx,${f.results.stresses?.Mx?.toFixed(2)} kg·cm/cm\n`;
      csvContent += `Momento My,${f.results.stresses?.My?.toFixed(2)} kg·cm/cm\n`;
      csvContent += `Volado vx,${f.results.stresses?.vx?.toFixed(1)} cm\n`;
      csvContent += `Volado vy,${f.results.stresses?.vy?.toFixed(1)} cm\n`;
      csvContent += `\n`;
      csvContent += `ARMADURA\n`;
      csvContent += `As requerida X,${f.results.reinforcement?.As_x?.toFixed(2)} cm²\n`;
      csvContent += `As requerida Y,${f.results.reinforcement?.As_y?.toFixed(2)} cm²\n`;
      csvContent += `As mínima X,${f.results.reinforcement?.As_min_x?.toFixed(2)} cm²\n`;
      csvContent += `As mínima Y,${f.results.reinforcement?.As_min_y?.toFixed(2)} cm²\n`;
      csvContent += `Armadura X,"${f.results.reinforcement?.bars_x?.description}"\n`;
      csvContent += `Armadura Y,"${f.results.reinforcement?.bars_y?.description}"\n`;
      csvContent += `\n`;
      csvContent += `VERIFICACIONES\n`;
      csvContent += `Tensión del suelo,${f.results.checks?.soil_ok ? 'OK' : 'NO VERIFICA'}\n`;
      csvContent += `Punzonado,${f.results.checks?.punching?.ok ? 'OK' : 'NO VERIFICA'}\n`;
      csvContent += `Corte en X,${f.results.checks?.shear_x?.ok ? 'OK' : 'NO VERIFICA'}\n`;
      csvContent += `Corte en Y,${f.results.checks?.shear_y?.ok ? 'OK' : 'NO VERIFICA'}\n`;
      csvContent += `Estado general,${f.results.checks?.all_ok ? 'VERIFICADA' : 'NO VERIFICA'}\n`;
    }
    csvContent += `\n\n`;
  });
  
  // Crear archivo CSV
  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const csvFile = new File([csvBlob], 'report.csv');
  
  // Subir archivo
  const uploadResult = await context.integrations.Core.UploadFile({ file: csvFile });
  
  return {
    success: true,
    fileUrl: uploadResult.file_url,
    fileName: `${project.name}_reporte.csv`,
    message: 'Archivo CSV generado. Ábralo con Excel para ver las diferentes secciones.'
  };
}

function buildProjectSheet(project) {
  return [];
}

function buildFoundationsSheet(foundations) {
  return [];
}

function buildDetailsSheet(foundations) {
  return [];
}