const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');

const WIDTH = 1024;
const HEIGHT = 1536;

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

async function main() {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  bg.addColorStop(0, '#060612');
  bg.addColorStop(1, '#071226');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const cardW = 760;
  const cardH = 1100;
  const cardX = (WIDTH - cardW) / 2;
  const cardY = (HEIGHT - cardH) / 2;

  ctx.fillStyle = '#34d399';
  roundRect(ctx, cardX - 6, cardY - 6, cardW + 12, cardH + 12, 36);

  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  roundRect(ctx, cardX, cardY, cardW, cardH, 28);

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 72px Sans';
  ctx.fillText('98', cardX + 40, cardY + 120);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('card.png', buffer);
  console.log('card.png written');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
