# Nomiku JavaScript SDK

This library provides a simple interface to control your WiFi Nomiku. Currently compatible with node v6.x.x

## Example

The simplest example is:
```JavaScript
var Client=require('../lib/client')
var nomiku=new Client()

nomiku.on('state',function({state}) {
  console.log("State: "+JSON.stringify(state))
})

nomiku.connect({email:process.env.TENDER_EMAIL,
               password:process.env.TENDER_PASSWORD})
```

The client grabs the login token and the list of devices,
and starts listening to the default device indicated in
Tender (the one selected in the app). It will return the
state whenever it changes.

See longer examples in the `examples` directory

## Client API

## Classes

<dl>
<dt><a href="#Events_
 - `connect`, when connected;
 - `close`, when disconnected;
 - `error`, when cannot connect;
 - `state`, when a new state is received;
   the id and state are passed as parameters.">Events:
 - `connect`, when connected;
 - `close`, when disconnected;
 - `error`, when cannot connect;
 - `state`, when a new state is received;
   the id and state are passed as parameters.</a></dt>
<dd></dd>
</dl>

## Functions

<dl>
<dt><a href="#connect">connect(options)</a></dt>
<dd><p>Connects to server for streaming data</p>
</dd>
<dt><a href="#auth">auth(options)</a></dt>
<dd><p>Gets API token from tender</p>
</dd>
<dt><a href="#loadDevices">loadDevices()</a></dt>
<dd><p>Gets device list from Tender</p>
</dd>
<dt><a href="#getDefaultDevice">getDefaultDevice()</a></dt>
<dd><p>Gets default device from Tender</p>
</dd>
<dt><a href="#listen">listen(id)</a></dt>
<dd><p>Listens for state on device</p>
</dd>
<dt><a href="#set">set(id)</a></dt>
<dd><p>Set state on device</p>
</dd>
<dt><a href="#_onConnect">_onConnect()</a></dt>
<dd><p>Called when MQTT is connected</p>
</dd>
<dt><a href="#_onFailure">_onFailure()</a></dt>
<dd><p>Called when MQTT fails to connect</p>
</dd>
<dt><a href="#_onDisconnected">_onDisconnected()</a></dt>
<dd><p>Called when good MQTT connection is closed</p>
</dd>
<dt><a href="#_subscribe">_subscribe()</a></dt>
<dd><p>Subscribe to device</p>
</dd>
<dt><a href="#_onMessage">_onMessage()</a></dt>
<dd><p>Called when MQTT message is received</p>
</dd>
<dt><a href="#_setState">_setState()</a></dt>
<dd><p>Set the state through Tender API</p>
</dd>
</dl>

<a name="Events_
 - `connect`, when connected;
 - `close`, when disconnected;
 - `error`, when cannot connect;
 - `state`, when a new state is received;
   the id and state are passed as parameters."></a>

## Events:
 - `connect`, when connected;
 - `close`, when disconnected;
 - `error`, when cannot connect;
 - `state`, when a new state is received;
   the id and state are passed as parameters.
**Kind**: global class  
<a name="new_Events_
 - `connect`, when connected;
 - `close`, when disconnected;
 - `error`, when cannot connect;
 - `state`, when a new state is received;
   the id and state are passed as parameters._new"></a>

### new Events:
 - `connect`, when connected;
 - `close`, when disconnected;
 - `error`, when cannot connect;
 - `state`, when a new state is received;
   the id and state are passed as parameters.(options)
The Nomiku Client controls the connection to the Nomiku. Descends from
EventEmitter


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | The option object Options:  - `email`, tender account email (for email, password login)  - `password`, tender account password (for email, password login)  - `userID`, ID of the user (for token login)  - `apiToken`, API token (for token login) |

<a name="connect"></a>

## connect(options)
Connects to server for streaming data

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | The option object Options:  - `email`, tender account email (for email, password login)  - `password`, tender account password (for email, password login)  - `userID`, ID of the user (for token login)  - `defaultDevice`, (optional) default device to connect to  - `devices`, (optional) array of devices, {hwid,id,name}  - `verboseState`, (optional) will send state event with every message |

<a name="auth"></a>

## auth(options)
Gets API token from tender

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>object</code> | Info needed to auth with Tender API (email/password) |

<a name="loadDevices"></a>

## loadDevices()
Gets device list from Tender

**Kind**: global function  
<a name="getDefaultDevice"></a>

## getDefaultDevice()
Gets default device from Tender

**Kind**: global function  
<a name="listen"></a>

## listen(id)
Listens for state on device

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> &#124; <code>number</code> | Tender ID of nomiku to listen to |

<a name="set"></a>

## set(id)
Set state on device

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> &#124; <code>number</code> | Tender ID of nomiku to set |

<a name="_onConnect"></a>

## _onConnect()
Called when MQTT is connected

**Kind**: global function  
<a name="_onFailure"></a>

## _onFailure()
Called when MQTT fails to connect

**Kind**: global function  
<a name="_onDisconnected"></a>

## _onDisconnected()
Called when good MQTT connection is closed

**Kind**: global function  
<a name="_subscribe"></a>

## _subscribe()
Subscribe to device

**Kind**: global function  
<a name="_onMessage"></a>

## _onMessage()
Called when MQTT message is received

**Kind**: global function  
<a name="_setState"></a>

## _setState()
Set the state through Tender API

**Kind**: global function  
