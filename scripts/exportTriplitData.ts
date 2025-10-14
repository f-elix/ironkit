import { TriplitClient } from '@triplit/client';
import { schema } from '../triplit/schema.js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const TRIPLIT_SERVER_URL = process.env.PUBLIC_TRIPLIT_SERVER_URL || '';
const TRIPLIT_TOKEN = process.env.TRIPLIT_TOKEN || '';

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

async function exportData() {
	const exportData: Record<string, any[]> = {};

	for (const collectionName of collectionNames) {
		console.log(`\nExporting ${collectionName}...`);
		try {
			// Try to fetch from server first
			const query = triplit.query(collectionName);
			// @ts-expect-error - Query types are complex
			const results = await triplit.fetch(query);
			const items = Array.from(results.values());
			exportData[collectionName] = items;
			console.log(`  ✓ Exported ${items.length} items from ${collectionName}`);
		} catch (error) {
			console.error(`  ✗ Error exporting ${collectionName}:`, error);
			exportData[collectionName] = [];
		}
	}

	const outputPath = join(process.cwd(), 'data-export.json');
	writeFileSync(outputPath, JSON.stringify(exportData, null, 2));
	console.log(`\n✓ Export complete! Data saved to: ${outputPath}`);

	// Print summary
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
