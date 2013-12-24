/* 
    Lich.js - JavaScript audio/visual live coding language
    Copyright (C) 2012 Chad McKinney

	"http://chadmckinneyaudio.com/
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

var Lich = new Object();

Lich.VM = new Object();
Lich.VM.procedureStack = new Array();
Lich.VM.main = lichClosure([], null, true); // We allow mutability at the global scope in interactive mode.
Lich.VM.procedureStack.push(Lich.VM.main);
Lich.VM.Nothing = new LichNothing(); // We only need one Nothing value because they're immutable and identical.
Lich.VM.Void = new LichVoid(); // Same as Nothing, we only need one.
Lich.VM.reserved = {}; // For variables reserved by the language

Lich.VM.pushProcedure = function(procedure)
{
	Lich.VM.procedureStack.push(procedure);
}

Lich.VM.popProcedure = function()
{
	Lich.VM.procedureStack.pop();
}

Lich.VM.clearProcedureStack = function()
{
	while(Lich.VM.procedureStack.length > 1)
		Lich.VM.popProcedure();
}

Lich.VM.getVar = function(varName) // Dynamically check scopes for a variable's value
{
	for(var i = Lich.VM.procedureStack.length - 1; i >= 0; --i)
	{
		if(Lich.VM.procedureStack[i].hasVar(varName))
			return Lich.VM.procedureStack[i].getVar(varName);
	}

	return Lich.VM.Nothing; // Variable not found
}

Lich.VM.setVar = function(varName, value)
{
	if(Lich.VM.procedureStack.length > 0)
	 	Lich.VM.procedureStack[Lich.VM.procedureStack.length - 1].setVar(varName, value);
	else
		throw new Error("Lich.VM.Main procedure is missing. Fatal exception. WTF THE WORLD IS ENDING!!!");
}

Lich.VM.reserveVar = function(varName, value)
{
	Lich.VM.setVar(varName, value);
	Lich.VM.reserved[varName] = true;
}

Lich.VM.printArray = function(object)
{
    var string = "[";

    for(var i = 0; i < object.length; ++i)
    {
    	if(i < object.length - 1)
    		string = string + Lich.VM.PrettyPrint(object[i]) + ",";
    	else
    		string = string + Lich.VM.PrettyPrint(object[i]);
    }

    return string + "]";
}

Lich.VM.printDictionary = function(object)
{
    var string = "(";

    for(n in object)
    {
    	if(n != "lichType")
    	{
    		string = string + "\"" + n + "\" => " + Lich.VM.PrettyPrint(object[n]) + ", ";
    	}
    }

    if(string.length > 1)
    	return string.substring(0, string.length - 2) + ")";
	else
		return string + ")";
}

Lich.VM.printClosure = function(closure)
{
	var string = "(\\";

	for(var i = 0; i < closure.argNames.length; ++i)
	{
		string = string.concat(closure.argNames[i] + " ");
	}

	return string.concat("->)");
}

Lich.post = function(text)
{
    var obj = document.getElementById("post");
    var appendedText = document.createTextNode(text + "\n");
    obj.appendChild(appendedText);
    obj.scrollTop = obj.scrollHeight;
}

Lich.VM.PrettyPrint = function(object)
{
	if(typeof object === "undefined")
		return "Nothing"; // undefined == Nothing
	else if(typeof object === "string")
		return "\"" + object + "\"";
	else if(object instanceof Array)
		return Lich.VM.printArray(object);
	else if(object.lichType == CLOSURE || object.lichType == THUNK)
		return Lich.VM.printClosure(object);
	else if(object.lichType == DATA)
		return object._datatype;
	else if(object.lichType == DICTIONARY)
		return Lich.VM.printDictionary(object);
	else if(object == Lich.VM.Nothing)
		return "Nothing";
	else
		return object;
}

Lich.VM.Print = function(object)
{
	if(object != Lich.VM.Void)
		Lich.post(Lich.VM.PrettyPrint(object));
}