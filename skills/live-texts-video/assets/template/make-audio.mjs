import {mkdirSync, writeFileSync} from 'node:fs';
// Original two-note notification tones, synthesized locally. No stock recordings.
mkdirSync('public/audio', {recursive: true});
for (const [name, frequencies] of [['sent', [620, 900]], ['received', [880, 660]]]) {
  const rate = 44100, samples = Math.round(rate * 0.32);
  const buffer = Buffer.alloc(44 + samples * 2);
  buffer.write('RIFF', 0); buffer.writeUInt32LE(36 + samples * 2, 4);
  buffer.write('WAVEfmt ', 8); buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(rate, 24); buffer.writeUInt32LE(rate * 2, 28);
  buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36); buffer.writeUInt32LE(samples * 2, 40);
  for (let i = 0; i < samples; i++) {
    const t = i / rate;
    let value = 0;
    frequencies.forEach((hz, n) => {
      const local = t - n * 0.09;
      if (local >= 0) value += Math.sin(2 * Math.PI * hz * local) * Math.min(1, local / 0.008) * Math.exp(-local * 24) * 0.3;
    });
    buffer.writeInt16LE(Math.round(value * 32767), 44 + i * 2);
  }
  writeFileSync(`public/audio/${name}.wav`, buffer);
}
console.log('Created original sent/received tones.');
