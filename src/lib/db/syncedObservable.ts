import { observable } from '@legendapp/state';
import { configureSynced } from '@legendapp/state/sync';
import { observablePersistIndexedDB } from '@legendapp/state/persist-plugins/indexeddb';

const TABLE_NAMES = [
	'weightConverter',
	'coefficientCalculator',
	'plateCalculator',
	'loadPercentageCalculator',
	'trainingLog-workouts',
	'trainingLog-exercises',
	'trainingLog-muscleGroups',
	'trainingLog-performances'
] as const;

type TableName = (typeof TABLE_NAMES)[number];

export const ironKitSync = configureSynced({
	persist: {
		plugin: observablePersistIndexedDB({
			databaseName: 'ironkit-db',
			version: 1,
			tableNames: TABLE_NAMES as unknown as string[]
		})
	},
	debounceSet: 500
});

export const syncedObservable = <T>(tableName: TableName, data: T) => {
	const observable$ = observable<T>(
		ironKitSync({
			persist: {
				name: tableName
			},
			initial: data
		})
	);
	return observable$;
};
