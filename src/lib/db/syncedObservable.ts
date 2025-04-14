import { observable, type ObservableParam } from '@legendapp/state';
import { configureSynced } from '@legendapp/state/sync';
import { observablePersistIndexedDB } from '@legendapp/state/persist-plugins/indexeddb';
import { syncObservable } from '@legendapp/state/sync';

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

export const syncedObservable = <T>(tableName: TableName, data: T) => {
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
