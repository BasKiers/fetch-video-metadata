import {
	default as resolvers,
	parseMetadata,
	parseAudioMetadata,
	parseVideoMetadata,
	parseAVRational
} from './resolvers';

const SAMPLE_METADATA = {
	format: {
		bit_rate: '1334445',
		duration: '90.001000',
		filename: 'https://s3-eu-west-1.amazonaws.com/tradecast-development-test/sample-video/tradecast.mp4',
		format_long_name: 'QuickTime / MOV',
		format_name: 'mov,mp4,m4a,3gp,3g2,mj2',
		nb_programs: 0,
		nb_streams: 2,
		probe_score: 100,
		size: '15012674',
		start_time: '0.000000',
		tags: {
			compatible_brands: 'isomiso2avc1mp41',
			encoder: 'Lavf57.25.100',
			episode_sort: '1',
			hd_video: '0',
			major_brand: 'isom',
			media_type: '9',
			minor_version: '512',
			season_number: '1'
		}
	},
	streams: [
		{
			avg_frame_rate: '25/1',
			bit_rate: '1167864',
			bits_per_raw_sample: '8',
			chroma_location: 'left',
			codec_long_name: 'H.264 / AVC / MPEG-4 AVC / MPEG-4 part 10',
			codec_name: 'h264',
			codec_tag: '0x31637661',
			codec_tag_string: 'avc1',
			codec_time_base: '1/50',
			codec_type: 'video',
			coded_height: 720,
			coded_width: 1280,
			display_aspect_ratio: '16:9',
			disposition: {
				attached_pic: 0,
				clean_effects: 0,
				comment: 0,
				default: 1,
				dub: 0,
				forced: 0,
				hearing_impaired: 0,
				karaoke: 0,
				lyrics: 0,
				original: 0,
				timed_thumbnails: 0,
				visual_impaired: 0
			},
			duration: '90.000000',
			duration_ts: 1152000,
			has_b_frames: 2,
			height: 720,
			index: 1,
			is_avc: 'true',
			level: 31,
			nal_length_size: '4',
			nb_frames: '2250',
			pix_fmt: 'yuv420p',
			profile: 'Main',
			r_frame_rate: '25/1',
			refs: 1,
			sample_aspect_ratio: '1:1',
			start_pts: 0,
			start_time: '0.000000',
			tags: { handler_name: 'VideoHandler', language: 'eng' },
			time_base: '1/12800',
			width: 1280
		},
		{
			avg_frame_rate: '0/0',
			bit_rate: '160000',
			bits_per_sample: 0,
			channel_layout: 'stereo',
			channels: 2,
			codec_long_name: 'AAC (Advanced Audio Coding)',
			codec_name: 'aac',
			codec_tag: '0x6134706d',
			codec_tag_string: 'mp4a',
			codec_time_base: '1/44100',
			codec_type: 'audio',
			disposition: {
				attached_pic: 0,
				clean_effects: 0,
				comment: 0,
				default: 1,
				dub: 0,
				forced: 0,
				hearing_impaired: 0,
				karaoke: 0,
				lyrics: 0,
				original: 0,
				timed_thumbnails: 0,
				visual_impaired: 0
			},
			duration: '89.953991',
			duration_ts: 3966971,
			index: 0,
			max_bit_rate: '160000',
			nb_frames: '3876',
			profile: 'LC',
			r_frame_rate: '0/0',
			sample_fmt: 'fltp',
			sample_rate: '44100',
			start_pts: 0,
			start_time: '0.000000',
			tags: { handler_name: 'SoundHandler', language: 'eng' },
			time_base: '1/44100'
		}
	],
};

describe('Test metadata resolver', () => {

	describe('Test data parse functions', () => {

		describe('parseAVRational', () => {

			test('Returns null on invalid rational string input', () => {
				expect(parseAVRational('5')).toBe(null);
				expect(parseAVRational('4/t')).toBe(null);
				expect(parseAVRational('t/5')).toBe(null);
				expect(parseAVRational('t/0')).toBe(null);
				expect(parseAVRational('5/1/2')).toBe(null);
			});

			test('Returns rational number on valid string input', () => {
				expect(parseAVRational('5/10')).toBe(0.5);
				expect(parseAVRational('5/1')).toBe(5);
				expect(parseAVRational('0/10')).toBe(0);
			});

		});

		describe('parseVideoMetadata', () => {

			const sampleVideoData = SAMPLE_METADATA.streams.find(stream => stream.codec_type === 'video');

			test('Returns null on non complete metadata object', () => {
				expect(parseVideoMetadata({})).toBe(null);
				expect(parseVideoMetadata(Object.assign({}, sampleVideoData, { bit_rate: undefined }))).toBe(null);
				expect(parseVideoMetadata(Object.assign({}, sampleVideoData, { r_frame_rate: undefined }))).toBe(null);
				expect(parseVideoMetadata(Object.assign({}, sampleVideoData, { r_frame_rate: 'test' }))).toBe(null);
				expect(parseVideoMetadata(Object.assign({}, sampleVideoData, { coded_width: undefined }))).toBe(null);
				expect(parseVideoMetadata(Object.assign({}, sampleVideoData, { coded_height: undefined }))).toBe(null);
			});

			test('Returns video metadata object on valid metadata input', () => {
				const videoMetadata = parseVideoMetadata(sampleVideoData);
				expect(videoMetadata).not.toBe(null);
				expect(videoMetadata).toEqual(
					expect.objectContaining({
						bitRate: expect.any(Number),
						frameRate: expect.any(Number),
						resolution: expect.objectContaining({
							width: expect.any(Number),
							height: expect.any(Number),
						})
					})
				);
				expect(videoMetadata).toMatchSnapshot();
			});

		});

		describe('parseAudioMetadata', () => {

			const sampleAudioData = SAMPLE_METADATA.streams.find(stream => stream.codec_type === 'audio');

			test('Returns null on non complete metadata object', () => {
				expect(parseAudioMetadata({})).toBe(null);
				expect(parseAudioMetadata({ ...sampleAudioData, bit_rate: undefined })).toBe(null);
				expect(parseAudioMetadata({ ...sampleAudioData, channel_layout: undefined })).toBe(null);
				expect(parseAudioMetadata({ ...sampleAudioData, channels: undefined })).toBe(null);
				expect(parseAudioMetadata({ ...sampleAudioData, sample_rate: undefined })).toBe(null);
			});

			test('Returns video metadata object on valid metadata input', () => {
				const videoMetadata = parseAudioMetadata(sampleAudioData);
				expect(videoMetadata).not.toBe(null);
				expect(videoMetadata).toEqual(
					expect.objectContaining({
						bitRate: expect.any(Number),
						channelLayout: expect.any(String),
						channels: expect.any(Number),
						sampleRate: expect.any(Number),
					})
				);
				expect(videoMetadata).toMatchSnapshot();
			});

		});

		describe('parseMetadata', () => {

			test('Returns empty audio array when no valid audio stream is given', () => {
				const metadata = parseMetadata({
					...SAMPLE_METADATA,
					streams: SAMPLE_METADATA.streams.map(stream =>
						stream.codec_type === 'audio' ?
							({ ...stream, bit_rate: undefined }) :
							stream
					)
				});
				expect(metadata).toEqual(
					expect.objectContaining({
						audio: [],
					})
				);
			});

			test('Returns empty video array when no valid video stream is given', () => {
				const metadata = parseMetadata({
					...SAMPLE_METADATA,
					streams: SAMPLE_METADATA.streams.map(stream =>
						stream.codec_type === 'video' ?
							({ ...stream, bit_rate: undefined }) :
							stream
					)
				});
				expect(metadata).toEqual(
					expect.objectContaining({
						video: [],
					})
				);
			});

			test('Returns null when no valid audio or video stream is given', () => {
				const metadata = parseMetadata({
					...SAMPLE_METADATA,
					streams: SAMPLE_METADATA.streams.map(stream => ({ ...stream, bit_rate: undefined }))
				});
				expect(metadata).toEqual(null);
			});

			test('Returns null values for invalid bit_rate and duration fields', () => {
				const metadata = parseMetadata({
					...SAMPLE_METADATA,
					format: { ...SAMPLE_METADATA.format, bit_rate: 'test', duration: 'test' }
				});
				expect(metadata).toEqual(
					expect.objectContaining({
						bitRate: null,
						duration: null,
					})
				);
			});

			test('Returns valid values for correct metadata', () => {
				const metadata = parseMetadata(SAMPLE_METADATA);
				expect(metadata).toEqual(
					expect.objectContaining({
						bitRate: expect.any(Number),
						duration: expect.any(Number),
						audio: expect.arrayContaining([expect.any(Object)]),
						video: expect.arrayContaining([expect.any(Object)]),
					})
				);
				expect(metadata).toMatchSnapshot();
			});

		});
	});

	describe('Test resolver responses', () => {

		test('Returns error on invalid url', () => {
			return expect(resolvers.Query.metadata(null, { url: 'http://www.google.com' }))
				.rejects.toThrow('Invalid data found when processing input');
		});

		test('Returns metadata on valid url', async () => {
			const result = await resolvers.Query.metadata(
				null,
				{
					url: 'https://s3-eu-west-1.amazonaws.com/tradecast-development-test/sample-video/tradecast.mp4'
				}
			);

			expect(result).toEqual(
				expect.objectContaining({
					bitRate: expect.any(Number),
					duration: expect.any(Number),
					audio: expect.arrayContaining([expect.any(Object)]),
					video: expect.arrayContaining([expect.any(Object)]),
				})
			);

			expect(result).toMatchSnapshot();
		});

		test('Returns no metadata on valid image url', () => {
			return expect(resolvers.Query.metadata(
				null,
				{
					url: 'http://tradecast.tv/img/tradecast-logo.png'
				}
			)).rejects.toThrow('This file is incompatible with this api.');
		});
	});
});