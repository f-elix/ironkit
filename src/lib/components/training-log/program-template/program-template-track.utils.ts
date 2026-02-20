const TRACK_COLORS: Record<string, string> = {
	A: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
	B: 'bg-sky-500/15 text-sky-300 border-sky-500/20',
	C: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
	D: 'bg-rose-500/15 text-rose-300 border-rose-500/20',
	E: 'bg-violet-500/15 text-violet-300 border-violet-500/20',
	F: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/20',
	G: 'bg-orange-500/15 text-orange-300 border-orange-500/20',
	H: 'bg-pink-500/15 text-pink-300 border-pink-500/20'
};

const DEFAULT_TRACK_COLOR = 'bg-muted/50 text-muted-foreground border-border/50';

export const getTrackColor = (trackKey: string) => {
	return TRACK_COLORS[trackKey.toUpperCase()] ?? DEFAULT_TRACK_COLOR;
};

export const normalizeTrackKey = (trackKey: string, fallback = 'A') => {
	return trackKey.trim().toUpperCase() || fallback;
};

export const getFirstAvailableTrackKey = (usedTrackKeys: Set<string>) => {
	for (const letter of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
		if (!usedTrackKeys.has(letter)) {
			return letter;
		}
	}
	return 'A';
};
