import { DateFormatter, getLocalTimeZone } from '@internationalized/date';

export const formatDate = (date: Date | undefined, options?: Intl.DateTimeFormatOptions) => {
	if (!date) {
		return '';
	}
	const df = new DateFormatter('en-CA', {
		timeZone: getLocalTimeZone(),
		dateStyle: 'long',
		...options
	});
	return df.format(date);
};
