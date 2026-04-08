const DEFAULT_TIME_ZONE = 'Asia/Shanghai';

function getLocalDateParts(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
	const formatter = new Intl.DateTimeFormat('en-CA', {
		timeZone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
	});

	const parts = formatter.formatToParts(date);
	return {
		year: parts.find((part) => part.type === 'year')?.value,
		month: parts.find((part) => part.type === 'month')?.value,
		day: parts.find((part) => part.type === 'day')?.value,
	};
}

function getLocalDateString(date = new Date(), timeZone = DEFAULT_TIME_ZONE) {
	const { year, month, day } = getLocalDateParts(date, timeZone);
	return `${year}-${month}-${day}`;
}

module.exports = {
	DEFAULT_TIME_ZONE,
	getLocalDateParts,
	getLocalDateString,
};
