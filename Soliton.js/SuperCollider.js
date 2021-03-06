/* 
    Lich.js - JavaScript audio framework
    Copyright (C) 2012 Chad McKinney

	http://chadmckinneyaudio.com/
	seppukuzombie@gmail.com

	LICENSE
	=======

	Licensed under the Simplified BSD License:

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met: 

	1. Redistributions of source code must retain the above copyright notice, this
	   list of conditions and the following disclaimer. 
	2. Redistributions in binary form must reproduce the above copyright notice,
	   this list of conditions and the following disclaimer in the documentation
	   and/or other materials provided with the distribution. 

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
	ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

	The views and conclusions contained in the software and documentation are those
	of the authors and should not be interpreted as representing official policies, 
	either expressed or implied, of the FreeBSD Project.
*/



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Server setup
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var osc = require("osc");
var _fxGroup = null;
var _limitGroup = null;
var _masterLimiterSynthDef = null;
var _masterLimiterSynth = null;

function _Server(options) {
	this.options = options;
}

_Server.prototype.connect = function() {
	var self = this;

	this.allocatedBuffers = {};
	
	this.udp = new osc.UDPPort({
		localAddress: "0.0.0.0",
		localPort: 57121
	});
	
	/*
	this.udp.on("bundle", function (oscBundle) {
		console.log(oscBundle);
	});

	this.udp.on("message", function (oscMessage) {
		console.log(oscMessage);
	});*/

	this.udp.open();
}

_Server.prototype.disconnect = function() {
	if(typeof this.udp !== "undefined")
	{
		this.udp.close();
		delete this.udp;
	}
}

_Server.prototype.sendMsg = function(address, args) {
	this.udp.send({
		address: address,
		args: args
	}, this.options.sHost, this.options.sPortNum);
}

// Useful for scheduling events in the future, makes for better timing!
_Server.prototype.scheduleMsg = function(secondsFromNow, address, args) {

	this.udp.send({
		timeTag: osc.timeTag(secondsFromNow),
		packets: [{
			address: address,
			args: args
		}]
	}, this.options.sHost, this.options.sPortNum);
}

_Server.prototype.allocateBuffer = function()
{

}

_Server.prototype.deallocateBuffer = function()
{

}

function getSCPath()
{
	switch(process.platform)
	{
	case "win32":
	case "win64":
		return "C:/Program Files (x86)/SuperCollider-3.6.6/scsynth";
		break;
		
	case "darwin":
		return "/Applications/SuperCollider/SuperCollider.app/Contents/Resources/scsynth";
		break;

	case "linux":
		process.env["SC_JACK_DEFAULT_INPUTS"] = "system";
		process.env["SC_JACK_DEFAULT_OUTPUTS"] = "system";
		process.env["JACK_START_SERVER"] = "true";
		return "/usr/local/bin/scsynth";
		break;
	}
}

var _options = { 
	sNumAudioBusChannels: 128,
	sNumControlBusChannels: 4096 * 0.25,
	sMaxLogins: 64,
	sMaxNodes: 1024,
    sNumInputBusChannels: 2,
	sNumOutputBusChannels: 2,
	sNumBuffers: 1024,
	sMaxSynthDefs: 8192,
    sProtocol: "Udp",
	sBufLength: 64,
	sNumRGens: 64,
	sMaxWireBufs: 64,
	sPreferredSampleRate: 44100,
	sLoadGraphDefs: 0,
	sVerbosity: 0,
	sRendezvous: 0,
	sRemoteControlVolume: 0,
	sMemoryLocking: 0,
	sPreferredHardwareBufferFrameSize: 512,
	sRealTimeMemorySize: 81920, // Increased
    // sBlockSize: 512,
    // sBlockSize: 1024,
    sPortNum: 57110,
	sHost: "127.0.0.1",
	sNumPrivateAudioBusChannels: 112
}

var _optionsArray = [
	"-u", _options.sPortNum,
	"-a", _options.sNumAudioBusChannels,
	"-c", _options.sNumControlBusChannels,
	"-i", _options.sNumInputBusChannels,
	"-o", _options.sNumOutputBusChannels,
	"-z", _options.sBlockSize,
	"-Z", _options.sPreferredHardwareBufferFrameSize,
	"-S", _options.sPreferredSampleRate,
	"-b", _options.sNumBuffers,
	"-n", _options.sMaxNodes,
	"-d", _options.sMaxSynthDefs,
	"-m", _options.sRealTimeMemorySize,
	"-w", _options.sMaxWireBufs,
	"-l", _options.sMaxLogins
];

var fs = require('fs');

function _startJack()
{
	return spawn("/usr/bin/jackd", ["-d", "alsa", "-P", "hw:0,0", "-r", 44100], { env: process.env, stdio: ['pipe', process.stdout, process.stderr] });
}

// var _jack = process.platform == "linux" ? _startJack() : null;
var _scsynthpid = spawn(getSCPath(), _optionsArray, { env: process.env, stdio: ['pipe', process.stdout, process.stderr] });
var _currentNodeID = 1000;

var server = new _Server(_options);
var s = server;
var sampleRate = _options.sPreferredSampleRate

server.quit = function()
{
	s.sendMsg('/quit', []);
}

process.on('exit', function(code){
	console.log("quitting scsynth... ");
	_scsynthpid.kill('SIGTERM');

	/*
	if(_jack != null)
	{
		_jack.kill('SIGTERM');
		var child = exec("killall jackd", function (error, stdout, stderr) {
			console.log(stdout);
			console.log(stderr);
			console.log(error);
		});

		var child2 = exec("killall jackdbus", function (error, stdout, stderr) {
			console.log(stdout);
			console.log(stderr);
			console.log(error);
		});
	}*/
});


function _setupSC()
{
	s.sendMsg('/clearSched', []);
    s.sendMsg('/g_freeAll', [0]);
	Lich.scheduler.freeScheduledEvents();
	s.sendMsg("/g_new", [1, 0, 0]); // default group
	_fxGroup = Group.after(s);
	_limitGroup = Group.after(_fxGroup);
	_masterLimiterSynthDef = _synthDef("_MasterLimiterSynth", replaceOut(0, limiter(1.0, 0.001, auxIn(0, 2))));
	setTimeout(function() {
		_masterLimiterSynth = Synth.head("_MasterLimiterSynth", [], _limitGroup);
	}, 1000);
	//var _masterLimiterSynth = null;
}

// Wait for server to boot ... perhaps there's a better way here.
setTimeout( // Initial messages
	function()
	{
		s.connect();
		s.sendMsg('/notify', [1]);
		s.sendMsg('/status', []);
		_setupSC();
	},
	2000
);


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Nodes
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

Function.prototype.inheritsFrom = function(parentClassOrObject) { 
	if(parentClassOrObject.constructor == Function) 
	{ 
		//Normal Inheritance 
		this.prototype = new parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject.prototype;
	}
	
	else 
	{ 
		//Pure Virtual Inheritance 
		this.prototype = parentClassOrObject;
		this.prototype.constructor = this;
		this.prototype.parent = parentClassOrObject;
	}
	
	return this;
}

// Enum for AddAction
var AddToHead  = 0;
var AddToTail  = 1;
var AddBefore  = 2;
var AddAfter   = 3;
var AddReplace = 4;

// Node IDs for various kinds of nodes
var rootNodeID = 0;
var defaultGroupID = 1;
var grainNodeID = -1;
s.nodeID = 1; // default group

function Node()
{	
	this.freeNode = function()
	{
		s.sendMsg('/n_free', [this.nodeID]);
	}

	this.run = function(bool)
	{
		s.sendMsg('/n_run', [this.nodeID, bool]);
	}

	this.set = function(arg, val)
	{
		s.sendMsg('/n_set', [this.nodeID, arg, val]);
	}

	this.setList = function(argValuePairs)
	{
		s.sendMsg('/n_set', [this.nodeID].concat(argValuePairs));
	}

	this.release = function(releaseTime)
	{
		this.set("gate", (-1 - releaseTime));
	}

	this.trace = function()
	{
		s.sendMsg("/n_trace", [this.nodeID]);
	}

	this.moveBefore = function(node)
	{
		s.sendMsg("/n_before", [this.nodeID, node.nodeID]);
	}

	this.moveAfter = function(node)
	{
		s.sendMsg("/n_after", [this.nodeID, node.nodeID]);
	}

	this.moveToHead = function(group)
	{
		s.sendMsg("/g_head", [group.nodeID, this.nodeID]);
	}

	this.moveToTail = function(group)
	{
		s.sendMsg("/g_tail", [group.nodeID, this.nodeID]);
	}
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Group
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function Group(target, action)
{
	target = typeof target === "undefined" ? s : target;
	action = typeof action === "undefined" ? AddToHead : action;
	
	this.moveNodeTohead = function(node)
	{
		s.sendMsg("/g_head", [this.nodeID, node.nodeID]);
	}

	this.moveNodeToTail = function(node)
	{
		s.sendMsg("/g_tail", [this.nodeID, node.nodeID]);
	}

	this.freeAll = function()
	{
		s.sendMsg("/g_freeAll", [this.nodeID]);
	}

	this.deepFree = function()
	{
		s.sendMsg("/g_deepFree", [this.nodeID]);
	}

	this.dumpTree = function()
	{
		s.sendMsg("/g_dumpTree", [this.nodeID]);
	}

	this.nodeID = _currentNodeID++;
	s.sendMsg("/g_new", [this.nodeID, action, target.nodeID]);
}

Group.inheritsFrom(Node);

Group.after = function(target)
{
	return new Group(target, AddAfter);
}

Group.before = function(target)
{
	return new Group(target, AddBefore);
}

Group.head = function(target)
{
	return new Group(target, AddToHead);
}

Group.tail = function(target)
{
	return new Group(target, AddToTail);
}

Group.replace = function(target)
{
	return new Group(target, AddReplace);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Synth
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Synth(name, args, target, action)
{
	args = typeof args === "undefined" ? [] : args;
	target = typeof target === "undefined" ? s : target;
	action = typeof action === "undefined" ? AddToHead : action;

	this.name = name;
	this.nodeID = _currentNodeID++;
	s.sendMsg("/s_new", [name, this.nodeID, action, target.nodeID].concat(args));
}

Synth.inheritsFrom(Node);

Synth.after = function(name, args, target)
{
	return new Synth(name, args, target, AddAfter);
}

Synth.before = function(name, args, target)
{
	return new Synth(name, args, target, AddBefore);
}

Synth.head = function(name, args, target)
{
	return new Synth(name, args, target, AddToHead);
}

Synth.tail = function(name, args, target)
{
	return new Synth(name, args, target, AddToTail);
}

Synth.replace = function(name, args, target)
{
	return new Synth(name, args, target, AddReplace);
}

// Doesn't return a synth, just creates an instance on the server
Synth.grain = function(name, args, target, action)
{
	target = typeof target === "undefined" ? s : target;
	action = typeof action === "undefined" ? AddToHead : action;
	s.sendMsg("/s_new", [name, -1, action, target.nodeID].concat(args)); 
}


function fxSynth(name)
{
	return Synth.head(name, [], _fxGroup);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Buffer
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
function ScBuffer(numFrames, numChannels, bufnum)
{
	this.numFrames = numFrames;
	this.numChannels = numChannels;
	this.bufnum = bufnum;

	s.sendMsg("/s_new", [name, this.nodeID, action, target.nodeID].concat(args));
}*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UGen
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Rate constants
var ScalarRate = 0;
var ControlRate = 1;
var AudioRate = 2;
var DemandRate = 3;

function UGen(name, rate, inputs, numOutputs, specialIndex)
{
	var self = this;
	this.name = name;
	this.rate = rate;
	this.inputs = inputs;
	this.numInputs = inputs.length;
	this.numOutputs = numOutputs;
	this.specialIndex = typeof specialIndex === "undefined" ? 0 : specialIndex;
	this.synthIndex = null;
	this.setSynthIndex = function(index) { self.synthIndex = index; }; 
	this.outputIndex = 0;
	this._lichType = AUDIO;
	this._collected = false; // used internally to cull duplicates in the synth graph
	this.addToSynth = true;
	this.isLocalBuf = false;
}

// Don't indicate outputs explicity, instead we indicate this with an array of rates.
function MultiOutUGen(name, rates, inputs, specialIndex)
{
	var self = this;
	this.name = name;
	this.rate = rates[0];
	this.inputs = inputs;
	this.numOutputs = rates.length;
	this.numInputs = inputs.length;
	this.specialIndex = typeof specialIndex === "undefined" ? 0 : specialIndex;
	this.channels = [];

	for(var i = 0; i < this.numOutputs; ++i)
	{
		self.channels.push(outputProxy(rates[i], self, i));
	}

	this.synthIndex = null;
	this.setSynthIndex = function(index) {
		self.synthIndex = index;
		for(var i = 0; i < self.numOutputs; ++i)
		{
			self.channels[i].setSynthIndex(index);
		}
	};
	
	this.outputIndex = 0;
	this._lichType = AUDIO;
	this._collected = false; // used internally to cull duplicates in the synth graph
	this.addToSynth = true;
	this.isLocalBuf = false;
}

Number.prototype.setSynthIndex = function(){};

// supports multi-channel expansion
function multiNewUGen(name, rate, inputs, numOutputs, specialIndex)
{
	var size = 0;

	// Find the largest array length
	for(var i = 0; i < inputs.length; ++i)
	{
		var input = inputs[i];
		
		if(input instanceof Array)
		{
			size = size > input.length ? size : input.length;
		}
	}

	if(size == 0)
	{
		return new UGen(name, rate, inputs, numOutputs, specialIndex);
	}

	else
	{
		var res = [];

		for(var i = 0; i < size; ++i)
		{
			var newInputs = inputs.map(function(e) {
				if(e instanceof Array)
					return e[i % e.length];
				else
					return e;
			});

			res.push(new UGen(name, rate, newInputs, numOutputs, specialIndex));
		}

		return res;
	}
}

function outputProxy(rate, sourceUGen, channel)
{
	// var u = new UGen("OutputProxy", rate, [rate, sourceUGen, input], 1, 0);
	var u = new UGen("OutputProxy", rate, [sourceUGen], 1, 0);
	u.addToSynth = false;
	u.outputIndex = channel;
	return u;
}

// !!! We indicate number of outputs using an array of rates.  !!!
function newMultiOutUGen(name, rates, inputs, specialIndex)
{
	var expandError = false;

	for(var i = 0; i < inputs.length; ++i)
	{
		if(inputs[i] instanceof Array)
			throw new Error("You can't use multi-channel expansion with: " + name);
	}
	
	var mUgen = new MultiOutUGen(name, rates, inputs, specialIndex);

	return mUgen.channels; 
}
							   
////////////////////
// UGen Bindings
////////////////////

/**
 * Lich.sc UGen bindings.
 * @module Lich.sc UGens
 */

var _BIN_PLUS = 0;
var _BIN_MINUS = 1;
var _BIN_MUL = 2;
var _BIN_DIV = 4;
var _BIN_MOD = 5;
var _BIN_EQ = 6;
var _BIN_NE = 7;
var _BIN_LT = 8;
var _BIN_GT = 9;
var _BIN_LE = 10;
var _BIN_GE = 11;
var _BIN_MIN = 12;
var _BIN_MAX = 13;
var _BIN_BITAND = 14;
var _BIN_BITOR = 15;
var _BIN_BITXOR = 16;
var _BIN_LCM = 17;
var _BIN_GCD = 18;
var _BIN_ROUND = 19;
var _BIN_ROUNDUP = 20;
var _BIN_TRUNC = 21;
var _BIN_ATAN2 = 22;
var _BIN_HYPOT = 23;
var _BIN_HYPOTX = 24;
var _BIN_POW = 25;
var _BIN_SHIFTLEFT = 26;
var _BIN_SHIFTRIGHT = 27;
var _BIN_UNSIGNEDSHIFT = 28;
var _BIN_FILL = 29;
var _BIN_RING1 = 30;
var _BIN_RING2 = 31;
var _BIN_RING3 = 32;
var _BIN_RING4 = 33;
var _BIN_DIFSQR = 34;
var _BIN_SUMSQR = 35;
var _BIN_SQRSUM = 36;
var _BIN_SQRDIF = 37;
var _BIN_ABSDIF = 38;

function _binaryOpUGen(selector, a, b)
{
	var rate = ControlRate;
	
	if(a.rate == AudioRate || b.rate == AudioRate)
		rate = AudioRate;
	
	return multiNewUGen("BinaryOpUGen", rate, [a, b], 1, selector);
}

function mix2(a, b)
{
	return _binaryOpUGen(_BIN_PLUS, a, b);
}

function _subtractMix(a, b)
{
	return _binaryOpUGen(_BIN_MINUS, a, b);
}

function gain(a, b)
{
	return _binaryOpUGen(_BIN_MUL, a, b);
}

function _audioDivision(a, b)
{
	return _binaryOpUGen(_BIN_DIV, a, b);
}

var _UN_NEG = 0;
var _UN_NOT = 1;
var _UN_ISNIL = 2;
var _UN_NOTNIL = 3;
var _UN_BITNOT = 4;
var _UN_ABS = 5;
var _UN_ASFLOAT = 6;
var _UN_ASINT = 7;
var _UN_CEIL = 8;
var _UN_FLOOR = 9;
var _UN_FRAC = 10;
var _UN_SIGN = 11;
var _UN_SQUARED = 12;
var _UN_CUBED = 13;
var _UN_SQRT = 14;
var _UN_EXP = 15;
var _UN_RECIP = 16;
var _UN_MIDICPS = 17;
var _UN_CPSMIDI = 18;
var _UN_MIDIRATIO = 19;
var _UN_RATIOMIDI = 20;
var _UN_DBAMP = 21;
var _UN_AMPDB = 22;
var _UN_OCTCPS = 23;
var _UN_CPSOCT = 24;
var _UN_LOG = 25;
var _UN_LOG2 = 26;
var _UN_LOG10 = 27;
var _UN_SIN = 28;
var _UN_COS = 29;
var _UN_TAN = 30;
var _UN_ARCSIN = 31;
var _UN_ARCCOS = 32;
var _UN_ARCTAN = 33;
var _UN_SINH = 34;
var _UN_COSH = 35;
var _UN_TANH = 36;
var _UN_RAND = 37;
var _UN_RAND2 = 38;
var _UN_LINRAND = 39;
var _UN_BILINRAND = 40;
var _UN_SUM3RAND = 41;
var _UN_DISTORT = 42;
var _UN_SOFTCLIP = 43;
var _UN_COIN = 44;

function _unaryOpUGen(selector, a)
{
	var rate = ControlRate;
	
	if(a.rate == AudioRate || b.rate == AudioRate)
		rate = AudioRate;
	
	return multiNewUGen("UnaryOpUGen", rate, [a], 1, selector);
}

/**
 * Distort a signal. This is the same as using .distort in SuperCollider.
 *
 * @class scDistort
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> distort >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scDistort(a)
{
	return _unaryOpUGen(_UN_DISTORT, a);
}

/**
 * Distortions.
 * @submodule Distortions
 */

/**
 * Distortion with a perfectly linear region from -0.5 to +0.5. This is the same as using .softclip in SuperCollider.
 *
 * @class scSoftClip
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scSoftClip >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scSoftClip(a)
{
	return _unaryOpUGen(_UN_SOFTCLIP, a);
}

/**
 * Foldback distortion.
 * 
 * @class scFold
 * @constructor
 * @param lo Low boundry to fold at
 * @param hi High boundry to fold at
 * @example
 * let test l h => white 1 >> scFold l h >> out 0<br>
 * let t = test -0.5 0.5<br>
 * stop t
 */
function scFold(lo, hi, input)
{
	return multiNewUGen("Fold", AudioRate, [input,lo,hi], 1, 0);
}

/**
 * Foldback distortion.
 * 
 * @class fold
 * @constructor
 * @param level Boundry to fold at
 * @example
 * let test l => white 1 >> fold l >> out 0<br>
 * let t = test 0.5<br>
 * stop t
 */
function fold(level, input)
{
	return multiNewUGen("Fold", AudioRate, [input,-1*level,level], 1, 0);
}

/**
 * Wrap distortion.
 * 
 * @class scWrap
 * @constructor
 * @param lo Low boundry to wrap at
 * @param hi High boundry to wrap at
 * @example
 * let test l h => white 1 >> scWrap l h >> out 0<br>
 * let t = test -0.5 0.5<br>
 * stop t
 */
function scWrap(lo, hi, input)
{
	return multiNewUGen("Wrap", AudioRate, [input,lo,hi], 1, 0);
}

/**
 * Wrap distortion.
 * 
 * @class wrap
 * @constructor
 * @param level Boundry to wrap at
 * @example
 * let test l => white 1 >> wrap l >> out 0<br>
 * let t = test 0.5<br>
 * stop t
 */
function wrap(level, input)
{
	return multiNewUGen("Wrap", AudioRate, [input,-1*level,level], 1, 0);
}

/**
 * Clip distortion.
 * 
 * @class scClip
 * @constructor
 * @param lo Low boundry to clip at
 * @param hi High boundry to clip at
 * @example
 * let test l h => white 1 >> scClip l h >> out 0<br>
 * let t = test -0.5 0.5<br>
 * stop t
 */
function scClip(lo, hi, input)
{
	return multiNewUGen("Clip", AudioRate, [input,lo,hi], 1, 0);
}

/**
 * Clip distortion.
 * 
 * @class clip
 * @constructor
 * @param level Boundry to clip at
 * @example
 * let test l => white 1 >> clip l >> out 0<br>
 * let t = test 0.5<br>
 * stop t
 */
function clip(level, input)
{
	return multiNewUGen("Clip", AudioRate, [input,-1*level,level], 1, 0);
}

function shaper(shapeBuffer, input)
{
	return multiNewUGen("Shaper", AudioRate, [shapeBuffer, input], 1, 0);
}

function distortion2(amt, input)
{
	// Math.sin(inputArray[i] * (1 + amtArray[i] * 100))
	return scSin(mul(input, add(1, mul(amt, 100))));
}

/*
function distortion(amt, input)
{
	var sample = inputArray[i] * (1 + amtArray[i] * 300);
    output[i] = sample / (1 + Math.abs(sample));
}*/

/**
 * Return the inverse of a signal.
 *
 * @class scNeg
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scNeg >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scNeg(a)
{
	return _unaryOpUGen(_UN_NEG, a);
}

/**
 * Signal Math. TODO: fix all the examples
 * @submodule Signal Math
 */

/**
 * Return the absolute value of a signal.
 *
 * @class scAbs
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scAbs >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scAbs(a)
{
	return _unaryOpUGen(_UN_ABS, a);
}

/**
 * Return the ceil of a signal.
 *
 * @class scCeil
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scCeil >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scCeil(a)
{
	return _unaryOpUGen(_UN_CEIL, a);
}

/**
 * Return the floor of a signal.
 *
 * @class scFloor
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scFloor >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scFloor(a)
{
	return _unaryOpUGen(_UN_FLOOR, a);
}

/**
 * Return the square of a signal.
 *
 * @class scSquared
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scSquared >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scSquared(a)
{
	return _unaryOpUGen(_UN_SQUARED, a);
}

/**
 * Return the cube of a signal.
 *
 * @class scCubed
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scCubed >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scCubed(a)
{
	return _unaryOpUGen(_UN_CUBED, a);
}

/**
 * Return the square root of a signal.
 *
 * @class scSqrt
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scSqrt >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scSqrt(a)
{
	return _unaryOpUGen(_UN_SQRT, a);
}

/**
 * Return the reciprocal of a signal.
 *
 * @class scReciprocal
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scReciprocal >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scReciprocal(a)
{
	return _unaryOpUGen(_UN_RECIP, a);
}

/**
 * Convert a value from cycles per second to MIDI.
 *
 * @class scCpsMidi
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scCpsMidi >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scCpsMidi(a)
{
	return _unaryOpUGen(_UN_CPSMIDI, a);
}

/**
 * Convert a value from MIDI to cycles per second.
 *
 * @class scMidiCps
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scMidiCps >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scMidiCps(a)
{
	return _unaryOpUGen(_UN_MIDICPS, a);
}

/**
 * Convert a value dB to RMS amplitude.
 *
 * @class scDbAmp
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scDbAmp >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scDbAmp(a)
{
	return _unaryOpUGen(_UN_DBAMP, a);
}

/**
 * Convert a value RMS amplitude to dB.
 *
 * @class scAmpDb
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scAmpDb >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scAmpDb(a)
{
	return _unaryOpUGen(_UN_DBAMP, a);
}

/**
 * Return the log of a signal.
 *
 * @class scLog
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scLog >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scLog(a)
{
	return _unaryOpUGen(_UN_LOG, a);
}

/**
 * Return the log2 of a signal.
 *
 * @class scLog2
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scLog2 >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scLog2(a)
{
	return _unaryOpUGen(_UN_LOG2, a);
}

/**
 * Return the log10 of a signal.
 *
 * @class scLog10
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scLog10 >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scLog10(a)
{
	return _unaryOpUGen(_UN_LOG10, a);
}

/**
 * Return the sin of a signal.
 *
 * @class scSin
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scSin >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scSin(a)
{
	return _unaryOpUGen(_UN_SIN, a);
}

/**
 * Return the cos of a signal.
 *
 * @class scCos
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scCos >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scCos(a)
{
	return _unaryOpUGen(_UN_COS, a);
}

/**
 * Return the tan of a signal.
 *
 * @class scTan
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scTan >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scTan(a)
{
	return _unaryOpUGen(_UN_TAN, a);
}

/**
 * Return the arc sin of a signal.
 *
 * @class scASin
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scASin >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scASin(a)
{
	return _unaryOpUGen(_UN_ARCSIN, a);
}

/**
 * Return the arc cos of a signal.
 *
 * @class scACos
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scACos >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scACos(a)
{
	return _unaryOpUGen(_UN_ARCCOS, a);
}

/**
 * Return the arc tan of a signal.
 *
 * @class scATan
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scATan >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scATan(a)
{
	return _unaryOpUGen(_UN_ARCTAN, a);
}

/**
 * Return the sinh of a signal.
 *
 * @class scSinh
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scSinh >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scSinh(a)
{
	return _unaryOpUGen(_UN_SINH, a);
}

/**
 * Return the cosh of a signal.
 *
 * @class scCosh
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scCosh >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scCosh(a)
{
	return _unaryOpUGen(_UN_COSH, a);
}

/**
 * Return the tanh of a signal.
 *
 * @class scTanh
 * @constructor
 * @example
 * let test amp => sin 440 >> gain amp >> scTanh >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scTanh(a)
{
	return _unaryOpUGen(_UN_TANH, a);
}

/**
 * Return the modulo of two signals. a % b
 *
 * @class scMod
 * @constructor
 * @param a Signal a
 * @param b Signal b
 * @example
 * TODO
 */
function scMod(a, b)
{
	return _binaryOpUGen(_BIN_MOD, a, b);
}

/**
 * Return the signal rounded to the nearest value of b.
 *
 * @class scRound
 * @constructor
 * @param a Signal a
 * @param b Value to round to
 * @example
 * TODO
 */
function scRound(a, b)
{
	return _binaryOpUGen(_BIN_ROUND, a, b);
}

/**
 * Return the signal to the power of b.
 *
 * @class scPow
 * @constructor
 * @param a Signal a
 * @param b Value to round to
 * @example
 * TODO
 */
function scPow(a, b)
{
	return _binaryOpUGen(_BIN_POW, a, b);
}

/**
 * Map a UGen's output to between lo and hi
 *
 * @class range
 * @constructor
 * @param lo Lowest mapped value
 * @param hi Highest mapped value
 * @param input UGen to be mapped
 * @example
 * let test l h => sin (sin 1 >> range l h) >> out 0<br> 
 * let t = test 440 880<br>
 * stop t
 */
function range(lo,hi,input)
{
    var mul = _binaryOpUGen( _BIN_MUL, _binaryOpUGen( _BIN_MINUS, hi, lo ), 0.5 );

	return _binaryOpUGen( _BIN_PLUS, _binaryOpUGen( _BIN_MUL, input, mul ) ,lo );
}

function exprange(low, high, input)
{
	var mulVal = mul(minus(high, low), 0.5);
	var addVal = add(mulVal, low);

	return add(addVal, mul(mulVal, input));
}

/**
 * Map a linear range to an other linear range
 *
 * @class linlin
 * @constructor
 * @param inlo Lowest input value
 * @param inhi Highest input value
 * @param outlo Lowest output value
 * @param outhi Highest output value
 * @param input UGen to be mapped
 * @example
 * let test l h => sin (sin 1 >> linlin -0.1 0.1 l h) >> out 0<br> 
 * let t = test 440 880<br>
 * stop t
 */
function linlin(inlo,inhi,outlo,outhi,input)
{
    var scale, offset;
    scale = _binaryOpUGen(
            _BIN_DIV,
            _binaryOpUGen( _BIN_MINUS, outhi,outlo),
            _binaryOpUGen( _BIN_MINUS, inhi,inlo)
            );

    offset = _binaryOpUGen( _BIN_MINUS, outlo, _binaryOpUGen( _BIN_MUL, scale, inlo ) );

    return _binaryOpUGen( _BIN_PLUS, _binaryOpUGen( _BIN_MUL, input, scale ) ,offset );
}

/**
 * Map a liner range to an exponential range.
 *
 * @class linexp
 * @constructor
 * @param inlo Lowest input value
 * @param inhi Highest input value
 * @param outlo Lowest output value
 * @param outhi Highest output value
 * @param input UGen to be mapped
 * @example
 * let test l h => sin (sin 1 >> linexp -0.1 0.1 l h) >> out 0<br> 
 * let t = test 440 880<br>
 * stop t
 */
function linexp(inlo,inhi,outlo,outhi,input)
{
	return multiNewUGen("LinExp", AudioRate, [input,inlo,inhi,outlo,outhi], 1, 0);
}

/**
 * Bitwise & a signal.
 *
 * @class scBitAnd
 * @constructor
 * @param a Signal a
 * @param b Signal b
 * @example
 * TODO
 */
function scBitAnd(a, b)
{
	return _binaryOpUGen(_BIN_BITAND, a, b);
}

/**
 * Bitwise Operators. TODO: fix all examples
 * @submodule Bitwise Operators
 */

/**
 * Bitwise | a signal.
 *
 * @class scBitOr
 * @constructor
 * @param a Signal a
 * @param b Signal b
 * @example
 * TODO
 */
function scBitOr(a, b)
{
	return _binaryOpUGen(_BIN_BITOR, a, b);
}

/**
 * Bitwise xor a signal.
 *
 * @class scBitXor
 * @constructor
 * @param a Signal a
 * @param b Signal b
 * @example
 * TODO
 */
function scBitXor(a, b)
{
	return _binaryOpUGen(_BIN_BITXOR, a, b);
}

/**
 * Bitwise << a signal.
 *
 * @class scBitLeftShift
 * @constructor
 * @param a Signal a
 * @param b Signal b
 * @example
 * TODO
 */
function scBitLeftShift(a, b)
{
	return _binaryOpUGen(_BIN_SHIFTLEFT, a, b);
}

/**
 * Bitwise >> a signal.
 *
 * @class scBitRightShift
 * @constructor
 * @param a Signal a
 * @param b Signal b
 * @example
 * TODO
 */
function scBitRightShift(a, b)
{
	return _binaryOpUGen(_BIN_SHIFTRIGHT, a, b);
}

/**
 * Generate a random number with uniform distribution when synth starts playing.
 *
 * @class scRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @example
 * let test a => sin (scRand 220 440) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scRand(lo,hi)
{
	return multiNewUGen("Rand", ScalarRate, [lo,hi], 1, 0);
}

/**
 * Generate a random number with distribution based on the sum of n random numbers when synth starts playing.
 *
 * @class scNRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @param n Number of random numbers to sum. 1 = uniform distribution, 2 = triangular, etc. Higher numbers approach gaussian
 * @example
 * let test a => sin (scNRand 220 440 4) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scNRand(lo,hi,n)
{
	return multiNewUGen("NRand", ScalarRate, [lo,hi,n], 1, 0);
}

/**
 * Random Number Generators.
 * @submodule Random
 */

/**
 * Generate a random number with linear distribution when synth starts playing.
 *
 * @class scLinRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @example
 * let test a => sin (scLinRand 220 440) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scLinRand(lo,hi)
{
    return multiNewUGen("LinRand", ScalarRate, [lo,hi], 1, 0);
}

/**
 * Generate a random integer with uniform distribution when synth starts playing.
 *
 * @class scIRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @example
 * let test a => sin (scIRand 220 440) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scIRand(lo,hi)
{
	return multiNewUGen("IRand", ScalarRate, [lo,hi], 1, 0);
}


/**
 * Generate a random number with exponential distribution when synth starts playing.
 *
 * @class scExpRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @example
 * let test a => sin (scExpRand 220 440) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scExpRand(lo,hi)
{
    return multiNewUGen("ExpRand", ScalarRate, [lo,hi], 1, 0);
}

/**
 * Generate a random number with uniform distribution on each trigger.
 *
 * @class scTRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @param trigger A trigger happens when the signal changes from non-positive to positive
 * @example
 * let test a => sin (scTRand 220 440 (impulse 1)) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scTRand(lo,hi,trigger)
{
	return multiNewUGen("TRand", AudioRate, [lo,hi,trigger], 1, 0);
}

function trand(min, max, trig)
{
	return multiNewUGen("TRand", AudioRate, [min, max, trig], 1, 0);
}

/**
 * Generate a random integer with uniform distribution on each trigger.
 *
 * @class scTIRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @param trigger A trigger happens when the signal changes from non-positive to positive
 * @example
 * let test a => sin (scTIRand 220 440 (impulse 1)) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scTIRand(lo,hi,trigger)
{
	return multiNewUGen("TIRand", AudioRate, [lo,hi,trigger], 1, 0);
}

/**
 * Generate a random number with exponential distribution on each trigger.
 *
 * @class scTExpRand
 * @constructor
 * @param lo Lowest possible value
 * @param hi Highest possible value
 * @param trigger A trigger happens when the signal changes from non-positive to positive
 * @example
 * let test a => sin (scTExpRand 220 440 (impulse 1)) >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function scTExpRand(lo,hi,trigger)
{
	return multiNewUGen("TExpRand", AudioRate, [lo,hi,trigger], 1, 0);
}

function trandX(min, max, trig)
{
	return multiNewUGen("TExpRand", AudioRate, [min, max, trig], 1, 0);
}

function _findName(input)
{
	var label = "";

	if(input instanceof Array)
		label = input.map(function(e) { return _findName(e); });
	else if(input instanceof UGen || input instanceof MultiOutUGen)
		label = input.name;
	else
		label += input;

	if(label instanceof Array)
		return label.join(", ");
	else
		return label;
}

/**
 * Prints values from a UGen, but passes the input back out. This expensive, so only use for testing.
 *
 * @class poll
 * @constructor
 * @param input The input to poll.
 * @example
 * let pollSynth freq => sin freq >> poll >> out 0
 * let ps = pollSynth 0.5
 * stop ps
 */
function poll(input)
{
	var label = _findName(input);

	label = label.split("").map(function(e){ return e.charCodeAt(0)});

	var pollUGen = multiNewUGen("Poll", AudioRate, [impulse(5), input, -1, label.length].concat(label), 1, 0);

	// make pull ugen reachable by using it in a function (pollUGen * 0), but only input will output values.
	return _binaryOpUGen(_BIN_PLUS, _binaryOpUGen(_BIN_MUL, pollUGen, 0), input); 
}

/**
 * Output a constant value
 *
 * @class dc
 * @constructor
 * @param value Value to be output
 * @example
 * let test value => dc value >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function dc(value)
{
	return multiNewUGen("DC", AudioRate, [value], 1, 0);
}

/**
 * Oscillators.
 * @submodule Oscillators
 */

/**
 * A sine wave oscillator.
 *
 * @class sin
 * @constructor
 * @param freq Frequency
 * @example
 * let test f => sin f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function sin(freq)
{
	return multiNewUGen("SinOsc", AudioRate, [freq, 0], 1, 0);
}

/**
 * A sine wave oscillator with phase input.
 *
 * @class sinP
 * @constructor
 * @param freq Frequency
 * @param phase Phase
 * @example
 * TODO
 */
function sinP(freq,phase)
{
	return multiNewUGen("SinOsc", AudioRate, [freq, phase], 1, 0);
}

/**
 * A saw wave oscillator.
 *
 * @class saw 
 * @constructor
 * @param freq Frequency
 * @example
 * let test f => saw f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function saw(freq)
{
	return multiNewUGen("Saw", AudioRate, [freq], 1, 0);
}

/**
 * A triangle wave oscillator.
 *
 * @class tri
 * @constructor
 * @param freq Frequency
 * @example
 * let test f => tri f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function tri(freq)
{
	return multiNewUGen("LFTri", AudioRate, [freq,0], 1, 0);
}

/**
 * A square wave oscillator.
 *
 * @class square
 * @constructor
 * @param freq Frequency
 * @example
 * let test f => square f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function square(freq)
{
	return multiNewUGen("Pulse", AudioRate, [freq,0.5], 1, 0);
}

/**
 * A pulse wave oscillator with variable duty cycle.
 *
 * @class pulse
 * @constructor
 * @param freq Frequency
 * @param width Pulse width from 0.0 to 1.0
 * @example
 * let test f w => pulse f w >> out 0<br>
 * let t = test 440 0.2<br>
 * stop t
 */
function pulse(freq,width)
{
	return multiNewUGen("Pulse", AudioRate, [freq,width], 1, 0);
}

/**
 * An oscillator with a variable number of harmonics of equal amplitude.
 *
 * @class blip
 * @constructor
 * @param freq Frequency
 * @param nharm Number of harmonics
 * @example
 * let test f n => blip f n >> out 0<br>
 * let t = test 440 5<br>
 * stop t
 */
function blip(freq,nharm)
{
	return multiNewUGen("Blip", AudioRate, [freq,nharm], 1, 0);
}

/**
 * Generates a set of harmonics around a formant frequency at a given fundamental frequency.
 *
 * @class formant
 * @constructor
 * @param fundf Fundamental frequency
 * @param formf Formant frequency
 * @param bwf Pulse width frequency. Must be >= fundf.
 * @example
 * let test fund form bwf => blip fund form bwf >> out 0<br>
 * let t = test 440 1760 880<br>
 * stop t
 */
function formant(fundf,formf,bwf)
{
	return multiNewUGen("Formant", AudioRate, [fundf,formf,bwf], 1, 0);
}

/**
 * Generates single sample impulses at a frequency.
 *
 * @class impulse
 * @constructor
 * @param freq Frequency
 * @example
 * let test f => impulse f >> out 0<br>
 * let t = test 5<br>
 * stop t
 */
function impulse(freq)
{
	return multiNewUGen("Impulse", AudioRate, [freq,0], 1, 0);
}

function pluck(freq, decayTime, coeff, input)
{
	return multiNewUGen("Pluck", AudioRate, [input, impulse(0), 1, div(1,freq), decayTime, coeff], 1, 0);
}

function pluck2(freq, decayTime, coeff, input, trig)
{
	return multiNewUGen("Pluck", AudioRate, [input, trig, 1, div(1,freq), decayTime, coeff], 1, 0);
}

/**
 * White noise generator.
 *
 * @class white 
 * @constructor
 * @param amp Amplitude of the noise
 * @example
 * let test a => white a >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function white(amp)
{
	return _binaryOpUGen(_BIN_MUL, multiNewUGen("WhiteNoise", AudioRate, [], 1, 0), amp);
}

/**
 * Noise.
 * @submodule Noise
 */


/**
 * Violet noise generator.
 *
 * @class violet 
 * @constructor
 * @param amp Amplitude of the noise
 * @example
 * let test a => violet a >> out 0<br>
 * let t = test 1<br>
 * stop t
 */

function violet(amp)
{
	return hpz1(white(amp));
}

/**
 * Pink noise generator.
 *
 * @class pink
 * @constructor
 * @param amp Amplitude of the noise
 * @example
 * let test a => pink a >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function pink(amp)
{
	return _binaryOpUGen(_BIN_MUL, multiNewUGen("PinkNoise", AudioRate, [], 1, 0), amp);
}

/**
 * Brownian noise generator.
 *
 * @class brown
 * @constructor
 * @param amp Amplitude of the noise
 * @example
 * let test a => brown a >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function brown(amp)
{
	return _binaryOpUGen(_BIN_MUL, multiNewUGen("BrownNoise", AudioRate, [], 1, 0), amp);
}

/**
 * Gray noise generator.
 *
 * @class gray
 * @constructor
 * @param amp Amplitude of the noise
 * @example
 * let test a => gray a >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function gray(amp)
{
	return _binaryOpUGen(_BIN_MUL, multiNewUGen("GrayNoise", AudioRate, [], 1, 0), amp);
}

/**
 * Generates noise whose values are either -1 or 1.
 *
 * @class clipNoise
 * @constructor
 * @param amp Amplitude of the noise
 * @example
 * let test a => clipNoise a >> out 0<br>
 * let t = test 1<br>
 * stop t
 */
function clipNoise(amp)
{
	return _binaryOpUGen(_BIN_MUL, multiNewUGen("ClipNoise", AudioRate, [], 1, 0), amp);
}

/**
 * A noise generator based on a chaotic function.
 *
 * @class crackle
 * @constructor
 * @param chaos A parameter of the chaotic function with useful values from just below 1.0 to just above 2.0. Towards 2.0 the sound crackles.
 * @example
 * let test c => crackle c >> out 0<br>
 * let t = test 1.5<br>
 * stop t
 */
function crackle(chaos)
{
	return multiNewUGen("Crackle", AudioRate, [chaos], 1, 0);
}

/**
 * When CoinGate receives a trigger, it tosses a coin and either passes the trigger or doesn't.
 *
 * @class coingate
 * @constructor
 * @param probability Value between 0.0 and 1.0 for chance of passing the trigger
 * @param input The trigger
 * @example
 * let test p => sin (scTRand 440 880 (coingate p (impulse 2))) >> out 0<br>
 * let t = test 0.5<br>
 * stop t
 */
function coingate(probability,input)
{
	return multiNewUGen("CoinGate", AudioRate, [probability,input], 1, 0);
}

/**
 * Generates random impulses from 0 to +1.
 *
 * @class dust
 * @constructor
 * @param density Average number of impulses per second.
 * @example
 * let test d => dust d >> out 0<br>
 * let t = test 1.5<br>
 * stop t
 */
function dust(density)
{
	return multiNewUGen("Dust", AudioRate, [density], 1, 0);
}

/**
 * Generates random impulses from -1 to +1.
 *
 * @class dust2
 * @constructor
 * @param density Average number of impulses per second.
 * @example
 * let test d => dust2 d >> out 0<br>
 * let t = test 1.5<br>
 * stop t
 */
function dust2(density)
{
	return multiNewUGen("Dust2", AudioRate, [density], 1, 0);
}

/**
 * Generates impulses centered around a frequency with gaussian distribution.
 *
 * @class gausstrig
 * @constructor
 * @param freq Mean frequency
 * @param dev Random deviation from mean (0 <= dev < 1)
 * @example
 * let test d => sin (scTRand 440 880 (gausstrig 2 d)) >> out 0<br>
 * let t = test 0.2<br>
 * stop t
 */
function gausstrig(freq,dev)
{
	return multiNewUGen("GaussTrig", AudioRate, [freq,dev], 1, 0);
}

/**
 * A stepped random number generator
 *
 * @class noiseN
 * @constructor
 * @param freq Frequency of random number generation
 * @example
 * let test f => noiseN f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function noiseN(freq)
{
	return multiNewUGen("LFNoise0", AudioRate, [freq], 1, 0);
}

/**
 * A linearly interpolated random number generator
 *
 * @class noiseL
 * @constructor
 * @param freq Frequency of random number generation
 * @example
 * let test f => noiseL f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function noiseL(freq)
{
	return multiNewUGen("LFNoise1", AudioRate, [freq], 1, 0);
}

/**
 * A cubic interpolated random number generator
 *
 * @class noiseX
 * @constructor
 * @param freq Frequency of random number generation
 * @example
 * let test f => noiseX f >> out 0<br>
 * let t = test 440<br>
 * stop t
 */
function noiseX(freq)
{
	return multiNewUGen("LFNoise2", AudioRate, [freq], 1, 0);
}

/**
 * A non-interpolating sound generator based on the difference equation: x[n+1] = a - b * sqrt(abs(x[n]))
 *
 * @class cuspN 
 * @constructor
 * @param freq Frequency
 * @param a Equation variable
 * @param b Equation variable
 * @param xi Initial value of x
 * @example
 * let test f a b xi => cuspN f a b xi >> out 0<br>
 * let t = test 22050 1 1.9 0<br>
 * stop t
 */
function cuspN(freq,a,b,xi)
{
	return multiNewUGen("CuspN", AudioRate, [freq,a,b,xi], 1, 0);
}

/**
 * Chaotic Oscillators.
 * @submodule Chaos
 */

/**
 * A linearly interpolating sound generator based on the difference equation: x[n+1] = a - b * sqrt(abs(x[n]))
 *
 * @class cuspL 
 * @constructor
 * @param freq Frequency
 * @param a Equation variable
 * @param b Equation variable
 * @param xi Initial value of x
 * @example
 * let test f a b xi => cuspL f a b xi >> out 0<br>
 * let t = test 22050 1 1.9 0<br>
 * stop t
 */
function cuspL(freq,a,b,xi)
{
	return multiNewUGen("CuspL", AudioRate, [freq,a,b,xi], 1, 0);
}

/**
 * A non-interpolating sound generator based on the difference equation: x[n+1] = 1 - y[n] + abs(x[n]); y[n+1] = x[n];
 *
 * @class gbmanN
 * @constructor
 * @param freq Frequency
 * @param xi Initial value of x
 * @param yi Initial value of y
 * @example
 * let test f xi yi => gbmanN f xi yi >> out 0<br>
 * let t = test 22050 1.2 2.1<br>
 * stop t
 */
function gbmanN(freq,xi,yi)
{
	return multiNewUGen("GbmanN", AudioRate, [freq,xi,yi], 1, 0);
}

/**
 * A linearly interpolating sound generator based on the difference equation: x[n+1] = 1 - y[n] + abs(x[n]); y[n+1] = x[n];
 *
 * @class gbmanL
 * @constructor
 * @param freq Frequency
 * @param xi Initial value of x
 * @param yi Initial value of y
 * @example
 * let test f xi yi => gbmanL f xi yi >> out 0<br>
 * let t = test 22050 1.2 2.1<br>
 * stop t
 */
function gbmanL(freq,xi,yi)
{
	return multiNewUGen("GbmanL", AudioRate, [freq,xi,yi], 1, 0);
}

/**
 * A low pass filter.
 * 
 * @class lowpass
 * @constructor
 * @param freq Cutoff frequency for the filter
 * @param q Quality of the filter
 * @example
 * let test f q => white 1 >> lowpass f q >> out 0<br>
 * let t = test 440 10<br>
 * stop t
 */
function lowpass(freq, q, input)
{
	return multiNewUGen("RLPF", AudioRate, [input,freq,1/q], 1, 0);
}


function lowshelf(freq, boost, input)
{
	return multiNewUGen("BLowShelf", AudioRate, [input, freq, 1, boost], 1, 0);
}

/**
 * Filters.
 * @submodule Filters
 */

/**
 * Removes DC offset from a signal.
 * 
 * @class leakdc
 * @constructor
 * @param coef Leak coefficient
 * @param input Input signal
 * @example
 * let test c => white 1 >> leakdc c >> out 0<br>
 * let t = test 0.995<br>
 * stop t
 */
function leakdc(coef, input)
{
	return multiNewUGen("LeakDC", AudioRate, [input,coef], 1, 0);
}

/**
 * Removes DC offset from a signal with a default coefficient.
 * 
 * @class leakdc1
 * @constructor
 * @param input Input signal
 * @example
 * let test a => white a >> leakdc >> out 0<br>
 * let t = test 0.5<br>
 * stop t
 */
function leakdc1(input)
{
	return multiNewUGen("LeakDC", AudioRate, [input,0.995], 1, 0);
}

/**
 * A high pass filter.
 * 
 * @class highpass
 * @constructor
 * @param freq Cutoff frequency for the filter
 * @param q Quality of the filter
 * @example
 * let test f q => white 1 >> highpass f q >> out 0<br>
 * let t = test 440 10<br>
 * stop t
 */
function highpass(freq, q, input)
{
	return multiNewUGen("RHPF", AudioRate, [input,freq,1/q], 1, 0);
}

/**
 * A band pass filter.
 * 
 * @class bandpass 
 * @constructor
 * @param freq Cutoff frequency for the filter
 * @param q Quality of the filter
 * @example
 * let test f q => white 1 >> bandpass f q >> out 0<br>
 * let t = test 440 10<br>
 * stop t
 */
function bandpass(freq, q, input)
{
	return multiNewUGen("BPF", AudioRate, [input,freq,1/q], 1, 0);
}

function hpz1(input)
{
	return multiNewUGen("HPZ1", AudioRate, [input], 1, 0);
}

function lpz1(input)
{
	return multiNewUGen("LPZ1", AudioRate, [input], 1, 0);
}

function hpz2(input)
{
	return multiNewUGen("HPZ2", AudioRate, [input], 1, 0);
}

function lpz2(input)
{
	return multiNewUGen("LPZ2", AudioRate, [input], 1, 0);
}

function bpz2(input)
{
	return multiNewUGen("BPZ2", AudioRate, [input], 1, 0);
}

function brz2(input)
{
	return multiNewUGen("BRZ2", AudioRate, [input], 1, 0);
}

function fos(a0, a1, b1, input)
{
	return multiNewUGen("FOS", AudioRate, [input, a0, a1, b1], 1, 0);
}

function sos(a0, a1, a2, b1, b2, input)
{
	return multiNewUGen("SOS", AudioRate, [input, a0, a1, a2, b1, b2], 1, 0);
}

function onepole(coeff, input)
{
	return multiNewUGen("OnePole", AudioRate, [input, coeff], 1, 0);
}

function onezero(coeff, input)
{
	return multiNewUGen("OneZero", AudioRate, [input, coeff], 1, 0);
}

function slope(start, end, time)
{
	return multiNewUGen("Line", AudioRate, [start, end, time, 0], 1, 0);
}

function slopeX(start, end, time)
{
	return multiNewUGen("XLine", AudioRate, [start, end, time, 0], 1, 0);
}

function decay(decayTime, input)
{
	return multiNewUGen("Decay", AudioRate, [input, decayTime], 1, 0);
}

function decay2(attackTime, decayTime, input)
{
	return multiNewUGen("Decay2", AudioRate, [input, attackTime, decayTime], 1, 0);
}

function reson(freq, decayTime, input)
{
	return multiNewUGen("Ringz", AudioRate, [input, freq, decayTime], 1, 0);
}



/**
 * Digitally modeled analog filter.
 * 
 * @class dfm1
 * @constructor
 * @param freq Cutoff frequency for the filter
 * @param q Quality of the filter
 * @param inputgain Gain on the input signal
 * @param type 0 for lowpass, 1 for highpass
 * @param noiselevel Amplitude of noise added to the model
 * @param input Signal to be filtered
 * @example
 * TODO
 */
function dfm1(freq, q, inputgain, type, noiselevel, input)
{
	return multiNewUGen("DFM1", AudioRate, [input,freq,q,inputgain,type,noiselevel], 1, 0);
}

/**
 * Ramp a signal between two values over time.
 *
 * @class lag
 * @constructor
 * @param lagtime Ramp time in seconds
 * @example
 * let test lagtime => noiseN 100 >> lag lagtime >> out 0<br>
 * let t = test 0.001<br>
 * stop t
 */
function lag(lagtime, input)
{
	return multiNewUGen("Lag", AudioRate, [input,lagtime], 1, 0);
}

/**
 * Bit crush a signal.
 *
 * @class crush
 * @constructor
 * @param bits Bitdepth of resulting signal (1-64)
 * @example
 * let test b => sin 440 >> crush b >> out 0<br>
 * let t = test 4<br>
 * stop t
 */
function crush(bits, input)
{
	return multiNewUGen("Decimator", AudioRate, [input,44100,bits], 1, 0);
}

/**
 * Sample rate reduction on a signal.
 *
 * @class decimate
 * @constructor
 * @param rate Sample rate of resulting signel (1-44100)
 * @example
 * let test r => sin 440 >> decimate r >> out 0<br>
 * let t = test 11000<br>
 * stop t
 */
function decimate(rate, input)
{
	return multiNewUGen("Decimator", AudioRate, [input,rate,64], 1, 0);
}

/**
 * General purpose (hard-knee) dynamics processor.
 *
 * @class compander
 * @constructor
 * @param control Control signal. Same as input for compression, different for ducking.
 * @param thresh Control signal amplitude threshold.
 * @param slopeBelow Compression slope below the threshold
 * @param slopeAbove Compression slope above the threshold
 * @param clampTime Time until compression fully active
 * @param relaxTime Time until compression fully inactive
 * @param input The signal to be compressed
 * @example
 * TODO
 */
 function compander(control,thresh,slopeBelow,slopeAbove,clampTime,relaxTime,input)
{
	return multiNewUGen("Compander", AudioRate, [control,thresh,slopeBelow,slopeAbove,clampTime,relaxTime,input], 1, 0);
}

/**
 * Limits the amplitude of the the input to a given level.
 *
 * @class limiter 
 * @constructor
 * @param level Amplitude level to limit input to
 * @param dur Lookahead time
 * @param input Signal to be limited
 * @example
 * TODO
 */
function limiter(level,dur,input)
{
	return multiNewUGen("Limiter", AudioRate, [input,level,dur], 1, 0);
}

/**
 * A time domain granular pitch shifter. Grains have a triangular amplitude envelope and an overlap of 4:1.
 *
 * @class pitchshift
 * @constructor
 * @param windowSize Grain window size
 * @param pitchRatio Ratio of the pitch shift. Between 0 and 4
 * @param pitchDispersion Maximum random deviation from the pitchRatio
 * @param timeDispersion Random time offset of each grain
 * @param input Signal to be pitch shifted
 * @example
 * TODO
 */
function pitchshift(windowSize,pitchRatio,pitchDispersion,timeDispersion,input)
{
	return multiNewUGen("PitchShift", AudioRate, [windowSize,pitchRatio,pitchDispersion,timeDispersion,input], 1, 0);
}

/**
 * Single sideband amplitude modulation based frequency shifting.
 *
 * @class freqshift
 * @constructor
 * @param freq Shift amount in Hz
 * @param phase Amount of phase
 * @param input Signal to be limited
 * @example
 * TODO
 */
function freqshift(freq,phase,input)
{
	return multiNewUGen("FreqShift", AudioRate, [input,freq,phase], 1, 0);
}

/**
 * Simple single channel reverb.
 *
 * @class freeverb
 * @constructor
 * @param mix Dry/wet balanece from 0-1
 * @param room Room size from 0-1
 * @param damp High frequency damping from 0-1
 * @param input Input signal
 * @example
 * TODO
 */
function freeverb(mix,room,damp,input)
{
	return multiNewUGen("FreeVerb", AudioRate, [input,mix,room,damp], 1, 0);
}
/**
 * Two channel reverb.
 *
 * @class gverb
 * @constructor
 * @param roomsize In squared meters
 * @param revtime In seconds
 * @param damping 0 to 1, high frequency rolloff, 0 damps the reverb signal completely, 1 not at all
 * @param inputbw 0 to 1, same as damping control, but on the input signal
 * @param spread A control on the stereo spread and diffusion of the reverb signal
 * @param drylevel Amount of dry signal
 * @param earlyreflevel Amount of early reflection level
 * @param taillevel Amount of tail level
 * @param maxroomsize To set the size of the delay lines
 * @param input
 * @example
 * let test f => impulse f >> gverb 10 3 0.5 0.5 15 1 0.7 0.5 11 >> out 0
 * let t = test 1
 * stop t
 */

function gverb(roomsize, revtime, damping, inputbw, spread, drylevel, earlyreflevel, taillevel, maxroomsize, input)
{
	return newMultiOutUGen("GVerb", [AudioRate, AudioRate], [input, roomsize, revtime, damping, inputbw, spread, drylevel, earlyreflevel, taillevel, maxroomsize], 0);
}

/**
 * An allpass delay line with no interpolation.
 * 
 * @class allpassN
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> allpassN del del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */

function allpassN(maxDel, del, decay, input)
{
	return multiNewUGen("AllpassN", AudioRate, [input,maxDel,del,decay], 1, 0);
}

/**
 * Delays.
 * @submodule Delays
 */

/**
 * An allpass delay line with no interpolation. This version uses a localBuf.
 *
 * @class bufAllpassN 
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> bufAllpassN (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufAllpassN(buf, del, decay, input)
{
	return multiNewUGen("BufAllpassN", AudioRate, [input,buf,del,decay], 1, 0);
}

/**
 * An allpass delay line with linear interpolation.
 *
 * @class allpassL
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> allpassL del del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function allpassL(maxDel, del, decay, input)
{
	return multiNewUGen("AllpassL", AudioRate, [input,maxDel,del,decay], 1, 0);
}

/**
 * An allpass delay line with linear interpolation. This version uses a localBuf.
 *
 * @class bufAllpassL 
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> bufAllpassL (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufAllpassL(buf, del, decay, input)
{
	return multiNewUGen("BufAllpassL", AudioRate, [input,buf,del,decay], 1, 0);
}

/**
 * An allpass delay line with cubic interpolation.
 *
 * @class allpassC 
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> allpassC del del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function allpassC(maxDel, del, decay, input)
{
	return multiNewUGen("AllpassC", AudioRate, [input,maxDel,del,decay], 1, 0);
}

/**
 * An allpass delay line with cubic interpolation. This version uses a localBuf.
 *
 * @class bufAllpassC 
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> bufAllpassC (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufAllpassC(buf, del, decay, input)
{
	return multiNewUGen("BufAllpassC", AudioRate, [input,buf,del,decay], 1, 0);
}

/**
 * A comb delay line with no interpolation.
 *
 * @class combN
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> combN del del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function combN(maxDel, del, decay, input)
{
	return multiNewUGen("CombN", AudioRate, [input,maxDel,del,decay], 1, 0);
}

/**
 * A comb delay line with no interpolation. This version uses a localBuf.
 *
 * @class bufCombN
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @param decay Time in seconds for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> bufCombN (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufCombN(buf, del, decay, input)
{
	return multiNewUGen("BufCombN", AudioRate, [buf, input, del, decay], 1, 0);
}

/**
 * A comb delay line with linear interpolation.
 *
 * @class combL
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @param decay Time for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> combL del del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function combL(maxDel, del, decay, input)
{
	return multiNewUGen("CombL", AudioRate, [input,maxDel,del,decay], 1, 0);
}

/**
 * A comb delay line with cubic linear interpolation. This version uses a localBuf.
 *
 * @class bufCombL
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @param decay Time in seconds for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> bufCombL (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufCombL(buf, del, decay, input)
{
	return multiNewUGen("BufCombL", AudioRate, [buf, input, del, decay], 1, 0);
}

/**
 * A comb delay line with cubic interpolation.
 *
 * @class combC
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @param decay Time in seconds for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> combC del del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function combC(maxDel, del, decay, input)
{
	return multiNewUGen("CombC", AudioRate, [input,maxDel,del,decay], 1, 0);
}

/**
 * A comb delay line with cubic interpolation. This version uses a localBuf.
 *
 * @class bufCombC
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @param decay Time in seconds for the echoes to decay by 60 decibels.
 * @example
 * let test del => impulse 1 >> bufCombC (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufCombC(buf, del, decay, input)
{
	return multiNewUGen("BufCombC", AudioRate, [buf, input, del, decay], 1, 0);
}

/**
 * A simple delay with no interpolation.
 *
 * @class delayN
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @example
 * let test del => impulse 1 >> delayN del del >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function delayN(maxDel, del, input)
{
	return multiNewUGen("DelayN", AudioRate, [input,maxDel,del], 1, 0);
}

/**
 * A simple delay with no interpolation. This version uses a localBuf.
 *
 * @class bufDelayN
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @example
 * let test del => impulse 1 >> bufDelayN (localBuf 44100 1) del >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufDelayN(buf, del, input)
{
	return multiNewUGen("BufDelayN", AudioRate, [input,buf,del], 1, 0);
}

/**
 * A simple delay with linear interpolation.
 *
 * @class delayL
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @example
 * let test del => impulse 1 >> delayL del del >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function delayL(maxDel, del, input)
{
	return multiNewUGen("DelayL", AudioRate, [input,maxDel,del], 1, 0);
}

/**
 * A simple delay with linear interpolation. This version uses a localBuf.
 *
 * @class bufDelayL
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @example
 * let test del => impulse 1 >> bufDelayL (localBuf 44100 1) del >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufDelayL(buf, del, input)
{
	return multiNewUGen("BufDelayL", AudioRate, [input,buf,del], 1, 0);
}

/**
 * A simple delay with cubic interpolation.
 *
 * @class delayC
 * @constructor
 * @param maxDel Max delay time in seconds
 * @param del Delay time in seconds
 * @example
 * let test del => impulse 1 >> delayC del del >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function delayC(maxDel, del, input)
{
	return multiNewUGen("DelayC", AudioRate, [input,maxDel,del], 1, 0);
}

/**
 * A simple delay with cubic interpolation. This version uses a localBuf.
 *
 * @class bufDelayC
 * @constructor
 * @param buf LocalBuf to use for the delay
 * @param del Delay time in seconds
 * @example
 * let test del => impulse 1 >> bufDelayC (localBuf 44100 1) del >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function bufDelayC(buf, del, input)
{
	return multiNewUGen("BufDelayC", AudioRate, [input,buf,del], 1, 0);
}

var _shapeNames = {
	step: 0,
	lin: 1,
	linear: 1,
	exp: 2,
	exponential: 2,
	sin: 3,
	sine: 3,
	wel: 4,
	welch: 4,
	sqr: 6,
	squared: 6,
	cub: 7,
	cubed: 7
}

function _prEnv(levels, times, shape, input, doneAction)
{
	if(!(levels instanceof Array && times instanceof Array))
		throw new Error("env levels and times must be arrays");

	var size = times.length;
	var contents = [];
	contents.push(levels[0]);
	contents.push(size);
	contents.push(-99); // -99 = no releaseNode
	contents.push(-99); // -99 = no loopNode
	var shapeNum = _shapeNames.hasOwnProperty(shape) ? _shapeNames[shape] : 5; // 5 = custom shape
	var curveNum = typeof shape === "string" ? 0 : shape; // 0 default shape

	for(var i = 0; i < size; ++i)
	{
		contents.push(levels[i+1]);
		contents.push(times[i]);
		contents.push(shapeNum);
		contents.push(curveNum);
	}
	
	return multiNewUGen(
		"EnvGen",
		AudioRate,
		[1/*gate*/, 1/*levelScale*/, 0/*levelBias*/, 1/*timeScale*/, doneAction].concat(contents),
		1,
		0
	);
}

/**
 * Envelope generator. Used for amplitude envelopes, will automatically free the synth when finished.
 * @class env
 * @constructor
 * @param levels The levels that the envelope will move through
 * @param times The times it takes for the env to move between levels. Should be 1 item less than levels
 * @param shape Either a shape number or string. Some examples: -4, 0, 1, "linear", "squared"
 * @param input Either a ugen or 1
 * @example 
 * let test amp => white amp >> env [0,1,0] [1,1] "linear" >> out 0<br>
 * test $ random 0.1 1.0
 */
function env(levels, times, shape, input)
{	
	// doneAction 2 kills the synth
	return _binaryOpUGen(_BIN_MUL, _prEnv(levels, times, shape, input, 2), input);
}

/**
 * Envelopes.
 * @submodule Envelopes
 */

/**
 * Envelope generator. Used for amplitude envelopes, will NOT automatically free the synth when finished.
 * @class env2
 * @constructor
 * @param levels The levels that the envelope will move through
 * @param times The times it takes for the env to move between levels. Should be 1 item less than levels
 * @param shape Either a shape number or string. Some examples: -4, 0, 1, "linear", "squared"
 * @param input Either a ugen or 1
 * @example
 * let test f => sin (env2[f,f*2,f] [1,1] "linear" 1) >> env [0,0.3,0] [2,2] "linear" >> out 0<br>
 * test $ random 440 880
 */
function env2(levels, times, shape, input)
{	
	// doneAction 0 doesn't kill the synth
	return _binaryOpUGen(_BIN_MUL, _prEnv(levels, times, shape, input, 0), input);
}

/**
 * Envelope generator. Used for amplitude envelopes, will automatically free the synth when finished.
 * @class perc
 * @constructor
 * @param attackTime Time for the envelope to go from 0 to the peak
 * @param peak The highest level the envelope with reach
 * @param decayTime Time for the envelope to go from the peak to 0
 * @example
 * let test amp => white amp >> perc 0 1 1 >> out 0<br>
 * test $ random 0.1 1.0
 */
function perc(attackTime, peak, decayTime, input)
{
	return env([0,peak,0], [attackTime, decayTime], -4, input);
}

/**
 * Envelope generator. Used for amplitude envelopes, will NOT automatically free the synth when finished.
 * @class perc2
 * @constructor
 * @param attackTime Time for the envelope to go from 0 to the peak
 * @param peak The highest level the envelope with reach
 * @param decayTime Time for the envelope to go from the peak to 0
 */
function perc2(attackTime, peak, decayTime, input)
{
	return env2([0,peak,0], [attackTime, decayTime], -4, input);
}

/**
 * A linear envelope between two values
 *
 * @class line
 * @constructor
 * @param start Starting value
 * @param end Ending value
 * @param dur Duration in seconds
 * @example
 * let test dur => impulse (line 1 10 dur) >> out 0<br>
 * let t = test 10<br>
 * stop t
 */
function line(start,end,dur)
{
	return multiNewUGen("Line", AudioRate, [start,end,dur,0], 1, 0);
}

/**
 * An exponential envelope between two values
 *
 * @class xline
 * @constructor
 * @param start Starting value
 * @param end Ending value
 * @param dur Duration in seconds
 * @example
 * let test dur => impulse (xline 1 10 dur) >> out 0<br>
 * let t = test 10<br>
 * stop t
 */
function line(start,end,dur)
{
	return multiNewUGen("Line", AudioRate, [start,end,dur,0], 1, 0);
}

/**
 * Outputs a trigger when input value is changed.
 *
 * @class changed
 * @constructor
 * @param threshold The minimum change for the trigger. 0 in most cases
 * @param input Input signal
 * @example
 * TODO
 */
function changed(threshold,input)
{
	return multiNewUGen("Changed", AudioRate, [input,threshold], 1, 0);
}

/**
 * Triggers
 * @submodule Triggers
 */

/**
 * Pass when gate is positive, otherwise holds last value.
 *
 * @class gate 
 * @constructor
 * @param trigger Signal to be used as a gate
 * @param input Input signal
 * @example
 * TODO
 */
function gate(trigger,input)
{
	return multiNewUGen("Gate", AudioRate, [input,trigger], 1, 0);
}

/**
 * Output the last value before the input changed more than a threshhold.
 *
 * @class lastvalue
 * @constructor
 * @param diff Difference threshhold
 * @param input Input signal
 * @example
 * TODO
 */
function lastvalue(diff,input)
{
	return multiNewUGen("LastValue", AudioRate, [input,diff], 1, 0);
}

/**
 * Sample and hold.
 *
 * @class latch
 * @constructor
 * @param trigger Signal that causes new value to be sampled
 * @param input Input signal
 * @example
 * TODO
 */
function latch(trigger,input)
{
	return multiNewUGen("Latch", AudioRate, [input,trigger], 1, 0);
}

/**
 * Linear ramp between start and end values. When its trigger input crosses from non-positive to positive, Phasor's output will jump to its reset position. Upon reaching the end of its ramp Phasor will wrap back to its start.
 *
 * @class phasor
 * @constructor
 * @param rate The amount of change per sample, i.e at a rate of 1 the value of each sample will be 1 greater than the preceding sample.
 * @param start Start value
 * @param end End value
 * @param resetpos Where to jump on reset (0-1)
 * @param trigger Signal that causes phasor to reset
 * @example
 * TODO
 */
function phasor(rate,start,end,resetpos,trigger)
{
	return multiNewUGen("Phasor", AudioRate, [trigge,rrate,start,end,resetpos], 1, 0);
}

/**
 * Each trigger increments a counter which is output as a signal.
 *
 * @class pulsecount
 * @constructor
 * @param reset Signal which resets the counter
 * @param trigger Signal that increments the counter
 * @example
 * TODO
 */
function pulsecount(reset,trigger)
{
	return multiNewUGen("PulseCount", AudioRate, [trigger,reset], 1, 0);
}

/**
 * Outputs one impulse each time it receives a certain number of triggers at its input.
 *
 * @class pulsedivider
 * @constructor
 * @param div Dumber of pulses to divide by
 * @param start Starting value for the trigger count. This lets you start somewhere in the middle of a count, or if startCount is negative it adds that many counts to the first time the output is triggers.
 * @param trigger Signal that increments the counter
 * @example
 * TODO
 */
function pulsedivider(div,start,trigger)
{
	return multiNewUGen("PulseDivider", AudioRate, [trigger,div,start], 1, 0);
}

function trigDivider(div, input)
{
	return multiNewUGen("PulseDivider", AudioRate, [input, div, 0], 1, 0);
}

/**
 * Triggerable steps at a given interval between minimum and maximum values.
 *
 * @class stepper
 * @constructor
 * @param min Lowest possible value
 * @param max Highest possible value
 * @param step The range by which each step will jump.
 * @param trigger A trigger happens when the signal changes from non-positive to positive
 * @example
 * let stepSynth stepFreq => sin freq >> dup >> gain 0.3 >> out 0
 *   where
 *       freq = stepper 220 440 20 (impulse stepFreq)
 *
 * let stSynth = stepSynth 4
 * stop stSynth
 */
function stepper(min, max, step, trig)
{
	return multiNewUGen("Stepper", AudioRate, [trig, 0, min, max, step, min], 1, 0); 
}

function timer(trig)
{
	return multiNewUGen("Timer", AudioRate, [trig], 1, 0);
}

function sweep(sweepRate, trig)
{
	return multiNewUGen("Sweep", AudioRate, [trig, rate], 1, 0);
}

/**
 * Send a signal to an output bus.
 *
 * @class out
 * @constructor
 * @param busNum The bus index to send to
 * @example
 * let test bus => white 1 >> out bus<br>
 * let t = test 0<br>
 * stop t
 */
function out(busNum, value)
{
	var outGen = multiNewUGen("Out", AudioRate, [busNum, value], 0, 0); // Out has not outputs

	if(outGen instanceof Array)
	{
		for(var i = 0; i < outGen.length; ++i) // expand the output bus to account for multichannel expansion
		{
			outGen[i].inputs[0] = busNum + i;
		}
	}

	return outGen;
}

function replaceOut(busNum, value)
{
	var outGen = multiNewUGen("ReplaceOut", AudioRate, [busNum, value], 0, 0); // Out has not outputs

	if(outGen instanceof Array)
	{
		for(var i = 0; i < outGen.length; ++i) // expand the output bus to account for multichannel expansion
		{
			outGen[i].inputs[0] = busNum + i;
		}
	}

	return outGen;
}

/**
 * Inputs and Outputs
 * @submodule InputOutput
 */

/**
 * Reads audio from a range of audio buses.
 *
 * @class auxIn
 * @constructor
 * @param busNum The bus index to start reading from.
 * @param numChannels The number of channels to read from.
 * @example
 * let simpleSynth freq => sin freq \* square (2\*tempoSeconds) * 0.25 >> out 20<br>
 * let sSynth = simpleSynth 440<br>
 * let fxSynth => auxIn 20 1 >> combC tempoSeconds [tempoSeconds/1, tempoSeconds/2] 10 >> out 0<br>
 * let fx = Synth::after "fxSynth" [] server<br>
 * stop sSynth<br>
 * stop fx
 */
function auxIn(busNum, numChannels)
{
	var rates = [];

	for(var i = 0; i < numChannels; ++i)
	{
		rates.push(AudioRate);
	}

	// !!! We indicate number of outputs using an array of rates. !!!
	return newMultiOutUGen("In", rates, [busNum], 0);
}

/**
 * Reads audio from a range of audio buses, delayed by an audio block, which allows for feedback.
 *
 * @class feedbackIn
 * @constructor
 * @param busNum The bus index to start reading from.
 * @param numChannels The number of channels to read from.
 * @example
 * let simpleSynth freq => sin freq \* square (2\*tempoSeconds) * 0.25 >> out 20<br>
 * let sSynth = simpleSynth 440<br>
 * let fxSynth => feedbackIn 20 1 >> combC tempoSeconds [tempoSeconds/1, tempoSeconds/2] 10 >> out 0<br>
 * let fx = Synth::after "fxSynth" [] server<br>
 * stop sSynth<br>
 * stop fx
 */
function feedbackIn(busNum, numChannels)
{
	var rates = [];

	for(var i = 0; i < numChannels; ++i)
	{
		rates.push(AudioRate);
	}

	// !!! We indicate number of outputs using an array of rates. !!!
	return newMultiOutUGen("InFeedback", rates, [busNum], 0);
}

/**
 * Pans a single channel input across a stereo field using equal power panning.
 *
 * @class pan
 * @constructor
 * @param position The position in the stereo field where the input will be panned. Range of -1 (left) to 1 (right).
 * @param input The audio input to be panned.
 * @example
 * let test pos => white 1 >> pan pos >> out 0<br>
 * let t = test-0.3 <br>
 * stop t
 */

function pan(position, input)
{
	// !!! We indicate number of outputs using an array of rates. This is 2 audio rate outputs !!!
	return newMultiOutUGen("Pan2", [AudioRate, AudioRate], [input, position, 1], 0);
}

/**
 * Panning UGens
 * @submodule Panning
 */

/**
 * Duplicates an input across a 2 index array.
 *
 * @class dup
 * @constructor
 * @param input The audio input to be expanded.
 * @example
 * let test freq => sin freq >> dup >> out 0<br>
 * let t = test 440 <br>
 * stop t
 */function dup(input)
{
	return [input, input];
}

function select(inputArray, index)
{
	return multiNewUGen("Select", AudioRate, [index].concat(inputArray), 1, 0);
}

function uchoose(inputArray)
{
	return multiNewUGen("Select", AudioRate, [scIRand(0, inputArray.length)].concat(inputArray), 1, 0);
}

function twindex(weights, input)
{
	return multiNewUGen("TWindex", AudioRate, [input, 0].concat(weights), 1, 0);
}

function uwchoose(weights, inputArray)
{

	return multiNewUGen("Select", AudioRate, [twindex(weights, impulse(0))].concat(inputArray), 1, 0);
}

function mouseY(low, high, scale)
{
	return multiNewUGen("MouseY", ControlRate, [low, high, scale, 0.2], 1, 0);
}

function mouseX(low, high, scale)
{
	return multiNewUGen("MouseX", ControlRate, [low, high, scale, 0.2], 1, 0);
}

function pitchShift(pitchRatio, input)
{
	return multiNewUGen("PitchShift", AudioRate, [input, 0.2, pitchRatio, 0, 0], 1, 0);
}

function freqShift(freq, input)
{
	return multiNewUGen("FreqShift", AudioRate, [input, freq, 0], 1, 0);
}

// Control is used internally for SynthDef arguments/controls
function _ControlName(name, controlIndex)
{
	this._lichType = AUDIO;
	this.name = name;
	this.controlIndex = controlIndex;
	this.rate = ControlRate;
}

function _Control(numControls)
{
	var values = [];

	for(var i = 0; i < numControls; ++i)
	{
		values.push(0);
	}
	
	return multiNewUGen("Control", ControlRate, values, numControls, 0);
}

// Used internally to keep track of local bufs
function _MaxLocalBufs()
{
	return new UGen("MaxLocalBufs", ScalarRate, [0], 1, 0);
}

/**
 * A buffer local to a synth.
 *
 * @class localBuf
 * @constructor
 * @param frames Size of the buffer in samples
 * @param channels Number of channels for the buffer
 * @example
 * let test del => impulse 1 >> bufCombC (localBuf 44100 1) del 1 >> out 0<br>
 * let t = test 0.1<br>
 * stop t
 */
function localBuf(frames, channels)
{
	var lb = multiNewUGen("LocalBuf", ScalarRate, [channels, frames], 1, 0);

	if(lb instanceof Array)
		return lb.map(function(e) { e.isLocalBuf = true; return e; });

	lb.isLocalBuf = true;
	return lb;
}

/**
 * Buffers.
 * @submodule Buffers
 */

//////////////////////////////////////////////
//// Write input spec protoype inheritance
//////////////////////////////////////////////

Number.prototype.writeInputSpec = function(buf, offset, constants, controls)
{
	buf.writeInt32BE(-1, offset);
	offset += 4;
	buf.writeInt32BE(constants[this.valueOf()], offset);
	return offset + 4;
}

_ControlName.prototype.writeInputSpec = function(buf, offset, constants, controls)
{
	buf.writeInt32BE(0, offset); // The control ugen is always in the 0 index
	offset += 4;
	buf.writeInt32BE(controls[this.name], offset);
	return offset + 4;
}

UGen.prototype.writeInputSpec = function(buf, offset, constants, controls)
{
	buf.writeInt32BE(this.synthIndex, offset);
	offset += 4;
	buf.writeInt32BE(this.outputIndex, offset);
	return offset + 4;
}

MultiOutUGen.prototype.writeInputSpec = function(buf, offset, constants, controls)
{
	buf.writeInt32BE(this.synthIndex, offset);
	offset += 4;
	buf.writeInt32BE(this.outputIndex, offset);
	return offset + 4;
}

function _writeInputSpec(buf, ugen, offset, constants, controls)
{
	/*
	var isNum = typeof ugen === "number";
	
	if(isNum)
	{
		buf.writeInt32BE(-1, offset);
		offset += 4;
		buf.writeInt32BE(constants[ugen], offset);
	}

	else if(ugen instanceof _ControlName)
	{
		buf.writeInt32BE(0, offset); // The control ugen is always in the 0 index
		offset += 4;
		buf.writeInt32BE(controls[ugen.name], offset);
	}

	else
	{
		buf.writeInt32BE(ugen.synthIndex, offset);
		offset += 4;
		buf.writeInt32BE(ugen.outputIndex, offset);
	}

	return offset + 4;*/

	return ugen.writeInputSpec(buf, offset, constants, controls);
}

//////////////////////////////////////////////
//// Write output spec protoype inheritance
//////////////////////////////////////////////


UGen.prototype.writeOutputSpec = function(buf, offset, constants, controls)
{
	for(var i = 0; i < this.numOutputs; ++i)
	{
		buf.writeInt8(this.rate, offset);
		++offset;
	}

	return offset;
}

MultiOutUGen.prototype.writeOutputSpec = function(buf, offset, constants, controls)
{
	for(var i = 0; i < this.numOutputs; ++i)
	{
		offset = this.channels[i].writeOutputSpec(buf, offset, constants, controls);
	}

	return offset;
}

function _writeUGenBytes(buf, ugen, offset, constants, controls)
{
	if(!ugen.addToSynth) // don't write proxies
		return offset;
	
	offset = _pstring(buf, ugen.name, offset);
	buf.writeInt8(ugen.rate, offset);
	offset += 1;
	buf.writeInt32BE(ugen.numInputs, offset);
	offset += 4;
	buf.writeInt32BE(ugen.numOutputs, offset);
	offset += 4;
	buf.writeInt16BE(ugen.specialIndex, offset);
	offset += 2;
	
	for(var i = 0; i < ugen.inputs.length; ++i)
	{
		offset = _writeInputSpec(buf, ugen.inputs[i], offset, constants, controls);
	}

	/*
	for(var i = 0; i < ugen.numOutputs; ++i)
	{
		buf.writeInt8(ugen.rate, offset);
		++offset;
	}

	return offset;*/
	
	return ugen.writeOutputSpec(buf, offset, constants, controls);
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SynthDef
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function _pstring(buf, string, offset)
{
	buf.writeInt8(string.length, offset);
	offset += 1;
	buf.write(string, offset, string.length);

	return offset + string.length;
}

function _ugenToDefList(ugen, constants, controls)
{
	if(ugen instanceof Array) // Multichannel support
	{
		var defList = [];

		for(var i = 0; i < ugen.length; ++i)
		{
			defList = defList.concat(_ugenToDefList(ugen[i], constants, controls));
		}

		return defList;
	}
	
	else if(typeof ugen === "number")
	{
		if(!constants.hasOwnProperty(ugen))
		{
			constants[ugen] = constants.numConstants;
			constants.arr.push(ugen);
			constants.numConstants += 1;
		}

		return [];
	}

	else if(ugen instanceof _ControlName)
	{
		if(!controls.hasOwnProperty(ugen.name))
		{
			controls[ugen.name] = ugen.controlIndex;
			controls.arr.push(ugen);
			controls.numControls += 1;
		}

		return [];
	}
	   
	var defList = [ugen];
	
	for(var i = ugen.inputs.length - 1; i >= 0; --i)
	{
		defList = defList.concat(_ugenToDefList(ugen.inputs[i], constants, controls));
	}

	if(ugen.isLocalBuf) // LocalBuf support
	{
		if(!constants.hasOwnProperty("maxLocalBufs"))
		   constants["maxLocalBufs"] = _MaxLocalBufs();

		constants["maxLocalBufs"].inputs[0] += 1; // increment maxLocalBufs
		ugen.inputs = ugen.inputs.concat([constants["maxLocalBufs"]]);
		ugen.numInputs += 1;
	}
	
	return defList;
}

function _writeDef(buf, children, offset, constants, controls)
{
	for(var i = 0; i < children.length; ++i)
	{
		offset = _writeUGenBytes(buf, children[i], offset, constants, controls);
	}

	return offset;
}

function _removeDuplicateChildren(children)
{
	for(var i = 0; i < children.length; ++i)
	{
		var child = children[i];

		if(child._collected)
			children[i] = null;
		else
			child._collected = true;
	}

	return children.filter(function(e){ return e != null });
}

// Compile a Lich synth to a SuperCollider synth definition. This requires a very specific binary format.
function _synthDef(name, def)
{
	var offset = 4; // default offset to for becase we always start with the same header
	var numBytes = 11 + name.length;

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Initialize controls, constants, and children
	
	var controls = { numControls: 0, arr: [] };
	var constants = { numConstants: 1, arr: [0], 0:0 }; // We always need the zero constant for controls
	var children = _ugenToDefList(def, constants, controls).reverse();
	var numChildren = 0;
	
	children = _removeDuplicateChildren(children);

	if(constants.hasOwnProperty("maxLocalBufs")) // LocalBuf support
	{
		var maxLocalBufs = constants["maxLocalBufs"];
		var numMaxLocalBufs = maxLocalBufs.inputs[0];
		
		children = [maxLocalBufs].concat(children);

		if(!constants.hasOwnProperty(numMaxLocalBufs))
		{
			constants[numMaxLocalBufs] = constants.numConstants;
			constants.arr.push(numMaxLocalBufs);
			constants.numConstants += 1;
		}
	}
	
	if(controls.numControls > 0)
		children = [_Control(controls.numControls)].concat(children);

	for(var i = 0; i < children.length; ++i)
	{
		if(children[i].synthIndex == null)
		{
			children[i].setSynthIndex(numChildren++);
		}
	}
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Header

	var buf = new Buffer(1024 + (numChildren * 32));
	buf.write("SCgf", 0, 4); // SuperCollider synth definition file header
	buf.writeInt32BE(2, offset); // SC synthdef version number
	offset += 4;
	buf.writeInt16BE(1, offset); // Number of SynthDefinitions
	offset += 2;
	offset = _pstring(buf, name, offset); // Name of the SynthDef

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Constants
	
	buf.writeInt32BE(constants.numConstants, offset);
	offset += 4;
	
	for(var i = 0; i < constants.arr.length; ++i) // Write the constant values
	{
		buf.writeFloatBE(constants.arr[i], offset);
		offset += 4;
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Controls

	buf.writeInt32BE(controls.numControls, offset); // NUMBER OF Arguments/Parameters/Controls.
	offset += 4;

	for(var i = 0; i < controls.numControls; ++i) // Write the default values for all the controls. In Lich they're always just 0.
	{
		buf.writeFloatBE(0, offset);
		offset += 4;
	}
	
	buf.writeInt32BE(controls.numControls, offset); // NUMBER OF Arguments/Parameters/Controls NAMES. This will always be the same in Lich
	offset += 4;

	for(var i = 0; i < controls.numControls; ++i) // Write the names of all the controls
	{
		offset = _pstring(buf, controls.arr[i].name, offset); // name of the controls
 		buf.writeInt32BE(i, offset); // index of the control value, in Lich this will be the same for the name as the initial value above
		offset += 4;
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// UGens
	
	buf.writeInt32BE(numChildren, offset); // Number of UGens
	offset += 4;
	
	offset = _writeDef(buf, children, offset, constants, controls); // Compile the ugen list

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Variants
	
	buf.writeInt16BE(0, offset); // number of variants. ZERO until variants are supported
	offset += 2;

	//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// File and OSC
	
	// buf = buf.slice(0, offset);
	s.sendMsg('/d_recv', [buf.slice(0, offset)]);

    	/*
    	var path = "/tmp/"+name+".scsyndef";
	
	fs.writeFile(
		path,
		buf,
		function(err) {
			if(err) {
				console.log(err);
			} else {
				s.sendMsg('/d_load', [path]);
			}
		}
	);*/
	
	return Lich.VM.Void;
}

function stop(object)
{
	if(object instanceof Synth)
	{
		object.freeNode();
	}

	else if(object._lichType == IMPSTREAM || object._lichType == SOLOSTREAM)
	{
		object.stop();
	}
	
	else
	   throw new Error("stop can only be called on Synths and Patterns");
	
	return Lich.VM.Void;
}

function freeAll()
{
	//s.sendMsg('/clearSched', []);
    //s.sendMsg('/g_freeAll', [0]);
	//Lich.scheduler.freeScheduledEvents();
	_setupSC();
	//s.sendMsg("/g_new", [1, 0, 0]); // default group
}

// Redefine Lich.compileSynthDef to use SuperCollider behavior instead of web audio
Lich.compileSynthDef = function(ast)
{
	//ast.astType = "decl-fun";
	//ast.noCollapse = true;
	// var res = Lich.compileAST(ast)+";Soliton.synthDefs[\""+ast.ident.id+"\"]="+ast.ident.id;
	var def = Lich.compileAST(ast.rhs);
	var localArgNames = [];
	var localArgs = [];
	var numArgs = 0;

	for(var i = 0; i < ast.args.length; ++i)
	{
		if(ast.args[i].astType == "varname")
		{
			var argName = ast.args[i].id;
			
			if(localArgNames.indexOf(argName) != -1)
			{
				throw new Error("Duplicate definition for argument: " + argName + " in synth definition " + ast.ident.id);
			}

			else
			{
				localArgNames.push("var " + argName + " = new _ControlName(\""+argName+"\","+numArgs+");");
				localArgs.push(argName);
				numArgs++;
			}
		}
	}

	var res;
	
	if(numArgs == 0)
		res = "_synthDef(\""+ast.ident.id+"\","+def+");";
	else
		res = "_synthDef(\""+ast.ident.id+"\",(function(){"+localArgNames.join("")+"return "+def+"})());";

	var argsAndIndexes = [];

	for(var i = 0; i < localArgs.length; ++i)
	{
		argsAndIndexes.push(i);
		argsAndIndexes.push(localArgs[i]);
	}
	
	res += ast.ident.id + "=function("+localArgs.join(",")+"){return new Synth(\""+ast.ident.id+"\",["+argsAndIndexes.join(",")+"]);};";
	res += "Soliton.synthDefs[\""+ast.ident.id+"\"]="+ast.ident.id;
	
	if(Lich.parseType !== "library")
		res += ";Lich.VM.Print("+ast.ident.id+");";

	return res;
}
