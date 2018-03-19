// @flow
import type { ProbeResult, VideoStreamData, AudioStreamData } from '../../lib/ffprobe';
import ffprobe  from '../../lib/ffprobe';

/**
 * Retreives metadata object from url/filepath
 * @param {String} url An url or filepath to read the media file from
 * @returns {Promise.<ProbeResult>} result the ffprobe metadata object
 */
function getMetadata(url) {
	// We could check whether the url or file path is valid and preemptively return an error
	return ffprobe(url);
}

export type MediaMetadata = {
	audio: Array<AudioMetadata>,
	video: Array<VideoMetadata>,
	bitRate: ?number,
	duration: ?number,
}

export type VideoMetadata = {
	bitRate: number,
	frameRate: number,
	resolution: Resolution,
}

export type Resolution = {
	width: number,
	height: number,
}

export type AudioMetadata = {
	bitRate: number,
	channelLayout: string,
	channels: number,
	sampleRate: number
}

/**
 * Parses the ffprobe metadata object into the object served by the api endpoint
 * @param {ProbeResult} metadata The metadata object retreived from rfprobe
 * @returns {MediaMetadata | null} result The MediaMetadata object or null if given metadata did not contain relevant information
 */
export function parseMetadata({ format, streams }: ProbeResult): ?MediaMetadata {
	const streamData = streams.reduce((result, stream) => {
		if (stream.codec_type === 'video') {
			const metadata = parseVideoMetadata(stream);
			if (metadata) {
				result.video.push(metadata);
			}
		} else if (stream.codec_type === 'audio') {
			const metadata = parseAudioMetadata(stream);
			if (metadata) {
				result.audio.push(metadata);
			}
		}
		return result;
	}, { audio: [], video: [] });

	if(streamData.audio.length === 0 && streamData.video.length === 0) return null;

	const duration = parseFloat(format.duration);
	const bitRate = parseInt(format.bit_rate);

	return {
		bitRate: !isNaN(bitRate) ? bitRate : null,
		duration: !isNaN(duration) ? Math.round(duration * 1000) : null,
		...streamData,
	};
}

/**
 * Parses audio stream metadata from the ffprobe metadata object
 * @param {AudioStreamData} data The audio stream metadata object
 * @returns {AudioMetadata | null} result The AudioMetadata object or null if given metadata did not contain relevant information
 */
export function parseAudioMetadata(data: AudioStreamData): ?AudioMetadata {
	if (
		data.bit_rate === null || data.bit_rate === undefined ||
		data.channel_layout === null || data.channel_layout === undefined ||
		data.channels === null || data.channels === undefined ||
		data.sample_rate === null || data.sample_rate === undefined
	) return null;

	return {
		bitRate: parseInt(data.bit_rate),
		channelLayout: data.channel_layout,
		channels: data.channels,
		sampleRate: parseInt(data.sample_rate),
	}
}

/**
 * Parses video stream metadata from the ffprobe metadata object
 * @param {VideoStreamData} data The video stream metadata object
 * @returns {VideoMetadata | null} result The VideoMetadata object or null if given metadata did not contain relevant information
 */
export function parseVideoMetadata(data: VideoStreamData): ?VideoMetadata {
	if (
		data.bit_rate === null || data.bit_rate === undefined ||
		data.r_frame_rate === null || data.r_frame_rate === undefined ||
		data.coded_width === null || data.coded_width === undefined ||
		data.coded_height === null || data.coded_height === undefined
	) return null;

	const frameRate = parseAVRational(data.r_frame_rate);
	if (frameRate === null) return null;

	// We could check whether the ffprobe data object describes a video file or a different media file like an .jpg and throw an error.
	return {
		bitRate: parseInt(data.bit_rate),
		frameRate,
		resolution: {
			width: data.coded_width,
			height: data.coded_height,
		}
	}
}

/**
 * Parses strings containing an AVRational number. This number is encoded in a string by two numbers delimited by a "/"
 * The number parts represent the numerator and denominator ("{numerator}/{denominator}") e.g. "5/10" for the number 0.5
 * @param {String} rational The AVRational number string to parse
 * @returns {Number | null} result The parsed Number or null if an invalid AVRational string was given
 */
export function parseAVRational(rational: string): ?number {
	if (typeof rational !== 'string' || (rational.match(/\//g) || []).length !== 1) return null;

	const [numerator, denominator] = rational.split('/');
	const result = parseInt(numerator) / parseInt(denominator);
	if (isNaN(result)) return null;

	return result;
}

export default {
	Query: {
		metadata: (_: mixed, { url }: { url: string }) => {
			return getMetadata(url)
				.then(parseMetadata)
				.then(result => {
					if(result === null){
						return Promise.reject(new Error('This file is incompatible with this api.'))
					}
					return result;
				})
		}
	},
}
