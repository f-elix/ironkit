import { FiniteStateMachine } from 'runed';
import { getContext, onDestroy, setContext } from 'svelte';

type ProgramTemplateHeaderSaveState = 'idle' | 'saving' | 'saved';
type ProgramTemplateHeaderSaveEvent = 'START' | 'SUCCESS' | 'FAIL' | 'RESET' | 'RUN_DEBOUNCED';

type DebouncedSaveOptions = {
	delayMs?: number;
	shouldSave: () => boolean;
	save: () => Promise<void> | void;
};

class ProgramTemplateHeaderSaveController {
	#machine: FiniteStateMachine<ProgramTemplateHeaderSaveState, ProgramTemplateHeaderSaveEvent>;
	#inFlightCount = 0;
	#hasFailedInBatch = false;
	#debouncedSaveOptions = new Map<string, DebouncedSaveOptions>();
	#pendingDebouncedKeys = new Set<string>();

	constructor() {
		this.#machine = new FiniteStateMachine<ProgramTemplateHeaderSaveState, ProgramTemplateHeaderSaveEvent>(
			'idle',
			{
				idle: {
					START: 'saving',
					RESET: 'idle',
					RUN_DEBOUNCED: () => {
						this.#flushPendingDebouncedSaves();
					}
				},
				saving: {
					START: 'saving',
					SUCCESS: 'saved',
					FAIL: 'idle',
					RESET: 'saving',
					RUN_DEBOUNCED: () => {
						this.#flushPendingDebouncedSaves();
					}
				},
				saved: {
					START: 'saving',
					RESET: 'idle',
					RUN_DEBOUNCED: () => {
						this.#flushPendingDebouncedSaves();
					},
					_enter: () => {
						void this.#machine.debounce(2000, 'RESET');
					}
				}
			}
		);


		onDestroy(() => {
			this.#destroy();
		});
	}

	get status(): ProgramTemplateHeaderSaveState {
		return this.#machine.current;
	}

	run = async <T>(save: () => Promise<T>): Promise<T> => {
		this.#beginSave();
		try {
			const result = await save();
			this.#finishSuccess();
			return result;
		} catch (error) {
			this.#finishFailure();
			throw error;
		}
	};

	queueDebounced = (key: string, options: DebouncedSaveOptions) => {
		const { delayMs = 500, shouldSave, save } = options;
		this.#debouncedSaveOptions.set(key, { shouldSave, save, delayMs });
		this.#pendingDebouncedKeys.add(key);
		void this.#machine.debounce(delayMs, 'RUN_DEBOUNCED');
	};

	flushDebounced = (key: string, options: Omit<DebouncedSaveOptions, 'delayMs'>) => {
		this.#debouncedSaveOptions.set(key, { ...options });
		this.#pendingDebouncedKeys.add(key);
		void this.#machine.debounce(0, 'RUN_DEBOUNCED');
	};

	cancelDebounced = (key: string) => {
		this.#debouncedSaveOptions.delete(key);
		this.#pendingDebouncedKeys.delete(key);
	};

	#destroy = () => {
		this.#debouncedSaveOptions.clear();
		this.#pendingDebouncedKeys.clear();
		void this.#machine.debounce(0, 'RUN_DEBOUNCED');
	};

	#beginSave = () => {
		if (this.#inFlightCount === 0) {
			this.#hasFailedInBatch = false;
		}
		this.#inFlightCount += 1;
		this.#machine.send('START');
	};

	#finishSuccess = () => {
		this.#inFlightCount = Math.max(0, this.#inFlightCount - 1);
		if (this.#inFlightCount > 0) {
			return;
		}
		this.#machine.send(this.#hasFailedInBatch ? 'FAIL' : 'SUCCESS');
	};

	#finishFailure = () => {
		this.#hasFailedInBatch = true;
		this.#inFlightCount = Math.max(0, this.#inFlightCount - 1);
		if (this.#inFlightCount > 0) {
			return;
		}
		this.#machine.send('FAIL');
	};

	#flushPendingDebouncedSaves = () => {
		const keys = [...this.#pendingDebouncedKeys];
		this.#pendingDebouncedKeys.clear();
		for (const key of keys) {
			const options = this.#debouncedSaveOptions.get(key);
			if (!options || !options.shouldSave()) {
				continue;
			}
			void this.run(async () => {
				await options.save();
			});
		}
	};
}

const programTemplateHeaderSaveContextKey = Symbol('program-template-header-save');

export const setProgramTemplateHeaderSaveContext = () => {
	return setContext(programTemplateHeaderSaveContextKey, new ProgramTemplateHeaderSaveController());
};

export const getProgramTemplateHeaderSaveContext = () => {
	return getContext<ProgramTemplateHeaderSaveController>(programTemplateHeaderSaveContextKey);
};
