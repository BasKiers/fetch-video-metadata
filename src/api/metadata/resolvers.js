// @flow
import type { ProbeResult, VideoStreamData, AudioStreamData } from '../../lib/ffprobe';
import ffprobe  from '../../lib/ffprobe';

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

function parseMetadata({ format, streams }: ProbeResult): MediaMetadata {
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

    const duration = parseFloat(format.duration);

    return {
        bitRate: typeof format.bit_rate === 'number' ? format.bit_rate : null,
        duration: !isNaN(duration) ? Math.round(duration * 1000) : null,
        ...streamData,
    };
}

function parseAudioMetadata(data: AudioStreamData): ?AudioMetadata {
    if (
        data.bit_rate === null || data.bit_rate === undefined ||
        data.channel_layout === null || data.channel_layout === undefined ||
        data.channels === null || data.channels === undefined ||
        data.sample_rate === null || data.sample_rate === undefined
    ) return null;

    return {
        bitRate: data.bit_rate,
        channelLayout: data.channel_layout,
        channels: data.channels,
        sampleRate: data.sample_rate,
    }
}

function parseVideoMetadata(data: VideoStreamData): ?VideoMetadata {
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
        bitRate: data.bit_rate,
        frameRate,
        resolution: {
            width: data.coded_width,
            height: data.coded_height,
        }
    }
}

function parseAVRational(rational: string): ?number {
    if (typeof rational !== 'string' || !rational.indexOf('/')) return null;

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
        }
    },
}
