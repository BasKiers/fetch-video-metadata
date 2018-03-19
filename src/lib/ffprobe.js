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

export type ProbeResult = {
    streams: Array<VideoStreamData | AudioStreamData>,
    format: FormatData
}

export type VideoStreamData = {
    codec_type: 'video',
    bit_rate: number,
    r_frame_rate: string,
    coded_width: number,
    coded_height: number
}

export type AudioStreamData = {
    codec_type: 'audio',
    bit_rate: number,
    channel_layout: string,
    channels: number,
    sample_rate: number
}

export type FormatData = {
    duration: number,
    bit_rate: number
}

export default function ffprobe(filePath: string, opts: string[] = []): Promise<ProbeResult> {
    const params = [...opts, '-show_streams', '-show_format', '-print_format', 'json', filePath];

    return new Promise((resolve, reject) => {
        let info: ProbeResult;
        let stderr: string;
        const ffprobe = spawn(ffprobePath, params);

        ffprobe.once('close', function (code: number) {
            if (!code) {
                const err = (stderr || '').split('\n').filter(Boolean).pop();
                return reject(new Error(err));
            }
            resolve(info);
        });

        ffprobe.stderr.pipe(bl((err: Error, data: any) => {
            stderr = data.toString();
        }));

        ffprobe.stdout
            .pipe(JSONStream.parse())
            .once('data', function (data: ProbeResult) {
                info = data;
            });
    });
}
