import { TriplitClient } from '@triplit/client';
import { schema } from '../triplit/schema.js';
import { readdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadEnv } from 'vite';

const env = loadEnv('development', process.cwd(), 'TRIPLIT_');

const TRIPLIT_SERVER_URL = env.TRIPLIT_DB_URL || '';
const TRIPLIT_TOKEN = env.TRIPLIT_SERVICE_TOKEN || '';

console.log('Starting Triplit data export...');
console.log('Server URL:', TRIPLIT_SERVER_URL);
console.log('Token:', TRIPLIT_TOKEN ? 'Present' : 'Not set');

const triplit = new TriplitClient({
	schema,
	serverUrl: TRIPLIT_SERVER_URL,
	storage: { type: 'memory' },
	token: TRIPLIT_TOKEN,
	autoConnect: false
});

const collectionNames = [
	'weightConverter',
	'coefficientCalculator',
	'loadPercentageCalculator',
	'plateCalculator',
	'exercises',
	'workouts',
	'performanceGroups',
	'performances',
	'performanceSets'
] as const;

const cleanPreviousExport = () => {
	const exportPath = join(process.cwd(), 'data-export.json');
	rmSync(exportPath, { force: true });

	const dataDir = join(process.cwd(), 'src/convex/triplit-data');
	for (const entry of readdirSync(dataDir)) {
		if (entry.endsWith('.json')) {
			rmSync(join(dataDir, entry), { force: true });
		}
	}
};

async function exportData() {
	cleanPreviousExport();

	const exportData: Record<string, any[]> = {};

	for (const collectionName of collectionNames) {
		console.log(`\nExporting ${collectionName}...`);
		try {
			const results = await triplit.http.fetch({ collectionName });
			exportData[collectionName] = results;
			console.log(`  ✓ Exported ${results.length} items from ${collectionName}`);
		} catch (error) {
			console.error(`  ✗ Error exporting ${collectionName}:`, error);
			exportData[collectionName] = [];
		}
	}

	const outputPath = join(process.cwd(), 'data-export.json');
	writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
	console.log(`\n✓ Export complete! Data saved to: ${outputPath}`);

	console.log('\n--- Export Summary ---');
	for (const [collection, items] of Object.entries(exportData)) {
		console.log(`${collection}: ${items.length} items`);
	}
}

exportData()
	.then(() => {
		console.log('\n✓ Export script completed successfully');
		process.exit(0);
	})
	.catch((error) => {
		console.error('\n✗ Export script failed:', error);
		process.exit(1);
	});
