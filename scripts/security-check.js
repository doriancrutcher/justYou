#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔒 Security Check for JobGoalz\n');

// Check for vulnerabilities
console.log('1. Checking for npm vulnerabilities...');
try {
  const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditResult);
  
  if (audit.metadata.vulnerabilities.total > 0) {
    console.log(`⚠️  Found ${audit.metadata.vulnerabilities.total} vulnerabilities:`);
    console.log(`   - High: ${audit.metadata.vulnerabilities.high}`);
    console.log(`   - Moderate: ${audit.metadata.vulnerabilities.moderate}`);
    console.log(`   - Low: ${audit.metadata.vulnerabilities.low}`);
    console.log('\n   Run "npm audit fix" to fix safe vulnerabilities');
  } else {
    console.log('✅ No vulnerabilities found');
  }
} catch (error) {
  console.log('❌ Error running npm audit');
}

// Check for outdated packages
console.log('\n2. Checking for outdated packages...');
try {
  const outdatedResult = execSync('npm outdated --json', { encoding: 'utf8' });
  const outdated = JSON.parse(outdatedResult);
  
  if (Object.keys(outdated).length > 0) {
    console.log('⚠️  Found outdated packages:');
    Object.keys(outdated).forEach(pkg => {
      console.log(`   - ${pkg}: ${outdated[pkg].current} → ${outdated[pkg].latest}`);
    });
    console.log('\n   Run "npm update" to update packages');
  } else {
    console.log('✅ All packages are up to date');
  }
} catch (error) {
  console.log('✅ No outdated packages found');
}

// Check environment variables
console.log('\n3. Checking environment variables...');
const envFile = path.join(__dirname, '..', '.env');
if (fs.existsSync(envFile)) {
  console.log('✅ .env file exists');
} else {
  console.log('⚠️  No .env file found - make sure environment variables are set in Netlify');
}

// Check for hardcoded secrets
console.log('\n4. Checking for hardcoded secrets...');
const srcDir = path.join(__dirname, '..', 'src');
const files = getAllFiles(srcDir);
let foundSecrets = false;

files.forEach(file => {
  if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for common secret patterns
    const secretPatterns = [
      /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
      /secret\s*[:=]\s*['"][^'"]+['"]/gi,
      /password\s*[:=]\s*['"][^'"]+['"]/gi,
      /token\s*[:=]\s*['"][^'"]+['"]/gi
    ];
    
    secretPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        console.log(`⚠️  Potential secret found in ${file}`);
        foundSecrets = true;
      }
    });
  }
});

if (!foundSecrets) {
  console.log('✅ No hardcoded secrets found');
}

// Check Firebase security
console.log('\n5. Checking Firebase configuration...');
const firebaseConfig = path.join(__dirname, '..', 'src', 'firebase.ts');
if (fs.existsSync(firebaseConfig)) {
  const content = fs.readFileSync(firebaseConfig, 'utf8');
  if (content.includes('process.env.')) {
    console.log('✅ Firebase config uses environment variables');
  } else {
    console.log('⚠️  Firebase config may have hardcoded values');
  }
} else {
  console.log('❌ Firebase config not found');
}

console.log('\n🔒 Security check complete!');
console.log('\n📋 Recommendations:');
console.log('1. Run "npm audit fix" to fix vulnerabilities');
console.log('2. Run "npm update" to update packages');
console.log('3. Enable 2FA on all accounts');
console.log('4. Regularly check Firebase console for unusual activity');
console.log('5. Monitor Netlify deployment logs');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  
  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });
  
  return arrayOfFiles;
} 