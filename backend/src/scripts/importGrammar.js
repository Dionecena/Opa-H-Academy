const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importExercises() {
  try {
    // Lire les fichiers JSON (à la racine du projet)
    const part1Path = path.join(__dirname, '..', '..', '..', 'grammar_part1_10-18.json');
    const part2Path = path.join(__dirname, '..', '..', '..', 'grammar_part2_18-26.json');
    const part3Path = path.join(__dirname, '..', '..', '..', 'grammar_part3_30-36.json');
    const part4Path = path.join(__dirname, '..', '..', '..', 'grammar_part4_40-48.json');
    const part5Path = path.join(__dirname, '..', '..', '..', 'grammar_part5_48-60.json');
    const part6Path = path.join(__dirname, '..', '..', '..', 'grammar_part6_62-78.json');
    const part7Path = path.join(__dirname, '..', '..', '..', 'grammar_part7_80-94.json');
    const part8Path = path.join(__dirname, '..', '..', '..', 'grammar_part8_98-104.json');
    const part9Path = path.join(__dirname, '..', '..', '..', 'grammar_part9_105-114.json');
    const part10Path = path.join(__dirname, '..', '..', '..', 'grammar_part10_115-144.json');
    const part11Path = path.join(__dirname, '..', '..', '..', 'grammar_part11_145-157.json');
    const part12Path = path.join(__dirname, '..', '..', '..', 'grammar_part12_158-167.json');
    const part13Path = path.join(__dirname, '..', '..', '..', 'grammar_part13_170-189.json');
    const part14Path = path.join(__dirname, '..', '..', '..', 'grammar_part14_solutions.json');
    
    const part1Data = JSON.parse(fs.readFileSync(part1Path, 'utf8'));
    const part2Data = JSON.parse(fs.readFileSync(part2Path, 'utf8'));
    const part3Data = JSON.parse(fs.readFileSync(part3Path, 'utf8'));
    const part4Data = JSON.parse(fs.readFileSync(part4Path, 'utf8'));
    const part5Data = JSON.parse(fs.readFileSync(part5Path, 'utf8'));
    const part6Data = JSON.parse(fs.readFileSync(part6Path, 'utf8'));
    const part7Data = JSON.parse(fs.readFileSync(part7Path, 'utf8'));
    const part8Data = JSON.parse(fs.readFileSync(part8Path, 'utf8'));
    const part9Data = JSON.parse(fs.readFileSync(part9Path, 'utf8'));
    const part10Data = JSON.parse(fs.readFileSync(part10Path, 'utf8'));
    const part11Data = JSON.parse(fs.readFileSync(part11Path, 'utf8'));
    const part12Data = JSON.parse(fs.readFileSync(part12Path, 'utf8'));
    const part13Data = JSON.parse(fs.readFileSync(part13Path, 'utf8'));
    const part14Data = JSON.parse(fs.readFileSync(part14Path, 'utf8'));
    
    const allExercises = [...part1Data, ...part2Data, ...part3Data, ...part4Data, ...part5Data, ...part6Data, ...part7Data, ...part8Data, ...part9Data, ...part10Data, ...part11Data, ...part12Data, ...part13Data, ...part14Data];
    
    console.log(`Importation de ${allExercises.length} exercices...`);
    
    let created = 0;
    let updated = 0;
    const errors = [];
    
    for (let i = 0; i < allExercises.length; i++) {
      const ex = allExercises[i];
      const uid = String(ex?.id || '').trim();
      
      if (!uid) {
        errors.push({ index: i, error: 'id manquant' });
        continue;
      }
      
      const theme = String(ex?.theme || '').trim();
      const niveau = String(ex?.niveau || '').trim();
      const exType = String(ex?.type || '').trim();
      const difficulty = String(ex?.difficulty || '').trim();
      const score = Number.isFinite(ex?.score) ? ex.score : parseInt(String(ex?.score || '1'), 10);
      
      if (!theme || !niveau || !exType || !difficulty || !Number.isFinite(score)) {
        errors.push({ index: i, id: uid, error: 'Champs requis manquants' });
        continue;
      }
      
      const sousThemeRaw = ex?.sous_theme;
      const sousTheme = sousThemeRaw === undefined || sousThemeRaw === null || String(sousThemeRaw).trim() === ''
        ? null
        : String(sousThemeRaw).trim();
      
      const existing = await prisma.grammar_exercises.findUnique({ 
        where: { uid }, 
        select: { id: true } 
      });
      
      await prisma.grammar_exercises.upsert({
        where: { uid },
        create: {
          uid,
          theme,
          sousTheme,
          niveau,
          exType,
          difficulty,
          score,
          data: ex
        },
        update: {
          theme,
          sousTheme,
          niveau,
          exType,
          difficulty,
          score,
          data: ex
        }
      });
      
      if (existing) {
        updated++;
        console.log(`  [UPDATED] ${uid}`);
      } else {
        created++;
        console.log(`  [CREATED] ${uid}`);
      }
    }
    
    console.log('\n=== RÉSULTAT ===');
    console.log(`Créés: ${created}`);
    console.log(`Mis à jour: ${updated}`);
    console.log(`Erreurs: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\nErreurs détaillées:', errors);
    }
    
  } catch (error) {
    console.error('Erreur lors de l\'import:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

importExercises();
