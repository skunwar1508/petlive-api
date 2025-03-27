const { google } = require('googleapis');
const readline = require('readline');

const generateGoogleMeet = async () => {
    const { OAuth2 } = google.auth;

    const oAuth2Client = new OAuth2(
        'YOUR_CLIENT_ID',
        'YOUR_CLIENT_SECRET',
        'YOUR_REDIRECT_URL'
    );

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const SCOPES = ['https://www.googleapis.com/auth/calendar'];

    const getAccessToken = async(oAuth2Client) => {
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
        });
        console.log('Authorize this app by visiting this url:', authUrl);
        rl.question('Enter the code from that page here: ', (code) => {
            console.log("token", code);
            oAuth2Client.getToken(code, (err, token) => {
                if (err) {
                    console.error('Error retrieving access token', err);
                    return;
                }
                oAuth2Client.setCredentials(
                    {
                      access_token: token.access_token,
                    }
                  );
                console.log('Token stored to oAuth2Client');
                rl.close();
            });
        });
    };

    await getAccessToken(oAuth2Client);

    const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

    const event = {
        summary: 'Google Meet Meeting',
        description: 'A Google Meet meeting',
        start: {
            dateTime: new Date().toISOString(),
            timeZone: 'America/Los_Angeles',
        },
        end: {
            dateTime: new Date(new Date().getTime() + 60 * 60 * 1000).toISOString(),
            timeZone: 'America/Los_Angeles',
        },
        conferenceData: {
            createRequest: {
                requestId: 'sample123',
                conferenceSolutionKey: {
                    type: 'hangoutsMeet',
                },
            },
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        }).catch(error => {
            console.error('Error creating Google Meet link:', error);
            throw new Error('Unable to create Google Meet link');
        });

        const meetLink = response.data.hangoutLink;
        return meetLink;
    } catch (error) {
        console.error('Error creating Google Meet link:', error);
        throw new Error('Unable to create Google Meet link');
    }
}

module.exports = generateGoogleMeet;
