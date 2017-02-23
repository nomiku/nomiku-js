# Nomiku JavaScript SDK

This library provides a simple interface to control your WiFi Nomiku. Currently compatible with node v6.x.x

## Installing

Installing is as easy as:

```bash
npm install --save nomiku
```

## Example

The simplest example is:
```JavaScript
var NomikuClient=require('nomiku')

var nomiku=new NomikuClient()

nomiku.on('state',function({state}) {
  console.log("State: "+JSON.stringify(state))
})

nomiku.connect({email:process.env.TENDER_EMAIL,
               password:process.env.TENDER_PASSWORD})

nomiku.on('connect', function() {
  nomiku.set().on();
  nomiku.set().setpoint(55.0);
})

```

The client grabs the login token and the list of devices,
and starts listening to the default device indicated in
Tender (the one selected in the app). It will return the
state whenever it changes.

See longer examples in the `examples` directory

## Getting the state

The state event is documented in the API, but the
further details of the state object are:

| Name | Type | Description |
| --- | --- | --- |
| recipeID | <code>number</code> | Recipe ID currently cooking |
| recipeTitle | <code>string</code> | Indicates whether the state has been emitted before |
| setpoint | <code>number</code> | Set temperature in °C |
| showF | <code>boolean</code> | True if temp should be displayed in °F |
| state | <code>number</code> | -1: offline, 0: online but not heating/circulating, 1: online and running |
| temp | <code>number</code> | Current temperature in °C |
| timerEnd | <code>number</code> | Timer end time in UTC seconds (if timer is running) |
| timerRunning | <code>boolean</code> | Whether timer is running |
| timerSecs | <code>number</code> | Time remaining in seconds (if timer is not running) |

## Setting the state

The most straightforward way to update the state is to pass a new `state` object (only changed keys need to be included) to the set function of device `id` (omit `id` to use default device):

```JavaScript
nomiku.set(id).state(state)
```

A number of other convenience functions were created on top of `nomiku.set(id)`:
* `.off()` turns off the device
* `.on()` turns on the device
* `.setpoint(setpoint)` changes setpoint to `setpoint` in °C
* `.timer.start()` starts the timer
* `.timer.stop()` stops the timer
* `.timer.set(secs)` stops the timer and sets it to `secs` seconds
* `.units(unit)` changes displayed units, `unit` is either the char 'C' or 'F'
* `.recipe(recipe)` starts cooking a new recipe, where `recipe` has properties:

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | (optional) Recipe ID |
| title | <code>string</code> | (optional) Recipe title |
| temp | <code>number</code> | Set temperature in °C |
| time | <code>number</code> | Number of seconds for the timer |


## Client API

<dl>
<dt><a href="#Client">Client class</a></dt>
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
</dl>

<a name="Client"></a>

## Client
**Kind**: global class  

* [Client](#Client)
    * [new Client(options)](#new_Client_new)
    * ["event:connect"](#Client+event_connect)
    * ["event:close"](#Client+event_close)
    * ["event:state"](#Client+event_state)

<a name="new_Client_new"></a>

### new Client(options)
The Nomiku Client controls the connection to the Nomiku. Descends from
EventEmitter


| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | The option object. Can also be passed to connect. |
| options.email | <code>string</code> | tender account email (for email, password login) |
| options.password | <code>string</code> | tender account password (for email, password login) |
| options.userID | <code>string</code> | ID of the user (for token login) |
| options.apiToken | <code>string</code> | API token (for token login) |

<a name="Client+event_connect"></a>

### "event:connect"
Successfully connected

**Kind**: event emitted by <code>[Client](#Client)</code>  
<a name="Client+event_close"></a>

### "event:close"
Connection is closed

**Kind**: event emitted by <code>[Client](#Client)</code>  
<a name="Client+event_state"></a>

### "event:state"
New state

**Kind**: event emitted by <code>[Client](#Client)</code>  
**Properties**

| Name | Type | Description |
| --- | --- | --- |
| id | <code>number</code> | Tender ID of device |
| new | <code>boolean</code> | Indicates whether the state has been emitted before |
| state | <code>object</code> | Latest state |
| provisional | <code>object</code> | Dict with same keys as state, key is true if it is unconfirmed |
| valid | <code>boolean</code> | Indicates whether the state is valid |

<a name="connect"></a>

## connect(options)
Connects to server for streaming data

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | The option object Options: |
| options.email | <code>string</code> | tender account email (for email, password login) |
| options.password | <code>string</code> | tender account password (for email, password login) |
| options.userID | <code>string</code> | ID of the user (for token login) |
| options.apiToken | <code>string</code> | API token (for token login) |
| options.defaultDevice | <code>string</code> &#124; <code>number</code> | (optional) default device to connect to |
| options.devices | <code>array</code> | (optional) array of devices, {hwid,id,name} |
| options.verboseState | <code>boolean</code> | (optional) will send state event with every message |

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
