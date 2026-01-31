import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const exportPath = join(process.cwd(), 'data-export.json');
const outputDir = join(process.cwd(), 'src/convex/triplit-data');

type ExportPayload = Record<string, unknown[]>;

const raw = readFileSync(exportPath, 'utf-8');
const data = JSON.parse(raw) as ExportPayload;

for (const [collection, items] of Object.entries(data)) {
	const outputPath = join(outputDir, `${collection}.json`);
	writeFileSync(outputPath, JSON.stringify(items, null, 2));
	console.log(`Wrote ${items.length} items to ${outputPath}`);
}
