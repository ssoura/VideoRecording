// Get the video elements
const videoElement = document.getElementById("local-video");
const audioElement = document.getElementById("remote-video");

const startRecordingButton = document.getElementById('start-recording');
const stopRecordingButton = document.getElementById('stop-recording');

// import SariskaMediaTransport from "sariska-media-transport";
SariskaMediaTransport.initialize();

const GENERATE_TOKEN_URL = `https://api.sariska.io/api/v1/misc/generate-token`;
const APP_API_KEY = 'your api key';

async function getToken(id, email, name) {
  const body = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      apiKey: APP_API_KEY,
      user: {
        id: id,
        name: name,
        email: email,
        // moderator: name === 'admin' ? true : false
      },
      exp: "48 hours",
    }),
  };

  try {
    const response = await fetch(GENERATE_TOKEN_URL, body);
    if (response.ok) {
      const json = await response.json();
      localStorage.setItem("SARISKA_TOKEN", json.token);
      return json.token;
    } else {
      console.log(response.status);
    }
  } catch (error) {
    console.log("error", error);
  }
}

const createConnection = async(token) => {
  const connection = new SariskaMediaTransport.JitsiConnection(
    token,
    "teststream",
    false
  );
console.log('ot est conn')
  connection.addEventListener(
    SariskaMediaTransport.events.connection.CONNECTION_ESTABLISHED,
    async() => {
      console.log("connection successful!!!");
      await createConference(connection);
    }
  );

  // Handle connection events
  connection.addEventListener(
    SariskaMediaTransport.events.connection.CONNECTION_FAILED,
    (error) => {
      // Token expired, set again
      if (
        error === SariskaMediaTransport.events.connection.PASSWORD_REQUIRED
      ) {
        // Set a new token
        connection.setToken(token);
        console.log("connection disconnect!!!", error);
      }
    }
  );

  connection.addEventListener(
    SariskaMediaTransport.events.connection.CONNECTION_DISCONNECTED,
    (error) => {
      console.log("connection disconnect!!!", error);
    }
  );

  connection.connect();
}

const createLocalTracks = async() => {
  
  const resolution = 240;
    
  let tracks = [];

  try  {
      const [audioTrack] = await SariskaMediaTransport.createLocalTracks({devices: ["audio"], resolution});
      tracks.push(audioTrack);
  } catch(e) {
      console.log("failed to fetch audio device");
  }

  try  {
      const [videoTrack]  = await SariskaMediaTransport.createLocalTracks({devices: ["video"], resolution});
      tracks.push(videoTrack);
  } catch(e) {
      console.log("failed to fetch video device");
  }
  return tracks;
}

const createConference = async(connection) => {

  const conference = connection.initJitsiConference();
  console.log("connection",connection)
  let localTracks = await createLocalTracks();

  localTracks.forEach(async track => await conference.addTrack(track));


  // Access local media tracks
  const audioTrack = localTracks.find((track) => track.getType() === "audio");
  const videoTrack = localTracks.find((track) => track.getType() === "video");
console.log('audioTrack', audioTrack, videoTrack)
  // Play video
  videoTrack.attach(videoElement);

  // Play audio
  audioTrack.attach(audioElement);
  conference.join();
}

async function main() {
  
  const tokenRes = await getToken('ytyVgh', 'sourabh13689@gmail.com', 'sourabh');
  const token = tokenRes;
  console.log("token", token);

  // document.addEventListener("load", () => {
    console.log("working..")
    await createConnection(token);
    

  // });



  


  startRecordingButton.addEventListener('click', async () => {
    console.log('Starting recording...');

    const url = 'https://api.sariska.io/terraform/v1/hooks/srs/startRecording';
    const payload = {
        is_low_latency: true,
        is_vod: true,
        // is_direct_ingestion: true,
        room_name: "teststream",
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
          console.log('first', response)
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('else res', response);
        const result = await response.json();
        console.log('Recording started successfully:', result);
    } catch (error) {
        console.error('Failed to start recording:', error);
    }

 

  });

  stopRecordingButton.addEventListener('click', async  () => {
    console.log('Stopping recording...');

    const url = 'https://api.sariska.io/terraform/v1/hooks/srs/stopRecording';
    const payload = {
        room_name: "teststream",
        is_low_latency: true,
        is_vod: true
    };

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success:', data);
    } catch (error) {
        console.error('Error:', error);
    }

  });
}
main();
