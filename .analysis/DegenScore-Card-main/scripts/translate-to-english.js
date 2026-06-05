// Script para traducir de español a inglés en toda la app
const fs = require('fs');
const path = require('path');

// Diccionario de traducciones
const translations = {
  // Títulos y secciones
  'Generar Tu Card': 'Generate Your Card',
  Generar: 'Generate',
  Análisis: 'Analysis',
  'Conectar Billetera': 'Connect Wallet',
  Conectar: 'Connect',
  Descargar: 'Download',
  Tarjeta: 'Card',
  Billetera: 'Wallet',

  // Mensajes
  'Conecta tu billetera': 'Connect your wallet',
  'Generando carta': 'Generating card',
  'Analizando transacciones': 'Analyzing transactions',
  'El Sistema de Análisis de Tokens MÁS COMPLETO de Web3':
    'The MOST COMPLETE Token Analysis System in Web3',
  'Integra 15+ APIs · 50+ Métricas · Análisis en Tiempo Real':
    'Integrates 15+ APIs · 50+ Metrics · Real-Time Analysis',

  // Análisis
  'Análisis de Wallets Nuevas': 'New Wallets Analysis',
  'Análisis de Insiders': 'Insider Analysis',
  'Análisis de Volumen': 'Volume Analysis',
  'Análisis del Equipo': 'Team Analysis',
  'Análisis completado': 'Analysis completed',

  // Títulos de página
  'Super Token Scorer - El Análisis Más Completo de Web3':
    'Super Token Scorer - The Most Complete Analysis in Web3',

  // Comentarios
  'Tarjeta free removida - solo mostramos la premium con bordes dorados':
    'Free card removed - only showing premium card with golden borders',
  'PAGO EXITOSO - Descargar automáticamente la tarjeta premium':
    'PAYMENT SUCCESSFUL - Auto-download premium card',
};

function translateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  for (const [spanish, english] of Object.entries(translations)) {
    if (content.includes(spanish)) {
      content = content.replaceAll(spanish, english);
      modified = true;
      console.log(`✅ Translated "${spanish}" -> "${english}" in ${path.basename(filePath)}`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`📝 Updated: ${filePath}\n`);
  }

  return modified;
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  let totalModified = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '__tests__') {
        totalModified += walkDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (translateFile(filePath)) {
        totalModified++;
      }
    }
  }

  return totalModified;
}

// Ejecutar
console.log('🌐 Starting Spanish to English translation...\n');

const componentsDir = path.join(__dirname, '../components');
const pagesDir = path.join(__dirname, '../pages');

let totalFiles = 0;
totalFiles += walkDirectory(componentsDir);
totalFiles += walkDirectory(pagesDir);

console.log(`\n✅ Translation complete! Modified ${totalFiles} files.`);
