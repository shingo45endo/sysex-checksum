SysEx Checksum Calculator
=========================

https://shingo45endo.github.io/sysex-checksum/


What is this?
-------------

This application calculates a checksum at the end of SysEx bytes (mainly for Roland MIDI devices).

SysEx, or System Exclusive message have their own formats depending on the manufacturers and the devices. As for Roland devices, from the days of the D-50 (released in 1987) to the present, require a checksum at the end of the SysEx. Other than Roland, some devices require such kind of checksum. This application will help you to calculate a checksum of the recognized payload range based on the input SysEx format.


How to Use
----------

1. Enter SysEx bytes as hexadecimal string (without trailing checksum and F7 bytes).
2. Then, a complete SysEx string is generated with the auto-calculated checksum and F7 bytes added. You can:
	* Save it as a .syx file
	* Copy it to the clipboard
	* Send it to a MIDI device (only for browsers that support Web MIDI API)


Special Notations
-----------------

The input SysEx string can contain the special notations other than hexadecimal. These special notations are interpreted as follows:

| Input          | Result     | Remarks |
| -------------- | ---------- | ------- |
| `B'1010101`    | `55`       | Binary representation |
| `D'123`        | `7b`       | Decimal representation |
| `H'40`         | `40`       | Hexadecimal representation |
| `0x41`         | `41`       | C-style hexadecimal |
| `$42`          | `42`       | Assembler-style hexadecimal (Motorola) |
| `43h`          | `43`       | Assembler-style hexadecimal (Intel) |
| `+12`          | `4c`       | Excess-64 (64 plus N) |
| `-12`          | `34`       | Excess-64 (64 minus N) |
| `400130`       | `40 01 30` | Consecutive 2-digit hexadecimal |
| `o4c`          | `3c`       | MIDI note number |
| `"Strings"`    | `53 74 72 69 6e 67 73` | ASCII string |
| `"\"\/\\"`     | `22 2f 5c` | 2-character escape sequence in string |
| `"\b\f\n\r\t"` | `08 0c 0a 0d 09` | 2-character escape sequence in string (control codes) |
| `"\x00"`       | `00`       | 2-digit hexadecimal escape sequence in string |
| `"\u0000"`     | `00`       | 4-digit hexadecimal escape sequence in string (don't exceed 8-bit range) |
| `"→←"`         | `7e 7f`    | Allow characters are mapped to \x7e and \x7f (like HD44780 character set) |

* Spaces and commas are treated as whitespace and are considered to be delimiters.
* C/C++ style comments are valid.


Supported SysEx Formats
-----------------------

* Roland MIDI devices (D-50 and later)
	* Data Set 1 commands (DT1)
	* Request Data 1 commands (RQ1)
	* Data Set commands (DAT)
	* Request Data commands (RQD)
	* Want to Send Data commands (WSD)
* Yamaha XG and later synths
	* Bulk dump commands
* Yamaha GM sound modules (TG100, TG300, and MU5)
	* Parameter Change commands
	* Bulk Dump Request commands
* Yamaha DX series
	* Bulk Dump commands
* Yamaha Universal Dump
	* Note: Only supports "single-packet" form.
* Yamaha PSS series
	* Bulk Dump commands
	* Bulk Dump commands (with byte counts)
* Korg N series (NS5R, N1R, and NX5R)
	* Data Dump commands
* Korg Wave Station series
	* Dump commands
* Casio PX and WK series
	* Oneway/Handshake Parameter Set Bulk Send commands (BDS/HDS)
	* Oneway/Handshake Bulk Parameter Set Sent commands (OBS/HBS)
* Suzuki BH-1000 (including Eniac BH-1000 and Hammond GM-1000)
	* Data Set 1 commands
* E-mu Proteus series
	* Preset Data commands
* E-mu Proteus 2000 series
	* Preset Dump Data commands
* Universal SysEx
	* Sample Data Packet
	* File Dump Data Packet
	* MIDI Tuning Standard
		* Bulk Dump Reply
		* Key-Based Tuning Dump
		* Scale/Octave Tuning Dump (1-byte format)
		* Scale/Octave Tuning Dump (2-byte format)
	* MIDI Visual Control


TODO
----

* Make a CLI tool.
* Confirm whether the checksum formula is really correct for each SysEx.


License
-------

MIT


Author
------

[shingo45endo](https://github.com/shingo45endo)
