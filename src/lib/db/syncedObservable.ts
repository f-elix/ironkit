import { observable, type ObservableParam } from '@legendapp/state';
import { configureSynced } from '@legendapp/state/sync';
import { observablePersistIndexedDB } from '@legendapp/state/persist-plugins/indexeddb';
import { syncObservable } from '@legendapp/state/sync';
import { shouldNeverHappen } from '$lib/shouldNeverHappen';

export const TABLE_NAMES = [
	'weightConverter',
	'coefficientCalculator',
	'plateCalculator',
	'loadPercentageCalculator'
] as const;

export type TableName = (typeof TABLE_NAMES)[number];

export const persistOptions = configureSynced({
	persist: {
		plugin: observablePersistIndexedDB({
			databaseName: 'ironkit-db',
			version: 1,
			tableNames: [...TABLE_NAMES]
		})
	}
});

const usedTable = new Set<TableName>();

export const syncedObservable = <T>(tableName: TableName, data: T) => {
	if (usedTable.has(tableName)) {
		shouldNeverHappen(`Duplicate table name "${tableName}"`);
	}
	usedTable.add(tableName);
	const observable$ = observable<T>(data);
	syncObservable<T>(
		observable$ as ObservableParam<T>,
		persistOptions({
			persist: {
				name: tableName
			}
		})
	);
	return observable$;
};
