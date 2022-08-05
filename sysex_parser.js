const parsers = Object.freeze([
	// Roland: Data Set and Request
	{
		regexp: /^f0 41 .. (?:00 )*.. (?:1[12]|4[012]|00 12) ((?:.. )+).. f7/u,
		checker: calcCheckSumRol,
	},
	// Yamaha XG and later synths: Bulk Dump
	{
		regexp: /^f0 43 0. (?:7f 1c ..|7f ..|..) ((?:.. )+).. f7$/u,	// TODO: Sub-model ID '1c' needs to be updated in near future.
		checker: calcCheckSumRol,
	},
	// Yamaha GM sound modules: Parameter Change and Bulk Dump Request
	{
		regexp: /^f0 43 [13]. (?:27|2b|44) ((?:.. )+).. f7/u,
		checker: calcCheckSumRol,
	},
	// Yamaha DX series: Bulk Dump
	{
		regexp: /^f0 43 0. 0[01234569] .. .. ((?:.. )+).. f7$/u,
		checker: calcCheckSumRol,
	},
	// Yamaha Universal Dump
	// Note: Only supports "single-packet" form.
	{
		regexp: /^f0 43 0. (?:0[ab]|7[acde]) .. .. ((?:.. )+).. f7$/u,
		checker: calcCheckSumRol,
	},
	// Yamaha PSS: Bulk Dump
	{
		regexp: /^f0 43 76 0[0123789a] ((?:.. )+).. f7$/u,
		checker: calcCheckSumRol,
	},
	// Yamaha PSS: Bulk Dump (with byte counts)
	{
		regexp: /^f0 43 76 (?:0[de]|1[123468cdef]|2[01]) .. .. ((?:.. )+).. f7$/u,
		checker: calcCheckSumRol,
	},
	// Korg N series: Data Dump
	{
		regexp: /^f0 42 3. (?:42|4c) (?:3[0-9a-c]|7f) ((?:.. )+).. f7/u,
		checker: calcCheckSumRol,
	},
	// Korg Wave Station: Dump
	{
		regexp: /^f0 42 3. 28 (?:4[09cd]|5[0145acdef]|6[012]) ((?:.. )+).. f7/u,
		checker: calcCheckSum,
	},
	// Casio: Oneway/Handshake Parameter Set Bulk Send (BDS/HDS)
	{
		regexp: /^f0 44 11 .. .. 0[24] .. .. .. .. .. .. .. .. ((?:.. .. .. )+).. f7/u,
		checker: calcCheckSumRol,
	},
	// Casio: Oneway/Handshake Bulk Parameter Set Send (OBS/HBS)
	{
		regexp: /^f0 44 15 .. .. 0[46] .. .. .. .. .. .. .. .. ((?:.. .. .. )+).. f7/u,
		checker: calcCheckSumRol,
	},
	// Technics: Data Request, Individual Data, Data Block, and Continuing Data
	{
		regexp: /^f0 (50 (?:2b|2c|2d|7e) (?:.. )+).. f7/u,
		checker: calcCheckXor,
	},
	// Suzuki BH-1000: Data Set 1
	{
		regexp: /^f0 55 .. 42 12 ((?:.. )+).. f7/u,
		checker: calcCheckSumRol,
	},
	// E-mu Proteus: Preset Data
	{
		regexp: /^f0 18 (?:04|0a|0c) .. 01 .. .. ((?:.. .. )+).. f7/u,
		checker: calcCheckSum,
	},
	// E-mu Proteus 2000: Preset Dump Data
	{
		regexp: /^f0 18 0f .. 55 10 0[24] .. .. ((?:.. .. )+).. f7/u,
		checker: (bytes) => 0x7f - calcCheckSum(bytes),	// 1's complement
	},
	// Universal SysEx: Sample Data Packet
	{
		regexp: /^f0 (7e .. 02 .. (?:.. ){120}).. f7$/u,
		checker: calcCheckXor,
	},
	// Universal SysEx: File Dump Data Packet
	{
		regexp: /^f0 (7e .. 07 02 .. .. (?:.. )+?).. f7$/u,
		checker: calcCheckXor,
	},
	// Universal SysEx: MIDI Tuning Standard / Bulk Dump Reply
	{
		regexp: /^f0 (7e .. 08 01 .. (?:.. ){16}(?:.. .. .. ){128}).. f7$/u,
		checker: calcCheckXor,
	},
	// Universal SysEx: MIDI Tuning Standard / Key-Based Tuning Dump
	{
		regexp: /^f0 (7e .. 08 04 .. .. (?:.. ){16}(?:.. .. .. ){128}).. f7$/u,
		checker: calcCheckXor,
	},
	// Universal SysEx: MIDI Tuning Standard / Scale/Octave Tuning Dump (1-byte format)
	{
		regexp: /^f0 (7e .. 08 05 .. .. (?:.. ){16}(?:.. ){12}).. f7$/u,
		checker: calcCheckXor,
	},
	// Universal SysEx: MIDI Tuning Standard / Scale/Octave Tuning Dump (2-byte format)
	{
		regexp: /^f0 (7e .. 08 06 .. .. (?:.. ){16}(?:.. .. ){12}).. f7$/u,
		checker: calcCheckXor,
	},
	// Universal SysEx: MIDI Visual Control
	{
		regexp: /^f0 7e .. 0c 01 ((?:.. )+).. f7/u,
		checker: calcCheckSumRol,
	},
]);

export function parseSysEx(bytes) {
	if (!bytes || !bytes.length) {
		return null;
	}

	// Checks whether it is a valid SysEx.
	const sysExStr = bytesToHex(bytes);
	if (!/^f0 (?:0[1-9a-f]|[1-5].|7[def]|00 0[0-2] [0-7].|00 2[0-2] [0-7].|00 40 [0-7].|00 48 [0-7].) (?:[0-7]. )*f7$/u.test(sysExStr)) {
		return null;
	}
	console.assert(bytes.length >= 3);

	// Applies each SysEx parser.
	const checkSum = bytes[bytes.length - 2];
	for (const parser of parsers) {
		const m = sysExStr.match(parser.regexp);
		if (m) {
			const rangeIndex = bytes.length - m[1].length / 3 - 2;
			console.assert(Number.isInteger(rangeIndex));
			const range = bytes.slice(rangeIndex, -2);
			const calculatedCheckSum = parser.checker(range);

			return {
				bytes,
				isNeededCheckSum: true,
				isCheckSumError: (checkSum !== calculatedCheckSum),
				checkSum, calculatedCheckSum, range, rangeIndex,
			};
		}
	}

	return {bytes, isNeededCheckSum: false};
}

export function calcCheckSumRol(bytes) {
	console.assert(bytes && bytes.length);
	return (0x80 - calcCheckSum(bytes)) % 0x80;
}

export function calcCheckSum(bytes) {
	console.assert(bytes && bytes.length);
	return bytes.reduce((p, c) => p + c) % 0x80;
}

export function calcCheckXor(bytes) {
	console.assert(bytes && bytes.length);
	return bytes.reduce((p, c) => p ^ c);
}

export function bytesToHex(bytes) {
	console.assert(bytes && bytes.length);
	return [...bytes].map((e) => `0${Number(e).toString(16)}`.slice(-2)).join(' ');
}
