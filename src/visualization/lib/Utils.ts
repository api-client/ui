/**
 * Stops an event and cancels it.
 * @param e The event to stop
 */
export function cancelEvent(e: Event): void {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();
}

/**
 * Get the contrasting color for any hex color
 * (c) 2019 Chris Ferdinandi, MIT License, https://gomakethings.com
 * Derived from work by Brian Suda, https://24ways.org/2010/calculating-color-contrast/
 *
 * See https://gomakethings.com/dynamically-changing-the-text-color-based-on-background-color-contrast-with-vanilla-js/
 *
 * @param hexcolor A hexcolor value
 * @returns The contrasting color (black or white)
 */
export function getContrast(hexcolor: string): string {
	let color = hexcolor;
	// If a leading # is provided, remove it
	if (color.slice(0, 1) === '#') {
		color = color.slice(1);
	}

	// If a three-character hexcode, make six-character
	if (color.length === 3) {
		color = color.split('').map((hex) => hex + hex).join('');
	}

	// Convert to RGB value
	const r = parseInt(color.substring(0, 2), 16);
	const g = parseInt(color.substring(2, 2), 16);
	const b = parseInt(color.substring(4, 2), 16);

	// Get YIQ ratio
	const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

	// Check contrast
	return (yiq >= 128) ? 'black' : 'white';
};

/**
 * Awaits for a specified amount odf time.
 * Zero or negative will result in the next microtask.
 * A positive number will result in the next microtask + the set timeout.
 * 
 * @param timeout The number of milliseconds to wait.
 */
export async function aTimeout(timeout: number = 0): Promise<void> {
	return new Promise((resolve) => {
		if (timeout <= 0) {
			resolve();
		} else {
			setTimeout(() => resolve(), timeout);
		}
	});
}
