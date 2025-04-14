import { Context } from 'runed';
import { observable, type Observable } from '@legendapp/state';

export const pauseContext = new Context<Observable<boolean>>('pauseContext');

export const setPauseContext = () => {
	return pauseContext.set(observable(false));
};

export const getPauseContext = () => {
	return pauseContext.get();
};
