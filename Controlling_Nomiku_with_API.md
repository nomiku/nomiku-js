## Setting the device state

`POST /api/devices/{id}/set` ([Docs](http://www.eattender.com/api/docs#!/devices/POST_api_devices_id_set_post_6))

The body of the request posted to this endpoint should look like:

``` 
{
	"state": {
		"state": 0,
		"setpoint": 55,
		"timer": 3600,
		"recipeID": 0, 
		"recipeTitle": "Really good recipe"
	}
}
```

All the fields are optional and the rules for what values they can take are documented in the API link. The request should include an X-API-TOKEN header that can be obtained by authing a user with the API. The device ID in the URL can be obtained from an authorized user's device list by sending `GET /devices`.

## Getting the device state (Firebase)

The device state isn't directly available on the server because of the streaming nature of the data. Instead, we allow each user read-only access to a [Firebase](https://www.firebase.com/docs/web/quickstart.html) table for their device that is updated in real-time. You can either access Firebase via a one-off [REST API](https://www.firebase.com/docs/rest/guide/retrieving-data.html) method, or subscribe to the event stream.

### Getting the Firebase path

We set up a route on our server that will supply the necessary credentials to access the Firebase table for the device.

`GET /api/devices/{id}/session ` ([Docs](http://www.eattender.com/api/docs#!/devices/GET_api_devices_id_session_get_5))

``` json
{
  "session_token": "somelongtoken",
  "session_base_url": "myURL",
  "session_path": "/state/myUniqueID.json"
}
```

### Accessing Firebase

The simplest way to get the device's state in a one-off request is with the Firebase REST API, which should be really simple to compose given the above:

#### Request

``` http
GET ${session_base_url}${session_path}?auth=${session_token}
```

#### Response

``` json
{
  "recipeID": "0",
  "setpoint": "59",
  "state": "1",
  "temp": "59.05",
  "timer": "1455832375"
}
```

---

You can also use the [Firebase Client Libraries](https://www.firebase.com/docs/web/) to subscribe to streaming updates.