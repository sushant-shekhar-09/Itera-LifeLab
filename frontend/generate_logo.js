const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'assets', 'Logo');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svg'));
let combinedPaths = '';

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  // Just extract the inner content of <svg> tags since they all need to be rendered
  // Wait! Some SVGs might have nested <defs> or conflicting IDs. Let's see.
  // We'll extract everything between <svg ...> and </svg>
  let inner = content.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  if(inner && inner[1]) {
    // Basic react-ifications
    let jsxInner = inner[1]
      .replace(/fill-opacity/g, 'fillOpacity')
      .replace(/clip-rule/g, 'clipRule')
      .replace(/fill-rule/g, 'fillRule')
      .replace(/stroke-width/g, 'strokeWidth')
      .replace(/stroke-linecap/g, 'strokeLinecap')
      .replace(/stroke-linejoin/g, 'strokeLinejoin');
    
    combinedPaths += '\n      {/* ' + f + ' */}\n      ' + jsxInner.trim();
  }
});

const componentCode = `export function Logo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 244 365" fill="none" xmlns="http://www.w3.org/2000/svg">
${combinedPaths}
    </svg>
  );
}
`;

fs.writeFileSync(path.join(__dirname, 'src', 'components', 'Logo.tsx'), componentCode);
console.log('Logo.tsx generated!');
