/* 
    Lich.js - JavaScript audio/visual live coding language
    Copyright (C) 2012 Chad McKinney

	http://chadmckinneyaudio.com/
	seppukuzombie@gmail.com

	All rights reserved.
	
	Licensed under the Modified BSD License

	Redistribution and use in source and binary forms, with or without
	modification, are permitted provided that the following conditions are met:
	    * Redistributions of source code must retain the above copyright
	      notice, this list of conditions and the following disclaimer.
	    * Redistributions in binary form must reproduce the above copyright
	      notice, this list of conditions and the following disclaimer in the
	      documentation and/or other materials provided with the distribution.
	    * Neither the name of the <organization> nor the
	      names of its contributors may be used to endorse or promote products
	      derived from this software without specific prior written permission.

	THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
	ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
	WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
	DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
	DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
	(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
	LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
	ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
	(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
	SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Lich Virtual Machine
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function lichVirtualMachine() {
	
	// Methods
	this.isReserved = function(objectName)
	{
		if(this.namespace.hasOwnProperty(objectName))
		{
			return this.namespace[objectName].reserved;
		}
		
		else
		{
			return false;
		}
	}
	
	this.isNil = function(objectName)
	{
		return !this.namespace.hasOwnProperty(objectName);
	}
	
	this.addVar = function(objectName, object)
	{
		if(!this.isReserved(objectName))
		{
			this.namespace[objectName] = object;
			this.namespace[objectName].reserved = false;
		}
		
		else
		{
			post("VARIABLE " + objectName + " IS RESERVED. DON'T BE A FOOL.")
		}
	}
	
	this.reserveVar = function(objectName, object)
	{
		this.namespace[objectName] = object;
		this.namespace[objectName].reserved = true;
	}
	
	this.get = function(objectName)
	{
		if(!this.isNil(objectName))
		{
			return this.namespace[objectName];
		}
		
		else
		{
			return 0;
		}
	}
	
	this.push = function(object)
	{
		return this.stack.push(object);
	}
	
	this.pop = function()
	{
		return this.stack.pop();
	}
	
	this.interpretStack = function()
	{		
		while(this.stack.length > 0)
		{
			var pointer = this.stack.pop();
			var value = pointer.value();
			this.state = value;
		}
	}
	
	this.clearStack = function()
	{
		post("DOOM!");
		while(this.stack.length > 0)
		{
			this.stack.pop();
		}
		
		return undefined;
	}
	
	this.printState = function()
	{
		if(this.state.constructor == Array) // Print Array
		{
			post(arrayToPrintString(this.state));
		}
		
		else if(this.state == '__LICH_PRINT_VALUE__') // Ignore the print value, it prints on it's own
		{
			
		}
		
		 // If a Lich Object
		else if(this.state.constructor == LichFunction || this.state.constructor == LichPrimitive || this.state.constructor == LichSignal)
		{
			if(this.state.type() == "Signal")
			{
				var printString = arrayToPrintString(this.state.points.value());
				printString = printString.concat(" ").concat(this.state.shape);
				post(printString);
			}
			else
			{
				post(this.state.type());
			}
		}
		
		else
		{
			post(this.state);
		}
	}
	
	// Member variables
	this.stack = new Array();
	this.state = 0;
	this.namespace = {};
};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Helper Functions
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function stringToAscii(string)
{
	var asciiArray = new Array();
	
	for(var i = 0; i < string.length; ++i)
	{
		asciiArray.push(string[i].charCodeAt(0));
	}
	
	return asciiArray;
}

function asciiToString(asciiArray)
{
	var string = "";
	
	for(var i = 0; i < asciiArray.length; ++i)
	{
		string = string.concat(String.fromCharCode(asciiArray[i] % 256));
	}
	
	return string;
}

function numberArraySubtract(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] - operand;
	}
	
	return array;
}

function numberArraySubtractArray(array, operand)
{
		
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] - operand[i % operand.length];
	}
	
	return array;
}

function numberArrayDivide(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = operand / array[i];
	}
	
	return array;
}

function numberArrayDividedBy(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] / operand;
	}
	
	return array;
}

function numberArrayDivideArray(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = operand[i % operand.length] / array[i];
	}
	
	return array;
}

function numberArrayDividedByArray(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] / operand[i % operand.length];
	}
	
	return array;
}

function numberArrayMultiply(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] * operand;
	}
	
	return array;
}

function numberArrayMultiplyArray(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] * operand[i % operand.length];
	}
	
	return array;
}

function numberArrayModulus(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] % operand;
	}
	
	return array;
}

function numberArrayModulusArray(array, operand)
{
	for(var i = 0; i < array.length; ++i)
	{
		array[i] = array[i] % operand[i % operand.length];
	}
	
	return array;
}

function arrayToPrintString(array) // Creates a printable string which represents the contents of an array. Supports multidimensional arrays.
{
	var printString = "[";

	for(var i = 0; i < array.length; ++i)
	{
		if(array[i].constructor == Array)
		{
			printString = printString.concat(arrayToPrintString(array[i]));
		}
		
		else if(array[i].constructor == LichFunction || array[i].constructor == LichPrimitive || array[i].constructor == LichArray 
			|| array[i].constructor == LichFloat || array[i].constructor == LichString || array[i].constructor == LichSignal
			|| array[i].constructor == LichVariable) // Lich Object
		{			
			switch(array[i].type())
			{
			case 'Array':
				printString = printString.concat(arrayToPrintString(array[i].arrayVar));
				break;
				
			case 'String':
				printString = printString.concat(array[i].value());
				break;
				
			case 'Float':
				printString = printString.concat(array[i].value());
				break;

			case 'Signal':
				printString = printString.concat(arrayToPrintString(array[i].points.value()));
				printString = printString.concat(" ").concat(array[i].shape);
				break;

			case 'Variable':
				printString = printString.concat(array[i].object.type());
				break;
				
			default:
				printString = printString.concat(array[i].type());
			}
		}
		
		else
		{
			printString = printString.concat(array[i]);
		}
		
		if(i < array.length - 1)
		{
			printString = printString.concat(", ");
		}
	}
	
	printString = printString.concat("]");
	return printString;
}

function lerp(value1, value2, amount)
{
	return (value2 - value1) * amount + value1;
}

function exerp(value1, value2, amount)
{
	return Math.pow(value2 / value1, amount) * value1;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Lich Classes 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// All classes must have the following methods value, call, type, length, at, insert, add, subtract, multiply, divide, modulus, equivalent, 
// inequivalent, greater than, less than, greater than equal, and less than equal

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichString
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function LichString(_stringVar) {
	
	// Public methods
	this.value = function()
	{
		return this.stringVar;
	}
	
	this.call = function()
	{
		return this.value();
	}
	
	this.type = function()
	{
		return 'String';
	}
	
	this.length = function()
	{
		return this.stringVar.length;
	}
	
	this.insert = function(index, value)
	{
		if(index.value() == 0)
		{
			post("Insert 0");
			this.stringVar = value.value().concat(this.stringVar.substring(1, this.stringVar.length));
			LichVM.push(this);
			return this;
		}
		
		else if(index.value() >= this.stringVar.length)
		{
			this.stringVar = this.stringVar.concat(value.value());
			LichVM.push(this);
			return this;
		}
		
		else
		{
			var sub1 = this.stringVar.substring(0, index.value() - 1);
			var sub2 = this.stringVar.substring(index.value(), this.stringVar.length);
			this.stringVar = sub1.concat(value.value()).concat(sub2);
			LichVM.push(this);
			return this;
		}
	}
	
	this.at = function(index)
	{
		LichVM.push(new LichString(this.stringVar[index % this.stringVar.length]));
		return this.stringVar[index % this.stringVar.length];
	}
	
	
	this.add = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var result = new LichString(this.stringVar + object.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			var result = new LichString(this.stringVar + object.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.add(object.call());
			break;
			
		case 'Primitive':
			return this.add(object.call());
			break;
			
		case 'Array':
			var objArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.add(objArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.add(object.object);
			break;

		case 'Signal':

			for(var i = 0; i < object.points.length(); ++i)
			{
				this.add(object.points.arrayVar[i].back());
				var newString = LichVM.pop(); // Pop the results off the stack
				this.stringVar = newString.stringVar; // Reassign the results
			}

			LichVM.push(this);
			return this.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.subtract = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var result = new LichString(
							asciiToString(
								numberArraySubtractArray(stringToAscii(this.stringVar), stringToAscii(object.value()))
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			var resultString = this.stringVar;
			var result;
			resultString = resultString.substring(0, Math.max(0, resultString.length - object.value()));
			result = new LichString(resultString);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.subtract(object.call());
			break;
			
		case 'Primitive':
			return this.subtract(object.call());
			break;
			
		case 'Array':
			var objArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.subtract(objArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.subtract(object.object);
			break;

		case 'Signal':

			for(var i = 0; i < object.points.length(); ++i)
			{
				this.subtract(object.points.arrayVar[i].back());
				var newString = LichVM.pop(); // Pop the results off the stack
				this.stringVar = newString.stringVar; // Reassign the results
			}

			LichVM.push(this);
			return this.value();
			break;
		
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.divide = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var result = new LichString(
							asciiToString(
								numberArrayDivideArray(stringToAscii(object.value()), stringToAscii(this.value()))
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			var resultString = this.stringVar;
			var result;
			resultString = resultString.substring(0, Math.max(0, resultString.length / object.value()));
			result = new LichString(resultString);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.divide(object.call());
			break;
			
		case 'Primitive':
			return this.divide(object.call());
			break;
			
		case 'Array':
			var objArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.divide(objArray[i]); // Pushes the result onto the stack;
				result.push(LichVM.pop()); // Pop it back off the stack and store it in our array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.divide(object.object);
			break;

		case 'Signal':

			for(var i = 0; i < object.points.length(); ++i)
			{
				this.divide(object.points.arrayVar[i].back());
				var newString = LichVM.pop(); // Pop the results off the stack
				this.stringVar = newString.stringVar; // Reassign the results
			}

			LichVM.push(this);
			return this.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
		}
	}
	
	this.multiply = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var result = new LichString(
							asciiToString(
								numberArrayMultiplyArray(stringToAscii(this.stringVar), stringToAscii(object.value()))
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			var resultString = "";
			var result;
			var length = this.stringVar.length * object.value();
			
			for(var i = 0; i < length; ++i)
			{
				resultString = resultString.concat(this.stringVar[i % this.stringVar.length]);
			}
			
			result = new LichString(resultString);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.multiply(object.call());
			break;
			
		case 'Primitive':
			return this.multiply(object.call());
			break;
			
		case 'Array':
			var objArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.multiply(objArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.multiply(object.object);
			break;

		case 'Signal':

			for(var i = 0; i < object.points.length(); ++i)
			{
				this.multiply(object.points.arrayVar[i].back());
				var newString = LichVM.pop(); // Pop the results off the stack
				this.stringVar = newString.stringVar; // Reassign the results
			}

			LichVM.push(this);
			return this.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
		}
	}
	
	this.modulus = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var result = new LichString(
							asciiToString(
								numberArrayModulusArray(stringToAscii(this.stringVar), stringToAscii(object.value()))
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			var result = new LichString(
							asciiToString(
								numberArrayModulus(stringToAscii(this.stringVar), object.value())
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.modulus(object.call());
			break;
			
		case 'Primitive':
			return this.modulus(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.modulus(objectArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result back off the stack and store in our array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.modulus(object.object);
			break;

		case 'Signal':

			for(var i = 0; i < object.points.length(); ++i)
			{
				this.modulus(object.points.arrayVar[i].back());
				var newString = LichVM.pop(); // Pop the results off the stack
				this.stringVar = newString.stringVar; // Reassign the results
			}

			LichVM.push(this);
			return this.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
		}
	}
	
	this.equivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var bool = 0;
			var result;
			
			if(this.stringVar == object.value())
			{
				bool = 1;
			}
			
			result = new LichFloat(bool);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.equivalent(object.call());
			break;
			
		case 'Primitive':
			return this.equivalent(object.call());
			break;
			
		case 'Array':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Variable':
			return this.equivalent(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
		}
	}
	
	this.inequivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var bool = 0;
			var result;
			
			if(this.stringVar != object.value())
			{
				bool = 1;
			}
			
			result = new LichFloat(bool);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			result = new LichFloat(1);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.inequivalent(object.call());
			break;
			
		case 'Primitive':
			return this.inequivalent(object.call());
			break;
			
		case 'Array':
			result = new LichFloat(1);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Variable':
			return this.inequivalent(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		default:
			LichVM.push(new LichFloat(1));
			return 0;
		}
	}
	
	this.greaterThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var bool = 0;
			var result;
			
			if(this.stringVar.length > object.value().length)
			{
				bool = 1;
			}
			
			result = new LichFloat(bool);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.greaterThan(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThan(object.call());
			break;
			
		case 'Array':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Variable':
			return this.greaterThan(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
		}
	}
	
	this.lessThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var bool = 0;
			var result;
			
			if(this.stringVar.length < object.value().length)
			{
				bool = 1;
			}
			
			result = new LichFloat(bool);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.lessThan(object.call());
			break;
			
		case 'Primitive':
			return this.lessThan(object.call());
			break;
			
		case 'Array':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Variable':
			return this.lessThan(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var bool = 0;
			var result;
			
			if(this.stringVar.length >= object.value().length)
			{
				bool = 1;
			}
			
			result = new LichFloat(bool);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Array':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Variable':
			return this.greaterThanEqual(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
		}
	}
	
	this.lessThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var bool = 0;
			var result;
			
			if(this.stringVar.length <= object.value().length)
			{
				bool = 1;
			}
			
			result = new LichFloat(bool);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Array':
			result = new LichFloat(0);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Variable':
			return this.lessThanEqual(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
		}
	}
	
	// Member vars
	this.stringVar = _stringVar;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichFloat
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function LichFloat(_floatVar) {
		
	// Public methods
	this.value = function()
	{
		return this.floatVar;
	}
	
	this.call = function()
	{
		return this.value();
	}
	
	this.type = function()
	{
		return 'Float';
	}
	
	this.length = function()
	{
		return 1;
	}
	
	this.insert = function(index, value)
	{
		if(value.type() == 'Float')
		{
			this.floatVar = value.value();
		}
		
		else
		{
			LichVM.push(this);
			return this;
		}
	}
	
	this.at = function(index)
	{
		LichVM.push(new LichFloat(this.floatVar));
		return this.floatVar;
	}
	
	
	this.add = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.add(this);
			break;
			
		case 'Float':
			var result = new LichFloat(this.value() + object.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.add(object.call());
			break;
			
		case 'Primitive':
			return this.add(object.call());
			break;
			
		case 'Array':
			return object.add(this);
			break;
			
		case 'Variable':
			return this.add(object.object);
			break;

		case 'Signal':
			return object.add(this);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.subtract = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.add(new LichFloat(this.value() * -1));
			break;
			
		case 'Float':
			var result = new LichFloat(this.value() - object.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.subtract(object.call());
			break;
			
		case 'Primitive':
			return this.subtract(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.subtract(objectArray[i]); // Pushes the result onto the stack
				result.push(LichVM.pop()); // Pop it back off the stack and store it in our array
			}
		
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.subtract(object.object);
			break;

		case 'Signal':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < object.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(this.value() - object.points.arrayVar[i].back().value());
				newPoint.push(object.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, object.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.divide = function(object)
	{
		switch(object.type())
		{	
		case 'String':
			var result = new LichString(
							asciiToString(
								numberArrayDividedBy(stringToAscii(object.value()), this.value())
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Float':
			var result = new LichFloat(object.value() / this.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.divide(object.call());
			break;
			
		case 'Primitive':
			return this.divide(object.call());
			break;
			
		case 'Array':
		
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < object.length(); ++i)
			{
				this.divide(objectArray[i]); // Pushes the result onto the stack
				result.push(LichVM.pop()); // Pop it back off the stack and store it in our array
			}
		
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.divide(object.object);
			break;

		case 'Signal':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < object.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(object.points.arrayVar[i].back().value() / this.value());
				newPoint.push(object.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, object.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.multiply = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.multiply(this);
			break;
			
		case 'Float':
			var result = new LichFloat(this.value() * object.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.multiply(object.call());
			break;
			
		case 'Primitive':
			return this.multiply(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.multiply(objectArray[i]); // Pushes result onto the stack;
				result.push(LichVM.pop()); // Pops result off the stack and pushes it into the result array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			this.multiply(object.object);
			break;

		case 'Signal':
			return object.multiply(this);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.modulus = function(object)
	{
		switch(object.type())
		{
		case 'String':
		
			var numberArray = new Array();
			
			for(var i = 0; i < object.length(); ++i)
			{
				numberArray.push(this.floatVar);
			}
		
			var result = new LichString(
							asciiToString(
								numberArrayModulusArray(numberArray, stringToAscii(object.value()))
							)
			);
			
			LichVM.push(result);
			return result.value();
			break;
		
		case 'Float':
			var result = new LichFloat(this.value() % object.value());
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.modulus(object.call());
			break;
			
		case 'Primitive':
			return this.modulus(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.modulus(objectArray[i]); // Pushes result onto the stack;
				result.push(LichVM.pop()); // Pops result off the stack and pushes it into the result array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.modulus(object.object);
			break;

		case 'Signal':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < object.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(this.value() % object.points.arrayVar[i].back().value());
				newPoint.push(object.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, object.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.equivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			var bool = 0;
			
			if(this.value() == object.value())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		case 'Function':
			return this.equivalent(object.call());
			break;
			
		case 'Primitive':
			return this.equivalent(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.equivalent(object.object);
			break;
			
		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;

		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.inequivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		case 'Float':
			var bool = 0;
			
			if(this.value() != object.value())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		case 'Function':
			return this.inequivalent(object.call());
			break;
			
		case 'Primitive':
			return this.inequivalent(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		case 'Variable':
			return this.inequivalent(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		default:
			LichVM.push(new LichFloat(1));
			return 1;
			break;
		}
	}
	
	this.greaterThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			var bool = 0;
			
			if(this.value() > object.value())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		case 'Function':
			return this.greaterThan(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThan(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.greaterThan(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.lessThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			var bool = 0;
			
			if(this.value() < object.value())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		case 'Function':
			return this.lessThan(object.call());
			break;
			
		case 'Primitive':
			return this.lessThan(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.lessThan(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			var bool = 0;
			
			if(this.value() >= object.value())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		case 'Function':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.greaterThanEqual(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.lessThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			var bool = 0;
			
			if(this.value() <= object.value())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		case 'Function':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.lessThanEqual(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	// Member vars
	this.floatVar = _floatVar;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichArray
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function LichArray(_arrayVar) {
		
	// Public methods
	this.value = function()
	{
		return this.arrayVar;
	}
	
	this.call = function()
	{
		return this.value();
	}
	
	this.type = function()
	{
		return 'Array';
	}
	
	this.length = function()
	{
		return this.arrayVar.length;
	}
	
	this.insert = function(index, value)
	{
		if(index.value() >= this.length())
		{
			this.push(value.value());
		}
		
		else
		{
			this.arrayVar[index.value()] = value.value();
		}
		
		LichVM.push(this);
		return this;
	}
	
	this.at = function(index)
	{
		var object = this.arrayVar[index % this.arrayVar.length];
		LichVM.push(object);
		return object;
	}
	
	this.front = function()
	{
		return this.arrayVar[0];
	}
	
	this.back = function()
	{
		return this.arrayVar[this.arrayVar.length - 1];
	}
	
	this.push = function(object)
	{
		this.arrayVar.push(object);
	}
	
	this.add = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.add(this);
			break;
			
		case 'Float':
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < this.arrayVar.length; ++i)
			{
				this.arrayVar[i].add(object); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Function':
			return this.add(object.call());
			break;
			
		case 'Primitive':
			return this.add(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].add(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.add(object.object);
			break;

		case 'Signal':
			return object.add(this);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.subtract = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.subtract(this);
			break;
			
		case 'Float':
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < this.arrayVar.length; ++i)
			{
				this.arrayVar[i].subtract(object); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Function':
			return this.subtract(object.call());
			break;
			
		case 'Primitive':
			return this.subtract(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].subtract(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.subtract(object.object);
			break;

		case 'Signal':
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < this.arrayVar.length; ++i)
			{
				this.arrayVar[i].subtract(object); // Pushes result onto the stack;
				result.push(LichVM.pop()); // Pops result off the stack and pushes it into the result array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.divide = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.divide(this);
			break;
			
		case 'Float':
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < this.arrayVar.length; ++i)
			{
				this.arrayVar[i].divide(object); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Function':
			return this.divide(object.call());
			break;
			
		case 'Primitive':
			return this.divide(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].divide(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.divide(object.object);
			break;

		case 'Signal':
			var objectArray = this.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				objectArray[i].divide(object); // Pushes result onto the stack;
				result.push(LichVM.pop()); // Pops result off the stack and pushes it into the result array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.multiply = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.multiply(this);
			break;
			
		case 'Float':
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < this.arrayVar.length; ++i)
			{
				this.arrayVar[i].multiply(object); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Function':
			return this.multiply(object.call());
			break;
			
		case 'Primitive':
			return this.multiply(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].multiply(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.add(object.object);
			break;

		case 'Signal':
			return object.multiply(this);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.modulus = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.modulus(this);
			break;
			
		case 'Float':
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < this.arrayVar.length; ++i)
			{
				this.arrayVar[i].modulus(object); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Function':
			return this.modulus(object.call());
			break;
			
		case 'Primitive':
			return this.modulus(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].modulus(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.modulus(object.object);
			break;

		case 'Signal':
			var objectArray = this.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				objectArray[i].modulus(object); // Pushes result onto the stack;
				result.push(LichVM.pop()); // Pops result off the stack and pushes it into the result array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.equivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.equivalent(object.call());
			break;
			
		case 'Primitive':
			return this.equivalent(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length, bool;
			length = this.arrayVar.length;
			bool = 1;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				var tempResult;
				this.arrayVar[i % this.arrayVar.length].equivalent(objectArray[i % objectArray.length]); // Pushes result onto the stack
				tempResult = LichVM.pop(); // Pop the result off the stack
				if(tempResult.value() == 0) // If only one isn't equivalent, we can stop
				{
					bool = 0;
					break;
				}
			}
			
			lichResult = new LichFloat(bool);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.equivalent(object.call());
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.inequivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(1));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(1));
			return 0;
			break;
			
		case 'Function':
			return this.inequivalent(object.call());
			break;
			
		case 'Primitive':
			return this.inequivalent(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length, bool;
			length = this.arrayVar.length;
			bool = 0;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				var tempResult;
				this.arrayVar[i % this.arrayVar.length].inequivalent(objectArray[i % objectArray.length]); // Pushes result onto the stack
				tempResult = LichVM.pop(); // Pop the result off the stack
				if(tempResult.value() == 1) // If only one is inequivalent, we can stop
				{
					bool = 1;
					break;
				}
			}
			
			lichResult = new LichFloat(bool);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.inequivalent(object.call());
			break;

		case 'Signal':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		default:
			LichVM.push(new LichFloat(1));
			return 1;
			break;
		}
	}
	
	this.greaterThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.greaterThan(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThan(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].greaterThan(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.greaterThan(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.lessThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.lessThan(object.call());
			break;
			
		case 'Primitive':
			return this.lessThan(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].lessThan(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.lessThan(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].greaterThanEqual(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.greaterThanEqual(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.lessThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult, length;
			length = this.arrayVar.length;
			
			if(objectArray.length > length)
			{
				length = objectArray.length;
			}
			
			for(var i = 0; i < length; ++i)
			{
				this.arrayVar[i % this.arrayVar.length].lessThanEqual(objectArray[i % objectArray.length]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.lessThanEqual(object.object);
			break;

		case 'Signal':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	// Member vars
	this.arrayVar = _arrayVar;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichPrimitive
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Primitives take a pointer to the predefined primitive function as well as the number of arguments they expect
function LichPrimitive(_primitive, _numArgs) {
	
	// Public methods
	this.call = function()
	{	
		if(LichVM.stack.length < this.numArgs) // If there aren't enough arguments, we push ourselves onto the stack instead for assignment
		{
			return this;
		}
		
		else
		{
			var argArray = new Array();
			
			// Here we pop arguments from the top of the stack and populate the arg argArray
			for(var i = 0; i < this.numArgs && LichVM.stack.length > 0; ++i)
			{
				var arg = LichVM.pop();
				
				// If the argument is a primitive or function, recursively call function values
				if(arg.type() == 'Primitive')
				{
					arg.call();
					argArray.push(LichVM.pop());
				}

				else
				{
					argArray.push(arg); // Any other types (Float, Array) simply push into the arg array
				}
			}

			return this.primitive(argArray);
		}
	}
	
	this.value = function()
	{
		return this.call();
	}
	
	this.type = function()
	{
		return 'Primitive';
	}
	
	this.length = function()
	{
		return 0;
	}
	
	this.insert = function(index, value)
	{
		return this.value().insert(index, value);
	}
	
	this.at = function(index)
	{
		return this.value().at(index);
	}
	
	this.add = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().add(object);
		}
	}
	
	this.subtract = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().subtract(object);
		}
	}
	
	this.divide = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().divide(object);
		}
	}
	
	this.multiply = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().multiply(object);
		}
	}
	
	this.modulus = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().modulus(object);
		}
	}
	
	this.equivalent = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().equivalent(object);
		}
	}
	
	this.inequivalent = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(1));
			return 1;
		}
		
		else
		{
			return this.call().inequivalent(object);
		}
	}
	
	this.greaterThan = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().greaterThan(object);
		}
	}
	
	this.lessThan = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().lessThan(object);
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().greaterThanEqual(object);
		}
	}
	
	this.lessThanEqual = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().lessThanEqual(object);
		}
	}
	
	// Member vars
	this.primitive = _primitive;
	this.numArgs = _numArgs;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichFunction
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Lich Functions are defined in the Lich language. They take an array of names and an array of objects that are called when the function is called
function LichFunction(_argNames, _functionObjects) {
	
	this.collectArgObjects = function()
	{
		delete this.argObjects;
		this.argObjects = {}; // Redefine as a clean object
		
		for(var i = 0; i < _argNames.length; ++i)
		{
			this.argObjects[this.argNames[i]] = LichVM.pop(); // One by collect arguments from the stack
		}
	}
	
	this.value = function()
	{
		return this;
	}
	
	this.call = function()
	{		
		if(LichVM.stack.length < this.argNames.length)
		{
			return this;
		}
		
		else
		{
			this.collectArgObjects(); // Collect 

			for(var i = 0; i < this.functionObjects.length; ++i)
			{
				var currentObject = this.functionObjects[i];

				if(currentObject.type() == 'Variable') 
				{
					// If the current object is a reference to a previously collected argument
					if(this.argObjects.hasOwnProperty(currentObject.objectName)) 
					{
						LichVM.push(this.argObjects[currentObject.objectName]); // Use our collected arguments, reference by name
					}

					else // Non argument reference
					{
						LichVM.push(currentObject);
					}
				}

				else // Not a variable
				{
					LichVM.push(currentObject);
				}
			}
			
			return LichVM.pop().value(); // Call the top of the stack
		}
	}
	
	this.type = function()
	{
		return 'Function';
	}
	
	this.length = function()
	{
		return 0;
	}
	
	this.insert = function(index, value)
	{
		return this.call().insert(index, value);
	}
	
	this.at = function(index)
	{
		return this.call().at(index);
	}
	
	
	this.add = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().add(object);
		}
	}
	
	this.subtract = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().subtract(object);
		}
	}
	
	this.divide = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().divide(object);
		}
	}
	
	this.multiply = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().multiply(object);
		}
	}
	
	this.modulus = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.call().modulus(object);
		}
	}
	
	this.equivalent = function(object)
	{
		if(object.type() == 'Function')
		{
			var bool = 0;
			
			if(this.functionVar == object.functionVar)
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool
		}
		
		else if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().equivalent(object);
		}
	}
	
	this.inequivalent = function(object)
	{
		if(object.type() == 'Function')
		{
			var bool = 0;
			
			if(this.functionVar != object.functionVar)
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool
		}
		
		else if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(1));
			return 1;
		}
		
		else
		{
			return this.call().inequivalent(object);
		}
	}
	
	this.greaterThan = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().greaterThan(object);
		}
	}
	
	this.lessThan = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().lessThan(object);
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().greaterThanEqual(object);
		}
	}
	
	this.lessThanEqual = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.call().lessThanEqual(object);
		}
	}
	
	this.argObjects = {};
	this.argNames = _argNames;
	this.functionObjects = _functionObjects;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichVariable
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function LichVariable(_objectName) {
	
	this.undefinedError = function()
	{
		post("ERROR. UNDEFINED VARIABLE: " + this.objectName + ". YOUR WORLD IS A LIE.");
		return LichVM.clearStack();
	}
	
	this.value = function()
	{
		if(this.object == undefined)
		{
			return this.undefinedError();
		}
		
		else
		{
			return this.object.value();
		}
	}
	
	this.call = function()
	{
		if(this.object == undefined)
		{
			return this.undefinedError();
		}
				
		return this.object.call();
	}
	
	this.type = function()
	{	
		return 'Variable';
	}
	
	this.length = function()
	{
		if(this.object == undefined)
		{
			return this.undefinedError();
		}
		
		return this.object.length();
	}
	
	this.insert = function(index, value)
	{
		return this.object.insert(index, value);
	}
	
	this.at = function(index)
	{
		if(this.object == undefined)
		{
			return this.undefinedError();
		}
		
		return this.object.at(index);
	}
	
	this.add = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.object.add(object);
		}
	}
	
	this.subtract = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.object.subtract(object);
		}
	}
	
	this.divide = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.object.divide(object);
		}
	}
	
	this.multiply = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.object.multiply(object);
		}
	}
	
	this.modulus = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(this);
			return this;
		}
		
		else
		{
			return this.object.modulus(object);
		}
	}
	
	this.equivalent = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.object.equivalent(object);
		}
	}
	
	this.inequivalent = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(1));
			return 1;
		}
		
		else
		{
			return this.object.inequivalent(object);
		}
	}
	
	this.greaterThan = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.object.greaterThan(object);
		}
	}
	
	this.lessThan = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.object.lessThan(object);
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.object.greaterThanEqual(object);
		}
	}
	
	this.lessThanEqual = function(object)
	{
		if(object.type() == undefined)
		{
			LichVM.push(new LichFloat(0));
			return 0;
		}
		
		else
		{
			return this.object.lessThanEqual(object);
		}
	}
	
	this.increment = function()
	{
		this.object.add(new LichFloat(1));
		this.assign();
		LichVM.push(this);
		return this.object.value()
	}
	
	this.decrement = function()
	{
		this.object.subtract(new LichFloat(1));
		this.assign();
		LichVM.push(this);
		return this.object.value()
	}
	
	this.assign = function()
	{
		var object = LichVM.pop();
		
		if(object.type() == 'Primitive')
		{	
			object.value();
			this.object = LichVM.pop();
		}
		
		else
		{
			this.object = object;
		}
		
		LichVM.addVar(this.objectName, this);
		return this.objectName;
	}
	
	this.objectName = _objectName;
	this.object;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// LichSignal
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/*

[0] _points: 2D Array of objects containing times and levels. [[0 0] [0.1 1] [1 0]]. Times are absolute!
[1] _shape: 'none', 'linear', 'exponential' supplied as a string

example:
Signal [[0 0] [0.1 1] [1 0]] 'exponential'

*/

function LichSignal(_points, _shape) {
		
	// Public methods
	this.value = function()
	{
		return this;
	}
	
	this.call = function()
	{
		return this.value();
	}
	
	this.type = function()
	{
		return 'Signal';
	}
	
	this.length = function()
	{	
		return this.points.back().front(); // Returns the last time, which is the length of the Signal
	}
	
	this.insert = function(time, level) // Insert a point into the signal using seperate time and level arguments
	{
		if(time.type() == 'Float' && level.type() == 'Float')
		{
			var newPoint = new LichArray(new Array());
			newPoint.push(time);
			newPoint.push(level);
			this.points.push(newPoint);
			// Sort the array according to time
			this.points.arrayVar = this.points.arrayVar.sort(function(a,b){return a.front().value() - b.front().value()}); 
			LichVM.push(this);
			return this;
		}
		
		else
		{
			post("YOU HAVE TO INSERT A FLOATS IN A SIGNAL. MUAHAHAHA DIE FOOL.");
			LichVM.clearStack();
		}
	}
	
	this.at = function(time) // Interpolate the value at any point in time based on our interpolation time
	{
		var interpolatedValue = this.points.front().back().value(); // The first level
		
		if(time > this.points.front().front().value())
		{
			var pointOne = this.points.front();
			var pointTwo = pointOne;
			
			for(var i = 0; i < this.points.length(); ++i)
			{
				if(time == this.points.arrayVar[i].front().value()) // If we have an perfect match, use that for both points
				{
					pointOne = this.points.arrayVar[i];
					pointTwo = pointOne;
					break;
				}
				
				else if(time < this.points.arrayVar[i].front().value()) // Otherwise check to see if we've found the interpolation points
				{
					pointOne = this.points.arrayVar[i - 1];
					pointTwo = this.points.arrayVar[i];
					break;
				}
			}
			
			var timeOne = pointOne.front().value();
			var timeTwo = pointTwo.front().value();
			var amount = 0;
			
			if(timeOne != timeTwo) // If we have two different times
			{	
				amount = (time - timeOne) / (timeTwo - timeOne); // Calculate the interpolation amount based on proximity

				switch(this.shape)
				{
				case 'none':
					interpolatedValue = pointOne.back().value();
					post("InterpolatedValue!: " + interpolatedValue);
					break;

				case 'linear':
					interpolatedValue = lerp(pointOne.back().value(), pointTwo.back().value(), amount);
					break;

				case 'exponential':
					interpolatedValue = exerp(pointOne.back().value(), pointTwo.back().value(), amount);
					break;

				default:
					interpolatedValue = pointOne.back().value();
					break;
				}
			}
			
			else // Otherwise just pick the first one and take it's value
			{
				interpolatedValue = pointOne.back().value();
			}
		}
		
		LichVM.push(new LichFloat(interpolatedValue));
		return interpolatedValue;
	}
	
	this.combine = function(object, operatorFunction) // Used for combining two LichSignals
	{
		var newPoints = new Array();
		
		// Iterate through each LichSignals points array, calling the operator function at each point
		
		for(var i = 0; i < this.points.length(); ++i)
		{
			var thisTime = this.points.arrayVar[i].front().value();
			var newPoint = new LichArray(new Array());
			var objectLevel = object.at(thisTime);
			LichVM.pop(); // pop the results off the stack;
			var level = operatorFunction(this.points.arrayVar[i].back().value(), objectLevel);
			newPoint.push(new LichFloat(thisTime));
			newPoint.push(new LichFloat(level));
			newPoints.push(newPoint);
		}
		
		for(var i = 0; i < object.points.length(); ++i)
		{
			var objectTime = object.points.arrayVar[i].front().value();
			var newPoint = new LichArray(new Array());
			var thisLevel = this.at(objectTime);
			LichVM.pop(); // pop the results off the stack;
			var level = operatorFunction(object.points.arrayVar[i].back().value(), thisLevel);
			newPoint.push(new LichFloat(objectTime));
			newPoint.push(new LichFloat(level));
			newPoints.push(newPoint);
		}
		
		newPoints = newPoints.sort(function(a,b){return a.front().value() - b.front().value()}); // Sort the array according to time
		result = new LichSignal(new LichArray(newPoints), this.shape);
		LichVM.push(result);
		return result.value();
	}
	
	this.addFunction = function(operand0, operand1)
	{
		return operand0 + operand1;
	}
	
	this.subtractFunction = function(operand0, operand1)
	{
		return operand0 - operand1;
	}
	
	this.divideFunction = function(operand0, operand1)
	{
		return operand1 / operand0;
	}
	
	this.multiplyFunction = function(operand0, operand1)
	{
		return operand0 * operand1;
	}
	
	this.modulusFunction = function(operand0, operand1)
	{
		return operand0 % operand1;
	}
	
	this.add = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.add(this);
			break;
			
		case 'Float':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < this.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(this.points.arrayVar[i].back().value() + object.value());
				newPoint.push(this.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, this.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.add(object.call());
			break;
			
		case 'Primitive':
			return this.add(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.add(objectArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.add(object.object);
			break;
			
		case 'Signal':
			return this.combine(object, this.addFunction);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.subtract = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.add(this);
			break;
			
		case 'Float':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < this.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(this.points.arrayVar[i].back().value() - object.value());
				newPoint.push(this.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, this.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.subtract(object.call());
			break;
			
		case 'Primitive':
			return this.subtract(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.subtract(objectArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.subtract(object.object);
			break;
			
		case 'Signal':
			return this.combine(object, this.subtractFunction);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.divide = function(object)
	{
		switch(object.type())
		{	
		case 'String':
			
			for(var i = 0; i < this.points.length(); ++i)
			{

				this.points.arrayVar[i].back().divide(object);
			}
			
			break;
			
		case 'Float':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < this.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(object.value() / this.points.arrayVar[i].back().value());
				newPoint.push(this.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, this.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.divide(object.call());
			break;
			
		case 'Primitive':
			return this.divide(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.divide(objectArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.divide(object.object);
			break;
			
		case 'Signal':
			return this.combine(object, this.divideFunction);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.multiply = function(object)
	{
		switch(object.type())
		{
		case 'String':
			return object.multiply(this);
			break;
			
		case 'Float':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < this.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(this.points.arrayVar[i].back().value() * object.value());
				newPoint.push(this.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, this.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.multiply(object.call());
			break;
			
		case 'Primitive':
			return this.multiply(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.multiply(objectArray[i]); // Pushes result onto the stack
				result.push(LichVM.pop()); // Pop the result off the stack
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			this.multiply(object.object);
			break;
			
		case 'Signal':
			return this.combine(object, this.multiplyFunction);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.modulus = function(object)
	{
		switch(object.type())
		{
		case 'String':
			var newArray = new LichArray(this.points);
			return newArray.modulus(object);
			break;
		
		case 'Float':
			var newPoints = new LichArray(new Array());
			
			for(var i = 0; i < this.points.length(); ++i)
			{
				var newPoint = new LichArray(new Array());
				var level = new LichFloat(this.points.arrayVar[i].back().value() % object.value());
				newPoint.push(this.points.arrayVar[i].front());
				newPoint.push(level);
				newPoints.push(newPoint);
			}
		
			var result = new LichSignal(newPoints, this.shape);
			LichVM.push(result);
			return result.value();
			break;
			
		case 'Function':
			return this.modulus(object.call());
			break;
			
		case 'Primitive':
			return this.modulus(object.call());
			break;
			
		case 'Array':
			var objectArray = object.value();
			var result = new Array();
			var lichResult;
			
			for(var i = 0; i < objectArray.length; ++i)
			{
				this.modulus(objectArray[i]); // Pushes result onto the stack;
				result.push(LichVM.pop()); // Pops result off the stack and pushes it into the result array
			}
			
			lichResult = new LichArray(result);
			LichVM.push(lichResult);
			return lichResult.value();
			break;
			
		case 'Variable':
			return this.modulus(object.object);
			break;
			
		case 'Signal':
			return this.combine(object, this.modulusFunction);
			break;
			
		default:
			LichVM.push(this);
			return this.value();
			break;
		}
	}
	
	this.equivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':			
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.equivalent(object.call());
			break;
			
		case 'Primitive':
			return this.equivalent(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.equivalent(object.object);
			break;
			
		case 'Signal':
			
			var bool = 1;
			
			if(this.points.length() == object.points.length())
			{				
				for(var i = 0; i < this.points.length(); ++i)
				{
					if(this.points.arrayVar[i].front().value() != object.points.arrayVar[i].front().value()
						|| this.points.arrayVar[i].back().value() != object.points.arrayVar[i].back().value())
					{
						bool = 0;
						break;
					}
				}
			}
			
			else
			{
				bool = 0;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.inequivalent = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		case 'Function':
			return this.inequivalent(object.call());
			break;
			
		case 'Primitive':
			return this.inequivalent(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(1));
			return 1;
			break;
			
		case 'Variable':
			return this.inequivalent(object.object);
			break;
			
		case 'Signal':
			var bool = 0;
			
			if(this.points.length() == object.points.length())
			{				
				for(var i = 0; i < this.points.length(); ++i)
				{
					if(this.points.arrayVar[i].front().value() != object.points.arrayVar[i].front().value()
						|| this.points.arrayVar[i].back().value() != object.points.arrayVar[i].back().value())
					{
						bool = 1;
						break;
					}
				}
			}
			
			else
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		default:
			LichVM.push(new LichFloat(1));
			return 1;
			break;
		}
	}
	
	this.greaterThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.greaterThan(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThan(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.greaterThan(object.object);
			break;
			
		case 'Signal':
			var bool = 0;
			
			if(this.length() > object.length())
			{
				bool = 1;
			}
			
			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.lessThan = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.lessThan(object.call());
			break;
			
		case 'Primitive':
			return this.lessThan(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.lessThan(object.object);
			break;
			
		case 'Signal':
			var bool = 0;
			
			if(this.length() < object.length())
			{
				bool = 1;
			}

			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.greaterThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.greaterThanEqual(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.greaterThanEqual(object.object);
			break;
			
		case 'Signal':
			var bool = 0;
			
			if(this.length() >= object.length())
			{
				bool = 1;
			}

			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	this.lessThanEqual = function(object)
	{
		switch(object.type())
		{
		case 'String':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Float':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Function':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Primitive':
			return this.lessThanEqual(object.call());
			break;
			
		case 'Array':
			LichVM.push(new LichFloat(0));
			return 0;
			break;
			
		case 'Variable':
			return this.lessThanEqual(object.object);
			break;
			
		case 'Signal':
			var bool = 0;
			
			if(this.length() <= object.length())
			{
				bool = 1;
			}

			LichVM.push(new LichFloat(bool));
			return bool;
			break;
			
		default:
			LichVM.push(new LichFloat(0));
			return 0;
			break;
		}
	}
	
	// Member vars
	this.points = _points;
	this.points.arrayVar = this.points.arrayVar.sort(function(a,b){return a.front().value() - b.front().value()}); // Sort by time
	this.shape = _shape;
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Lich Primitives: Predefined functions written in javascript
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function compileLich()
{
	LichVM = new lichVirtualMachine();
	
	var add, subtract, multiply, divide, modulus, assign, equivalent, inequivalent, ifControl, println, callFunction, incrementOne, decrementOne;
	var newSignal, doFunction;
	
	function add(argArray)
	{
		return argArray[0].add(argArray[1]);
	}
	
	LichVM.reserveVar('add', new LichPrimitive(add, 2));
	LichVM.reserveVar('+', new LichPrimitive(add, 2));
	
	function subtract(argArray)
	{	
		return argArray[0].subtract(argArray[1]);
	}
	
	
	LichVM.reserveVar('subtract', new LichPrimitive(subtract, 2));
	LichVM.reserveVar('-', new LichPrimitive(subtract, 2));
	
	function multiply(argArray)
	{	
		return argArray[0].multiply(argArray[1]);
	}
	
	
	LichVM.reserveVar('multiply', new LichPrimitive(multiply, 2));
	LichVM.reserveVar('*', new LichPrimitive(multiply, 2));
	
	function divide(argArray)
	{	
		return argArray[1].divide(argArray[0]);
	}
	
	
	LichVM.reserveVar('divide', new LichPrimitive(divide, 2));
	LichVM.reserveVar('/', new LichPrimitive(divide, 2));
	
	function modulus(argArray)
	{	
		return argArray[0].modulus(argArray[1]);
	}
	
	
	LichVM.reserveVar('modulus', new LichPrimitive(modulus, 2));
	LichVM.reserveVar('%', new LichPrimitive(modulus, 2));
	
	function assign(argArray)
	{
		argArray[0].assign();
		LichVM.push(argArray[0]);
		return argArray[0].type();
	}
	
	LichVM.reserveVar('assign', new LichPrimitive(assign, 1));
	LichVM.reserveVar('define', new LichPrimitive(assign, 1));
	LichVM.reserveVar('=>', new LichPrimitive(assign, 1));
	
	function incrementOne(argArray) // Adds one to the variable
	{
		if(argArray[0].type() == 'Variable')
		{
			return argArray[0].increment();
		}
		
		else
		{
			return argArray[0].add(new LichFloat(1));
		}
	}
	
	LichVM.reserveVar('++', new LichPrimitive(incrementOne, 1));
	
	function decrementOne(argArray) // Adds one to the variable
	{
		if(argArray[0].type() == 'Variable')
		{
			return argArray[0].decrement();
		}
		
		else
		{
			return argArray[0].subtract(new LichFloat(1));
		}
	}
	
	LichVM.reserveVar('--', new LichPrimitive(decrementOne, 1));
	
	function equivalent(argArray)
	{
		return argArray[0].equivalent(argArray[1]);
	}
	
	LichVM.reserveVar('equivalent', new LichPrimitive(equivalent, 2));
	LichVM.reserveVar('==', new LichPrimitive(equivalent, 2));
	
	function inequivalent(argArray)
	{
		return argArray[0].inequivalent(argArray[1]);
	}
	
	LichVM.reserveVar('inequivalent', new LichPrimitive(inequivalent, 2));
	LichVM.reserveVar('!=', new LichPrimitive(inequivalent, 2));
	
	function greaterThan(argArray)
	{
		return argArray[0].greaterThan(argArray[1]);
	}
	
	LichVM.reserveVar('greaterThan', new LichPrimitive(greaterThan, 2));
	LichVM.reserveVar('>', new LichPrimitive(greaterThan, 2));
	
	function lessThan(argArray)
	{
		return argArray[0].lessThan(argArray[1]);
	}
	
	LichVM.reserveVar('lessThan', new LichPrimitive(lessThan, 2));
	LichVM.reserveVar('<', new LichPrimitive(lessThan, 2));
	
	function greaterThanEqual(argArray)
	{
		return argArray[0].greaterThanEqual(argArray[1]);
	}
	
	LichVM.reserveVar('greaterThanEqual', new LichPrimitive(greaterThanEqual, 2));
	LichVM.reserveVar('>=', new LichPrimitive(greaterThanEqual, 2));
	
	function lessThanEqual(argArray)
	{
		return argArray[0].lessThanEqual(argArray[1]);
	}
	
	LichVM.reserveVar('lessThanEqual', new LichPrimitive(lessThanEqual, 2));
	LichVM.reserveVar('<=', new LichPrimitive(lessThanEqual, 2));
	
	function ifControl(argArray) // Takes 3 arguments: [0] conditional [1] trueFunction [2] falseFunction 
	{
		var conditional = argArray[0];
		var trueFunction = argArray[1];
		var falseFunction = argArray[2];
		var result;
				
		if(conditional.value() == 1)
		{
			return trueFunction.call();
		}
		
		else
		{
			return falseFunction.call();
		}
	}
	
	LichVM.reserveVar('if', new LichPrimitive(ifControl, 3));

	function elseControl(argArray)
	{
		LichVM.push(argArray[0]);
		return argArray[0];
	}

	LichVM.reserveVar('else', new LichPrimitive(elseControl, 1));
	
	function doFunction(argArray) // Takes two arguments: [0] number of iterations [1] function to evaluate
	{
		var result;
		 
		for(var i = 0; i < argArray[0].value(); ++i)
		{
			LichVM.push(argArray[1]);
			LichVM.push(new LichPrimitive(callFunction, 1));
		}
		
		return LichVM.pop().call();
	}
	
	LichVM.reserveVar('do', new LichPrimitive(doFunction, 2));
		
	function println(argArray)
	{
		var printString;
		
		if(argArray[0].type() == 'Array')
		{
			printString = arrayToPrintString(argArray[0].value());
		}
		
		else if(argArray[0].type() == "Signal")
		{
			var printString = arrayToPrintString(argArray[0].points.value());
			printString = printString.concat(" ").concat(argArray[0].shape);
		}
		
		else if(argArray[0].type() == 'Variable')
		{
			var printArray = new Array();
			printArray.push(argArray[0].object);
			return println(printArray);
		}
		
		else
		{
			printString = argArray[0].type().concat(": ");
			printString = printString.concat(argArray[0].value());
		}
		
		post(printString);
		LichVM.push(argArray[0]);
		return '__LICH_PRINT_VALUE__';
	}
	
	LichVM.reserveVar('print', new LichPrimitive(println, 1));
	
	function callFunction(argArray)
	{
		return argArray[0].call();
	}
	
	LichVM.reserveVar('call', new LichPrimitive(callFunction, 1));
	LichVM.reserveVar('::', new LichPrimitive(callFunction, 1));
	
	function newSignal(argArray)
	{
		var signal = new LichSignal(argArray[0], argArray[1].value());
		LichVM.push(signal);
	}
	
	LichVM.reserveVar("Signal", new LichPrimitive(newSignal, 2));
	LichVM.reserveVar("$", new LichPrimitive(newSignal, 2));
	
	function atObject(argArray) // 2 arguments: [0] object [1] index
	{
		return argArray[0].at(argArray[1].value());
	}
	
	LichVM.reserveVar("at", new LichPrimitive(atObject, 2));
	LichVM.reserveVar("@", new LichPrimitive(atObject, 2));
	
	function insertValue(argArray) // 3 arguments: [0] object [1] index [2] value
	{
		return argArray[0].insert(argArray[1], argArray[2]);
	}
	
	LichVM.reserveVar("->", new LichPrimitive(insertValue, 3));
	LichVM.reserveVar("insert", new LichPrimitive(insertValue, 3));
	
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Constants
	///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	
	LichVM.reserveVar('true', new LichFloat(1));
	LichVM.reserveVar('false', new LichFloat(0));
	LichVM.reserveVar('pi', new LichFloat(3.141592654));
}