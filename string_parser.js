export function parseSysExStr(sysExStr) {
	if (!sysExStr || typeof sysExStr !== 'string') {
		return null;
	}

	const bytes = [];
	let isValid = true;
	let index = 0;
	while (index < sysExStr.length) {
		const fragment = sysExStr.slice(index);

		// Skips spaces.
		let m = fragment.match(/^[\s,]+/u);
		if (m) {
			console.assert(m.index === 0);
			index += m[0].length;
			continue;
		}

		// Skips C style comment.
		m = fragment.match(/^(\/\*[\s\S]*?\*\/)/ui);
		if (m) {
			console.assert(m.index === 0);
			index += m[0].length;
			continue;
		}

		// Skips C++ style comment.
		m = fragment.match(/^(\/\/.*[\r\n])/ui) || fragment.match(/^(\/\/.*)$/ui);
		if (m) {
			console.assert(m.index === 0);
			index += m[0].length;
			continue;
		}

		// Parses the string as bit.
		m = fragment.match(/^B'([01]+)\b/ui);
		if (m) {
			console.assert(m.index === 0);
			const value = parseInt(m[1], 2);
			if (!is8Bit(value)) {
				isValid = false;
				break;
			}

			bytes.push(value);
			index += m[0].length;
			continue;
		}

		// Parses the string as decimal.
		m = fragment.match(/^D'(\d+)\b/ui);
		if (m) {
			console.assert(m.index === 0);
			const value = parseInt(m[1], 10);
			if (!is8Bit(value)) {
				isValid = false;
				break;
			}

			bytes.push(value);
			index += m[0].length;
			continue;
		}

		// Parses the string as decimal. (excess 64)
		m = fragment.match(/^([+-]\d+)\b/ui);
		if (m) {
			console.assert(m.index === 0);
			const value = parseInt(m[1], 10) + 64;
			if (!is8Bit(value)) {
				isValid = false;
				break;
			}

			bytes.push(value);
			index += m[0].length;
			continue;
		}

		// Parses the string as consecutive 2-digit hexadecimal. (or 1-digit decimal/hexadecimal)
		m = fragment.match(/^(?:0x|\$|H')?((?:[0-9a-f]{1,2}|(?:[0-9a-f]{2})+))(h)?\b/ui);
		if (m) {
			console.assert(m.index === 0);
			const values = m[1].match(/[0-9a-f]{1,2}/uig).map((e) => parseInt(e, 16));
			console.assert(values.every(is8Bit));

			bytes.push(...values);
			index += m[0].length;
			continue;
		}

		// Parses the string as note number.
		m = fragment.match(/^o(-?\d+)([cdefgab][#+-]?)/ui);	// TODO: '\b'
		if (m) {
			console.assert(m.index === 0);
			const offset = {
				'c':   0,
				'c+':  1,
				'd-':  1,
				'd':   2,
				'd+':  3,
				'e-':  3,
				'e':   4,
				'f':   5,
				'f+':  6,
				'g-':  6,
				'g':   7,
				'g+':  8,
				'a-':  8,
				'a':   9,
				'a+': 10,
				'b-': 10,
				'b':  11,
			}[m[2].toLowerCase().replace('#', '+')];
			if (typeof offset === 'undefined') {
				isValid = false;
				break;
			}
			const octave = parseInt(m[1], 10);
			const value = (octave + 1) * 12 + offset;
			if (!is8Bit(value)) {
				isValid = false;
				break;
			}

			bytes.push(value);
			index += m[0].length;
			continue;
		}

		// Parses double-quoted string.
		m = fragment.match(/^"(.*?)(?<!\\)"/u);
		if (m) {
			console.assert(m.index === 0);
			let str;
			try {
				str = JSON.parse(m[0].replace(/\\x([0-9a-f]{2})/uig, '\\u00$1'));
			} catch (e) {
				isValid = false;
				break;
			}
			const values = [...replaceAllows(str)].map((ch) => ch.codePointAt(0));
			if (!values.every(is8Bit)) {
				isValid = false;
				break;
			}

			bytes.push(...values);
			index += m[0].length;
			continue;
		}

		isValid = false;
		break;
	}
	console.assert(isValid === (index === sysExStr.length));
	console.assert(bytes.every(is8Bit));

	return {bytes, isValid, index};
}

function is8Bit(value) {
	return (0 <= value && value < 0x100);
}

function replaceAllows(str) {
	return str.replace(/→/ug, '\x7e').replace(/←/ug, '\x7f');
}
