//require Parser/tokenize.js
//        Parser/preL.js
//        Parser/iterL.js
//        Parser/parser.js

Lich.parseType = "library";
Lich.libraryNamespace = [];
         
Lich.ParseError = function(msg,pos){
  this.msg = msg;
  this.pos = pos;
};

Lich.ParseError.prototype.toString = function(){
  return this.msg;
};
 
Lich.parse = function(input) {
    Lich.parseType = "interactive";

    // var z = Lich.Parser.tokenize.parse(input);
    if(typeof Lich.Lexer === "undefined")
    {
      Lich.Lexer = LichParser.lexer;
      Lich.Lexer.yy = LichParser.yy;
      Lich.Lexer.EOF = 1; //End of File

      Lich.Lexer.yy.parseError = function (str, hash) {
        if (Lich.Lexer.yy.lexer.debugArr !== undefined)
            console.log("parse error happened, lexer has so far returned:  " + Lich.Lexer.yy.lexer.debugArr)
        if (!Lich.Lexer.yy.lexer.parseError()) {
            throw new Lich.ParseError(str + " expected: " + hash.expected +
                                 "  Lexer returned: " + Lich.Lexer.yy.lexer.recent,
                                  Lich.Lexer.yy.lexer.yylloc);
        }
      }
    }

    LichParser.lexer = new iterL();
    Lich.Lexer.setInput(input);
    var x = new Array();
    var token;

    while(true)
    {
      token = Lich.Lexer.lex();
      // Lich.post("Lich.Lexer.lex() = " + token.typ);
      if(token == Lich.Lexer.EOF)
        break;

      x.push(token);
    }

    x.pop(); // Remove trailing EOF

    var y = Lich.Parser.preL(x);
    //Lich.post("Lich.Parser.preL(x) = " + y);
    
    return LichParser.parse(y); 
}

Lich.parseLibrary = function(input) {
    Lich.parseType = "library";
    Lich.libraryNamespace = [];

    // var z = Lich.Parser.tokenize.parse(input);
    if(typeof Lich.LibraryLexer === "undefined")
    {
      Lich.LibraryLexer = LichLibraryParser.lexer;
      Lich.LibraryLexer.yy = LichLibraryParser.yy;
      Lich.LibraryLexer.EOF = 1; //End of File

      Lich.LibraryLexer.yy.parseError = function (str, hash) {
        if (Lich.LibraryLexer.yy.lexer.debugArr !== undefined)
            console.log("parse error happened, lexer has so far returned:  " + Lich.LibraryLexer.yy.lexer.debugArr)
        if (!Lich.LibraryLexer.yy.lexer.parseError()) {
            throw new Lich.ParseError(str + " expected: " + hash.expected +
                                 "  Lexer returned: " + Lich.LibraryLexer.yy.lexer.recent,
                                  Lich.LibraryLexer.yy.lexer.yylloc);
        }
      }
    }

    LichLibraryParser.lexer = new iterL();
    Lich.LibraryLexer.setInput(input);
    var x = new Array();
    var token;

    while(true)
    {
      token = Lich.LibraryLexer.lex();

      // Printing
      /*
      if(typeof token.val !== "undefined")
        Lich.post("Lich.LibraryLexer.lex() = " + token.val);
      else
        Lich.post("Lich.LibraryLexer.lex() = " + token);*/

      if(token == Lich.LibraryLexer.EOF)
        break;

      x.push(token);
    }

    x.pop(); // Remove trailing EOF

    var y = Lich.LibraryParser.preL(x);
    //Lich.post("Lich.Parser.preL(x) = " + y);
    
    return LichLibraryParser.parse(y);
}

