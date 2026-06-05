const fs = require('fs');

try {
  const content = fs.readFileSync('package.json', 'utf8');
  console.log('File length:', content.length);
  console.log('Last 100 chars:', JSON.stringify(content.slice(-100)));

  // Try to parse
  const parsed = JSON.parse(content);
  console.log('\n✅ JSON is valid');

  // Check for trailing content
  const trimmed = content.trim();
  const lastChar = trimmed[trimmed.length - 1];
  console.log('Last character:', lastChar, '(should be })');

  if (lastChar !== '}') {
    console.log('⚠️ WARNING: File does not end with }');
  }

  // Check for content after last }
  const lastBraceIndex = content.lastIndexOf('}');
  const afterBrace = content.substring(lastBraceIndex + 1);
  if (afterBrace.trim().length > 0) {
    console.log('⚠️ WARNING: Content after closing brace:', JSON.stringify(afterBrace));
  } else {
    console.log('✅ No content after closing brace');
  }
} catch (e) {
  console.error('❌ Error:', e.message);
  console.error('Position:', e.message.match(/position (\d+)/)?.[1]);
}
