// @flow
/*
 * Based on the ffprobe npm package
 * ref: https://github.com/eugeneware/ffprobe/blob/master/index.js
 */

import JSONStream from 'JSONStream';
import bl from 'bl';
import { spawn } from 'child_process';
import path from 'path';

const ffprobePath = path.join(__dirname, '../../bin/ffprobe');

type ProbeResponse = ProbeResult | ProbeError;

export type ProbeError = {
	error: {
		code: number,
		string: string,
	}
}

export type ProbeResult = {
	streams: Array<VideoStreamData | AudioStreamData>,
	format: FormatData
}

export type VideoStreamData = {
	codec_type: 'video',
	bit_rate: ?string,
	r_frame_rate: ?string,
	coded_width: ?number,
	coded_height: ?number
}

export type AudioStreamData = {
	codec_type: 'audio',
	bit_rate: ?string,
	channel_layout: ?string,
	channels: ?number,
	sample_rate: ?string
}

export type FormatData = {
	duration: ?string,
	bit_rate: ?string
}

export default function ffprobe(filePath: string, opts: string[] = []): Promise<ProbeResult> {
	const params = [...opts, '-show_streams', '-show_format', '-show_error', '-print_format', 'json', filePath];

	return new Promise((resolve, reject) => {
		let info: ProbeResponse;
		let stderr: string;
		const ffprobe = spawn(ffprobePath, params);

		ffprobe.once('close', function (code: number) {
			if (code > 1 || code === 1 && !info) {
				const err = (stderr || '').split('\n').filter(Boolean).pop();
				return reject(new Error(err));
			}
			if (info.error) {
				return reject(new Error(info.error.string || 'Could not get metadata for given file'));
			}
			resolve(info);
		});

		ffprobe.stderr.pipe(bl((err: Error, data: any) => {
			stderr = data.toString();
		}));

		ffprobe.stdout
			.pipe(JSONStream.parse())
			.once('data', function (data: ProbeResponse) {
				info = data;
			});
	});
}
