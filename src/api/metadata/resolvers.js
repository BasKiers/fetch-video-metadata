// @flow
import ffprobe from '../../lib/ffprobe';

function getMetadata(url) {
    // We could check whether the url or file path is valid and preemptively return an error
    return ffprobe(url);
}

function parseMetadata({ format = {}, streams = [] } = {}) {
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
        bitRate: format.bit_rate || null,
        duration: !isNaN(duration) ? Math.round(duration * 1000) : null,
        ...streamData,
    };
}

function parseAudioMetadata(data) {
    if (!data) return null;
    return {
        bitRate: data.bit_rate || null,
        channelLayout: data.channel_layout || null,
        channels: data.channels || null,
        sampleRate: data.sample_rate || null,
    }
}

function parseVideoMetadata(data: VideoStreamData) {
    if (!data) return null;
    // We could check whether the ffprobe data object describes a video file or a different media file like an .jpg and throw an error.

    return {
        bitRate: data.bit_rate || null,
        frameRate: parseAVRational(data.r_frame_rate),
        resolution: {
            width: data.coded_width || null,
            height: data.coded_height || null,
        }
    }
}

function parseAVRational(rational) {
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
