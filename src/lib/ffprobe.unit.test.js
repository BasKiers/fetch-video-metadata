import ffprobe from './ffprobe';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

describe('Test ffprobe usage', () => {

	test('ffprobe binary should be present and executable', () => {
		return promisify(fs.access)(path.join(__dirname, '../../bin/ffprobe'), fs.constants.X_OK)
	});

	test('returns an error on an invalid file path', () => {
		return expect(ffprobe('invalid')).rejects.toThrow('No such file or directory');
	});

	test('returns an error on an invalid url', () => {
		return expect(ffprobe('http://www.invalidurl123456789.co.uk')).rejects.toThrow('Input/output error');
	});

	test('should return an error on a valid url with an invalid media file', () => {
		return expect(ffprobe('http://www.google.com')).rejects.toThrow('Invalid data found when processing input');
	});

	test('returns a valid response on a valid mp4 media file url', async () => {
		const metadata = await ffprobe('https://s3-eu-west-1.amazonaws.com/tradecast-development-test/sample-video/tradecast.mp4');

		expect(metadata).toEqual(
			expect.objectContaining({
				format: expect.objectContaining({
					duration: expect.any(String),
					bit_rate: expect.any(String),
				}),
				streams: expect.arrayContaining([
					expect.objectContaining({
						codec_type: 'video',
						bit_rate: expect.any(String),
						r_frame_rate: expect.any(String),
						coded_width: expect.any(Number),
						coded_height: expect.any(Number),
					}),
					expect.objectContaining({
						codec_type: 'audio',
						bit_rate: expect.any(String),
						channel_layout: expect.any(String),
						channels: expect.any(Number),
						sample_rate: expect.any(String),
					}),
				]),
			})
		);

		expect(metadata).toMatchSnapshot();
	});

	test('returns a valid response on a valid png media file url', async () => {
		const metadata = await ffprobe('http://tradecast.tv/img/tradecast-logo.png');

		expect(metadata).toEqual(
			expect.objectContaining({
				format: expect.objectContaining({
					// duration: expect.any(String),
					// bit_rate: expect.any(String),
				}),
				streams: expect.arrayContaining([
					expect.objectContaining({
						codec_type: 'video',
						// bit_rate: expect.any(String),
						r_frame_rate: expect.any(String),
						coded_width: expect.any(Number),
						coded_height: expect.any(Number),
					}),
				]),
			})
		);

		return expect(metadata).toMatchSnapshot();
	});

});