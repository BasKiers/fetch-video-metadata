# Fetch Video Metadata for Video URLs
This server hosts a GraphQL endpoint to request video file metadata.
For metadata extraction the ffprobe binary is used.

# Installation
To install, clone this repository, install node modules and run using `npm start`
Note that the server requires the ENGINE_API_KEY environment variable to be set. 
You can create a Apollo Engine API key by creating an account at https://engine.apollographql.com

```
git clone https://github.com/BasKiers/fetch-video-metadata.git
cd fetch-video-metadata
npm run build
ENGINE_API_KEY="<APOLLO_ENGINE_API_KEY>" npm run serve
```

# Example usage
Using the graphql endpoint you can request the metadata of a provided video url.

Example:
```
# Query:
{
  metadata(url: "https://s3-eu-west-1.amazonaws.com/tradecast-development-test/sample-video/tradecast.mp4") {
    bitRate
    duration
    video {
      bitRate
      frameRate
      resolution {
        height
        width
      }
    }
    audio {
      bitRate
      channelLayout
      channels
      sampleRate
    }
  }
}

# Response: 
{
  "data": {
    "metadata": {
      "bitRate": 1334445,
      "duration": 90001,
      "video": [
        {
          "bitRate": 1167864,
          "frameRate": 25,
          "resolution": {
            "height": 720,
            "width": 1280
          }
        }
      ],
      "audio": [
        {
          "bitRate": 160000,
          "channelLayout": "stereo",
          "channels": 2,
          "sampleRate": 44100
        }
      ]
    }
  }
}
```

This query can be executed by GraphiQL hosted on localhost:3000/graphiql or via curl by executing
```
curl \
  -X POST \
  -H "Content-Type: application/json" \
  --data '{ "query": "{ metadata(url: \"https://s3-eu-west-1.amazonaws.com/tradecast-development-test/sample-video/tradecast.mp4\") { bitRate duration video { bitRate frameRate resolution { height width } } audio { bitRate channelLayout channels sampleRate } } }" }'\
  http://localhost:3000/graphql
```