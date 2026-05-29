const TOKEN_EOF = "EOF";
const TOKEN_EOL = "EOL";

const palabrasReservadas = {
  leer: "LEER",
  mostrar: "MOSTRAR",
  si: "SI",
  entonces: "ENTONCES",
  sino: "SINO",
  fin_si: "FIN_SI",
  segun: "SEGUN",
  "según": "SEGUN",
  caso: "CASO",
  defecto: "DEFECTO",
  fin_segun: "FIN_SEGUN",
  para: "PARA",
  hasta: "HASTA",
  paso: "PASO",
  fin_para: "FIN_PARA",
  mientras: "MIENTRAS",
  hacer: "HACER",
  fin_mientras: "FIN_MIENTRAS",
};

const simbolos = {
  "=": "ASIGNACION",
  "+": "SUMA",
  "-": "RESTA",
  "*": "MULTIPLICACION",
  "/": "DIVISION",
  "==": "IGUAL_QUE",
  "!=": "DIFERENTE_QUE",
  ">": "MAYOR_QUE",
  "<": "MENOR_QUE",
  ">=": "MAYOR_IGUAL_QUE",
  "<=": "MENOR_IGUAL_QUE",
  "(": "PARENTESIS_ABRE",
  ")": "PARENTESIS_CIERRA",
};

const operadoresRelacionales = new Set([
  "IGUAL_QUE",
  "DIFERENTE_QUE",
  "MAYOR_QUE",
  "MENOR_QUE",
  "MAYOR_IGUAL_QUE",
  "MENOR_IGUAL_QUE",
]);

const operadoresAritmeticos = new Set([
  "SUMA",
  "RESTA",
  "MULTIPLICACION",
  "DIVISION",
]);

const tokensCierreBloque = new Set([
  "SINO",
  "FIN_SI",
  "CASO",
  "DEFECTO",
  "FIN_SEGUN",
  "FIN_PARA",
  "FIN_MIENTRAS",
]);

const construirDiagnosticoLexico = (lexema) => {
  if (/^"[^"]*"$/.test(lexema)) {
    return {
      descripcion: `Cadena con caracteres no permitidos por la BNF: ${lexema}`,
      sugerencia: "Usa solo letras, digitos, espacios y los simbolos . , : ; ! ? + - * / dentro de cadenas.",
    };
  }

  if (/^"/.test(lexema) || /"$/.test(lexema)) {
    return {
      descripcion: `Cadena no valida o sin cierre correcto: ${lexema}`,
      sugerencia: "Verifica que la cadena tenga comillas dobles de apertura y cierre.",
    };
  }

  if (/^[0-9]+[a-zA-Z_]+/.test(lexema)) {
    return {
      descripcion: `Identificador invalido: ${lexema}`,
      sugerencia: "Inicia los identificadores con una letra y usa solo letras o digitos.",
    };
  }

  if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(lexema) && lexema.includes("_")) {
    return {
      descripcion: `Identificador invalido segun la BNF: ${lexema}`,
      sugerencia: "Usa guion bajo solo en palabras reservadas como fin_si; los identificadores solo aceptan letras y digitos.",
    };
  }

  if (/[{}[\],;:]/.test(lexema)) {
    return {
      descripcion: `Simbolo no permitido en el lenguaje: ${lexema}`,
      sugerencia: "Elimina o reemplaza ese simbolo por uno soportado por PseudoJS.",
    };
  }

  return {
    descripcion: `Lexema no reconocido: ${lexema}`,
    sugerencia: "Revisa ortografia y simbolos para que coincidan con las reglas lexicas definidas.",
  };
};

const crearToken = (token, lexema, linea) => ({ token, lexema, linea });

const tokenizar = (codigo) => {
  const listaTokens = [];
  const tokensParser = [];
  const erroresLexicos = [];
  let contadorErroresLexicos = 0;

  const registrarToken = (token, lexema, linea) => {
    const tokenCreado = crearToken(token, lexema, linea);
    listaTokens.push(tokenCreado);
    tokensParser.push(tokenCreado);
    return tokenCreado;
  };

  const registrarTokenDesconocido = (lexema, linea) => {
    const diagnostico = construirDiagnosticoLexico(lexema);
    contadorErroresLexicos += 1;

    const errorLexico = {
      numero: `LEX${String(contadorErroresLexicos).padStart(3, "0")}`,
      linea,
      lexema,
      descripcion: diagnostico.descripcion,
      sugerencia: diagnostico.sugerencia,
    };

    erroresLexicos.push(errorLexico);
    const tokenCreado = registrarToken("DESCONOCIDO", lexema, linea);
    tokenCreado.errorLexico = errorLexico;
  };

  const tokenizarLinea = (texto, linea) => {
    const patronLexemas = /"[^"]*"|\d+(?:\.\d+)?[a-zA-Z_][a-zA-Z0-9_]*|==|!=|>=|<=|[=+\-*/()<>]|[a-zA-Z\u00C0-\u00FF_][a-zA-Z0-9\u00C0-\u00FF_]*|\d+\.\d+|\d+/g;
    let cursor = 0;
    let coincidencia = null;

    while ((coincidencia = patronLexemas.exec(texto)) !== null) {
      if (coincidencia.index > cursor) {
        const segmento = texto.slice(cursor, coincidencia.index).trim();
        if (segmento) {
          registrarTokenDesconocido(segmento, linea);
        }
      }

      const lexema = coincidencia[0];
      const reservado = palabrasReservadas[lexema.toLowerCase()];

      if (reservado) {
        registrarToken(reservado, lexema, linea);
      } else if (/^"[\p{L}0-9 .,:;!?+\-*/]*"$/u.test(lexema)) {
        registrarToken("CADENA", lexema, linea);
      } else if (/^\d+\.\d+$/.test(lexema)) {
        registrarToken("DECIMAL", lexema, linea);
      } else if (/^\d+$/.test(lexema)) {
        registrarToken("ENTERO", lexema, linea);
      } else if (simbolos[lexema]) {
        registrarToken(simbolos[lexema], lexema, linea);
      } else if (/^[a-zA-Z][a-zA-Z0-9]*$/.test(lexema)) {
        registrarToken("IDENTIFICADOR", lexema, linea);
      } else {
        registrarTokenDesconocido(lexema, linea);
      }

      cursor = patronLexemas.lastIndex;
    }

    if (cursor < texto.length) {
      const segmentoFinal = texto.slice(cursor).trim();
      if (segmentoFinal) {
        registrarTokenDesconocido(segmentoFinal, linea);
      }
    }
  };

  codigo.split("\n").forEach((linea, indice) => {
    const numeroLinea = indice + 1;
    if (linea.trim() !== "") {
      tokenizarLinea(linea, numeroLinea);
    }
    tokensParser.push(crearToken(TOKEN_EOL, "\n", numeroLinea));
  });

  tokensParser.push(crearToken(TOKEN_EOF, "", codigo.split("\n").length + 1));

  return {
    listaTokens,
    tokensParser,
    erroresLexicos,
  };
};

class ParserPseudoJS {
  constructor(tokens) {
    this.tokens = tokens;
    this.actual = 0;
    this.errores = [];
    this.contadorErrores = 0;
  }

  parsePrograma() {
    const hijos = [];
    this.consumirSaltosLinea();

    while (!this.es(TOKEN_EOF)) {
      const instruccion = this.parseInstruccion({ contexto: "programa" });
      if (instruccion) {
        hijos.push(instruccion);
      }
      this.consumirSaltosLinea();
    }

    return {
      tipo: "Programa",
      hijos,
    };
  }

  parseInstruccion(contexto = {}) {
    this.consumirSaltosLinea();
    const token = this.ver();

    if (token.token === TOKEN_EOF) return null;

    if (tokensCierreBloque.has(token.token)) {
      return this.crearErrorDesdeActual(
        "Cierre inesperado",
        `La palabra reservada "${token.lexema}" no corresponde al bloque actual.`,
        "Verifica que cada cierre pertenezca a una estructura abierta.",
        true
      );
    }

    switch (token.token) {
      case "IDENTIFICADOR":
        return this.parseAsignacion();
      case "LEER":
        return this.parseEntradaDatos();
      case "MOSTRAR":
        return this.parseSalidaDatos();
      case "SI":
        return this.parseCondicionalSi();
      case "SEGUN":
        return this.parseEstructuraSegun();
      case "PARA":
        return this.parseCicloPara();
      case "MIENTRAS":
        return this.parseCicloMientras(contexto);
      case "HACER":
        return this.parseCicloHacerMientras();
      default:
        return this.crearErrorDesdeActual(
          "Instruccion no reconocida",
          `No se pudo reconocer la instruccion que inicia con "${token.lexema}".`,
          "Usa una instruccion valida de la gramatica PseudoJS.",
          true
        );
    }
  }

  parseAsignacion() {
    const identificador = this.consumir("IDENTIFICADOR", "Se esperaba un identificador al inicio de la asignacion.");
    this.consumir("ASIGNACION", "Se esperaba '=' despues del identificador.");
    const expresion = this.parseExpresion(new Set([TOKEN_EOL, TOKEN_EOF]));
    this.esperarFinDeLinea("La asignacion debe terminar despues de la expresion.");

    return {
      tipo: "Asignacion",
      identificador: identificador?.lexema ?? "",
      expresion,
      linea: identificador?.linea ?? this.ver().linea,
    };
  }

  parseEntradaDatos() {
    const inicio = this.consumir("LEER", "Se esperaba la palabra reservada leer.");
    const identificador = this.consumir("IDENTIFICADOR", "La instruccion leer necesita un identificador.");
    this.esperarFinDeLinea("La instruccion leer solo acepta un identificador.");

    return {
      tipo: "EntradaDatos",
      identificador: identificador?.lexema ?? "",
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseSalidaDatos() {
    const inicio = this.consumir("MOSTRAR", "Se esperaba la palabra reservada mostrar.");
    const expresion = this.parseExpresion(new Set([TOKEN_EOL, TOKEN_EOF]));
    this.esperarFinDeLinea("La instruccion mostrar debe terminar despues de la expresion.");

    return {
      tipo: "SalidaDatos",
      expresion,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseCondicionalSi() {
    const inicio = this.consumir("SI", "Se esperaba la palabra reservada si.");
    const condicion = this.parseCondicion(new Set(["ENTONCES", TOKEN_EOL, TOKEN_EOF]));
    this.consumir("ENTONCES", "La condicion si debe terminar con entonces.");
    this.esperarFinDeLinea("No debe haber tokens despues de entonces.");

    const bloqueEntonces = this.parseBloqueInstrucciones(
      (token) => token.token === "SINO" || token.token === "FIN_SI",
      {
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "si",
        descripcion: "El bloque entonces de la estructura si debe tener al menos una instruccion.",
        sugerencia: "Agrega una instruccion entre entonces y sino o fin_si.",
      }
    );
    let bloqueSino = [];

    if (this.es("SINO")) {
      const sino = this.ver();
      this.avanzar();
      this.esperarFinDeLinea("La palabra sino debe ir sola en su linea.");
      bloqueSino = this.parseBloqueInstrucciones(
        (token) => token.token === "FIN_SI",
        {
          linea: sino.linea,
          lexema: sino.lexema,
          descripcion: "El bloque sino debe tener al menos una instruccion.",
          sugerencia: "Agrega una instruccion entre sino y fin_si.",
        }
      );
    }

    if (this.es("FIN_SI")) {
      this.avanzar();
      this.esperarFinDeLinea("La palabra fin_si debe ir sola en su linea.");
    } else {
      this.registrarError({
        tipo: "Bloque sin cierre",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "si",
        descripcion: "La estructura si no tiene cierre fin_si.",
        sugerencia: "Agrega fin_si despues del bloque condicional.",
      });
    }

    return {
      tipo: "CondicionalSi",
      condicion,
      bloqueEntonces,
      bloqueSino,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseEstructuraSegun() {
    const inicio = this.consumir("SEGUN", "Se esperaba la palabra reservada segun.");
    const identificador = this.consumir("IDENTIFICADOR", "La estructura segun necesita un identificador.");
    this.esperarFinDeLinea("La cabecera segun solo acepta un identificador.");

    const casos = [];
    let defecto = null;

    while (!this.es(TOKEN_EOF) && !this.es("DEFECTO") && !this.es("FIN_SEGUN")) {
      if (this.es("CASO")) {
        casos.push(this.parseCaso());
      } else {
        this.crearErrorDesdeActual(
          "Caso esperado",
          "Dentro de segun solo se permiten casos antes de defecto o fin_segun.",
          "Agrega una linea caso <valor> o cierra la estructura con fin_segun.",
          true
        );
      }
      this.consumirSaltosLinea();
    }

    if (casos.length === 0) {
      this.registrarError({
        tipo: "Caso requerido",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: inicio?.lexema ?? "segun",
        descripcion: "La estructura segun debe tener al menos un caso.",
        sugerencia: "Agrega al menos una linea caso <valor> antes de fin_segun.",
      });
    }

    if (this.es("DEFECTO")) {
      defecto = this.parseDefecto();
    }

    if (this.es("FIN_SEGUN")) {
      this.avanzar();
      this.esperarFinDeLinea("La palabra fin_segun debe ir sola en su linea.");
    } else {
      this.registrarError({
        tipo: "Bloque sin cierre",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "segun",
        descripcion: "La estructura segun no tiene cierre fin_segun.",
        sugerencia: "Agrega fin_segun despues de los casos.",
      });
    }

    return {
      tipo: "EstructuraSegun",
      identificador: identificador?.lexema ?? "",
      casos,
      defecto,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseCaso() {
    const inicio = this.consumir("CASO", "Se esperaba la palabra reservada caso.");
    const valor = this.parseValor();
    this.esperarFinDeLinea("La linea caso solo acepta un valor.");
    const bloque = this.parseBloqueInstrucciones(
      (token) => (
        token.token === "CASO" || token.token === "DEFECTO" || token.token === "FIN_SEGUN"
      ),
      {
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "caso",
        descripcion: "Cada caso debe tener al menos una instruccion.",
        sugerencia: "Agrega una instruccion despues de caso <valor>.",
      }
    );

    return {
      tipo: "Caso",
      valor,
      bloque,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseDefecto() {
    const inicio = this.consumir("DEFECTO", "Se esperaba la palabra reservada defecto.");
    this.esperarFinDeLinea("La palabra defecto debe ir sola en su linea.");
    const bloque = this.parseBloqueInstrucciones(
      (token) => token.token === "FIN_SEGUN",
      {
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "defecto",
        descripcion: "El bloque defecto debe tener al menos una instruccion.",
        sugerencia: "Agrega una instruccion entre defecto y fin_segun.",
      }
    );

    return {
      tipo: "Defecto",
      bloque,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseCicloPara() {
    const inicio = this.consumir("PARA", "Se esperaba la palabra reservada para.");
    const identificador = this.consumir("IDENTIFICADOR", "El ciclo para necesita un identificador.");
    this.consumir("ASIGNACION", "El ciclo para necesita '=' despues del identificador.");
    const desde = this.parseNumero();
    this.consumir("HASTA", "El ciclo para necesita la palabra hasta.");
    const hasta = this.parseNumero();
    let paso = null;

    if (this.es("PASO")) {
      this.avanzar();
      paso = this.parseNumeroConSigno();
    }

    this.esperarFinDeLinea("La cabecera para debe terminar despues del limite o paso.");
    const bloque = this.parseBloqueInstrucciones(
      (token) => token.token === "FIN_PARA",
      {
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "para",
        descripcion: "El ciclo para debe tener al menos una instruccion interna.",
        sugerencia: "Agrega una instruccion entre para y fin_para.",
      }
    );

    if (this.es("FIN_PARA")) {
      this.avanzar();
      this.esperarFinDeLinea("La palabra fin_para debe ir sola en su linea.");
    } else {
      this.registrarError({
        tipo: "Bloque sin cierre",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "para",
        descripcion: "El ciclo para no tiene cierre fin_para.",
        sugerencia: "Agrega fin_para despues del bloque del ciclo.",
      });
    }

    return {
      tipo: "CicloPara",
      identificador: identificador?.lexema ?? "",
      desde,
      hasta,
      paso,
      bloque,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseCicloMientras(contexto = {}) {
    const inicio = this.consumir("MIENTRAS", "Se esperaba la palabra reservada mientras.");
    const condicion = this.parseCondicion(new Set(["HACER", TOKEN_EOL, TOKEN_EOF]));

    if (!this.es("HACER")) {
      const sugerencia = contexto.contexto === "hacer"
        ? "Para cerrar hacer-mientras, usa mientras <condicion> despues del bloque hacer."
        : "Para iniciar un ciclo mientras, agrega hacer al final de la condicion.";

      this.registrarError({
        tipo: "Mientras ambiguo",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: inicio?.lexema ?? "mientras",
        descripcion: "La instruccion mientras fuera de hacer-mientras debe incluir la palabra hacer.",
        sugerencia,
        incluidoEnCodigo: true,
      });
      this.sincronizarLinea();
      return {
        tipo: "ErrorSintactico",
        linea: inicio?.linea ?? this.ver().linea,
        instruccion: inicio?.lexema ?? "mientras",
      };
    }

    this.avanzar();
    this.esperarFinDeLinea("No debe haber tokens despues de hacer.");
    const bloque = this.parseBloqueInstrucciones(
      (token) => token.token === "FIN_MIENTRAS",
      {
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "mientras",
        descripcion: "El ciclo mientras debe tener al menos una instruccion interna.",
        sugerencia: "Agrega una instruccion entre mientras ... hacer y fin_mientras.",
      }
    );

    if (this.es("FIN_MIENTRAS")) {
      this.avanzar();
      this.esperarFinDeLinea("La palabra fin_mientras debe ir sola en su linea.");
    } else {
      this.registrarError({
        tipo: "Bloque sin cierre",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "mientras",
        descripcion: "El ciclo mientras no tiene cierre fin_mientras.",
        sugerencia: "Agrega fin_mientras despues del bloque del ciclo.",
      });
    }

    return {
      tipo: "CicloMientras",
      condicion,
      bloque,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseCicloHacerMientras() {
    const inicio = this.consumir("HACER", "Se esperaba la palabra reservada hacer.");
    this.esperarFinDeLinea("La palabra hacer debe ir sola en su linea.");
    const bloque = this.parseBloqueInstrucciones(
      (token) => (
        token.token === "MIENTRAS" && !this.lineaActualContiene("HACER")
      ),
      {
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "hacer",
        descripcion: "La estructura hacer debe tener al menos una instruccion interna.",
        sugerencia: "Agrega una instruccion entre hacer y mientras <condicion>.",
      }
    );

    if (!this.es("MIENTRAS")) {
      this.registrarError({
        tipo: "Bloque sin cierre",
        linea: inicio?.linea ?? this.ver().linea,
        lexema: "hacer",
        descripcion: "La estructura hacer no cierra con mientras <condicion>.",
        sugerencia: "Agrega una linea mientras <condicion> al final del bloque hacer.",
      });

      return {
        tipo: "CicloHacerMientras",
        condicion: this.crearNodoExpresionVacio(),
        bloque,
        linea: inicio?.linea ?? this.ver().linea,
      };
    }

    this.avanzar();
    const condicion = this.parseCondicion(new Set([TOKEN_EOL, TOKEN_EOF]));
    this.esperarFinDeLinea("El cierre hacer-mientras debe terminar despues de la condicion.");

    return {
      tipo: "CicloHacerMientras",
      condicion,
      bloque,
      linea: inicio?.linea ?? this.ver().linea,
    };
  }

  parseBloqueInstrucciones(debeDetenerse, bloqueRequerido = null) {
    const instrucciones = [];
    this.consumirSaltosLinea();

    while (!this.es(TOKEN_EOF) && !debeDetenerse(this.ver())) {
      const instruccion = this.parseInstruccion({ contexto: "bloque" });
      if (instruccion) {
        instrucciones.push(instruccion);
      }
      this.consumirSaltosLinea();
    }

    if (bloqueRequerido && !instrucciones.some((instruccion) => instruccion.tipo !== "ErrorSintactico")) {
      this.registrarError({
        tipo: "Bloque vacio",
        linea: bloqueRequerido.linea,
        lexema: bloqueRequerido.lexema,
        descripcion: bloqueRequerido.descripcion,
        sugerencia: bloqueRequerido.sugerencia,
      });
    }

    return instrucciones;
  }

  parseCondicion(detenciones) {
    const izquierda = this.parseExpresion(new Set([...detenciones, ...operadoresRelacionales]));
    const operador = this.ver();

    if (operadoresRelacionales.has(operador.token)) {
      this.avanzar();
    } else {
      this.registrarError({
        tipo: "Operador relacional esperado",
        linea: operador.linea,
        lexema: operador.lexema,
        descripcion: "La condicion necesita un operador relacional.",
        sugerencia: "Usa ==, !=, >, <, >= o <= entre dos expresiones.",
      });
    }

    const derecha = this.parseExpresion(detenciones);

    return {
      tipo: "Condicion",
      izquierda,
      operador: operadoresRelacionales.has(operador.token) ? operador.lexema : "",
      derecha,
    };
  }

  parseExpresion(detenciones) {
    const terminos = [this.parseTermino(detenciones)];
    const operadores = [];

    while (!this.es(TOKEN_EOF) && !detenciones.has(this.ver().token) && operadoresAritmeticos.has(this.ver().token)) {
      operadores.push(this.avanzar().lexema);
      terminos.push(this.parseTermino(detenciones));
    }

    if (terminos.length === 1) {
      return terminos[0];
    }

    return {
      tipo: "Expresion",
      terminos,
      operadores,
    };
  }

  parseTermino(detenciones) {
    if (this.es("PARENTESIS_ABRE")) {
      const apertura = this.avanzar();
      const expresion = this.parseExpresion(new Set([...detenciones, "PARENTESIS_CIERRA"]));
      this.consumir("PARENTESIS_CIERRA", "Falta cerrar el parentesis de la expresion.");

      return {
        tipo: "TerminoAgrupado",
        expresion,
        linea: apertura.linea,
      };
    }

    return this.parseValor();
  }

  parseValor() {
    const token = this.ver();

    if (token.token === "IDENTIFICADOR") {
      this.avanzar();
      return { tipo: "Identificador", valor: token.lexema, linea: token.linea };
    }

    if (token.token === "ENTERO" || token.token === "DECIMAL") {
      this.avanzar();
      return { tipo: "Numero", valor: token.lexema, linea: token.linea };
    }

    if (token.token === "CADENA") {
      this.avanzar();
      return { tipo: "Cadena", valor: token.lexema, linea: token.linea };
    }

    this.registrarError({
      tipo: "Valor esperado",
      linea: token.linea,
      lexema: token.lexema,
      descripcion: "Se esperaba un identificador, numero, cadena o expresion entre parentesis.",
      sugerencia: "Revisa la expresion y agrega un valor valido.",
    });

    if (token.token !== TOKEN_EOL && token.token !== TOKEN_EOF) {
      this.avanzar();
    }

    return this.crearNodoExpresionVacio(token.linea);
  }

  parseNumero() {
    const token = this.ver();
    if (token.token === "ENTERO" || token.token === "DECIMAL") {
      this.avanzar();
      return { tipo: "Numero", valor: token.lexema, linea: token.linea };
    }

    this.registrarError({
      tipo: "Numero esperado",
      linea: token.linea,
      lexema: token.lexema,
      descripcion: "Se esperaba un numero entero o decimal.",
      sugerencia: "Usa un valor numerico valido.",
    });

    if (token.token !== TOKEN_EOL && token.token !== TOKEN_EOF) {
      this.avanzar();
    }

    return this.crearNodoExpresionVacio(token.linea);
  }

  parseNumeroConSigno() {
    let signo = "";
    if (this.es("SUMA") || this.es("RESTA")) {
      signo = this.avanzar().lexema;
    }

    const numero = this.parseNumero();
    return {
      tipo: "Numero",
      valor: `${signo}${numero.valor ?? ""}`,
      linea: numero.linea,
    };
  }

  consumir(tokenEsperado, mensaje) {
    if (this.es(tokenEsperado)) {
      return this.avanzar();
    }

    const actual = this.ver();
    this.registrarError({
      tipo: "Token inesperado",
      linea: actual.linea,
      lexema: actual.lexema,
      descripcion: mensaje,
      sugerencia: `Se esperaba ${tokenEsperado}.`,
    });

    return null;
  }

  esperarFinDeLinea(mensaje) {
    if (this.es(TOKEN_EOL) || this.es(TOKEN_EOF)) {
      this.consumirSaltosLinea();
      return;
    }

    this.registrarError({
      tipo: "Tokens sobrantes",
      linea: this.ver().linea,
      lexema: this.ver().lexema,
      descripcion: mensaje,
      sugerencia: "Mueve la instruccion sobrante a otra linea o elimina el token adicional.",
    });
    this.sincronizarLinea();
  }

  consumirSaltosLinea() {
    while (this.es(TOKEN_EOL)) {
      this.avanzar();
    }
  }

  sincronizarLinea() {
    while (!this.es(TOKEN_EOL) && !this.es(TOKEN_EOF)) {
      this.avanzar();
    }
    this.consumirSaltosLinea();
  }

  lineaActualContiene(tokenBuscado) {
    const linea = this.ver().linea;
    let indice = this.actual;

    while (indice < this.tokens.length && this.tokens[indice].linea === linea && this.tokens[indice].token !== TOKEN_EOL) {
      if (this.tokens[indice].token === tokenBuscado) {
        return true;
      }
      indice += 1;
    }

    return false;
  }

  crearErrorDesdeActual(tipo, descripcion, sugerencia, incluidoEnCodigo = false) {
    const token = this.ver();
    const error = this.registrarError({
      tipo,
      linea: token.linea,
      lexema: token.lexema,
      descripcion,
      sugerencia,
      incluidoEnCodigo,
    });
    this.sincronizarLinea();

    return {
      tipo: "ErrorSintactico",
      linea: token.linea,
      instruccion: token.lexema,
      error,
    };
  }

  registrarError(error) {
    this.contadorErrores += 1;
    const errorSintactico = {
      numero: `SIN${String(this.contadorErrores).padStart(3, "0")}`,
      tipo: error.tipo,
      linea: error.linea,
      lexema: error.lexema ?? "",
      descripcion: error.descripcion,
      sugerencia: error.sugerencia,
      incluidoEnCodigo: Boolean(error.incluidoEnCodigo),
    };

    this.errores.push(errorSintactico);
    return errorSintactico;
  }

  crearNodoExpresionVacio(linea = this.ver().linea) {
    return { tipo: "ExpresionVacia", valor: "", linea };
  }

  es(token) {
    return this.ver().token === token;
  }

  ver() {
    return this.tokens[this.actual] ?? this.tokens[this.tokens.length - 1];
  }

  avanzar() {
    const token = this.ver();
    if (!this.es(TOKEN_EOF)) {
      this.actual += 1;
    }
    return token;
  }
}

const expresionACodigo = (nodo) => {
  if (!nodo) return "";

  switch (nodo.tipo) {
    case "Identificador":
    case "Numero":
    case "Cadena":
    case "ExpresionVacia":
      return nodo.valor ?? "";
    case "TerminoAgrupado":
      return `(${expresionACodigo(nodo.expresion)})`;
    case "Expresion":
      return nodo.terminos.reduce((codigo, termino, indice) => {
        if (indice === 0) return expresionACodigo(termino);
        return `${codigo} ${nodo.operadores[indice - 1]} ${expresionACodigo(termino)}`;
      }, "");
    case "Condicion":
      return `${expresionACodigo(nodo.izquierda)} ${nodo.operador} ${expresionACodigo(nodo.derecha)}`.trim();
    default:
      return "";
  }
};

const generarJavaScript = (arbolSintactico, erroresSintacticos) => {
  const variablesDeclaradas = new Set();

  const generarBloque = (instrucciones, nivel = 0) => (
    instrucciones.flatMap((instruccion) => generarInstruccion(instruccion, nivel))
  );

  const indentar = (nivel, linea) => `${"  ".repeat(nivel)}${linea}`;

  const declararOAsignar = (variable, valor) => {
    if (!variablesDeclaradas.has(variable)) {
      variablesDeclaradas.add(variable);
      return `let ${variable} = ${valor};`;
    }

    return `${variable} = ${valor};`;
  };

  const generarInstruccion = (nodo, nivel) => {
    switch (nodo.tipo) {
      case "Asignacion":
        return [indentar(nivel, declararOAsignar(nodo.identificador, expresionACodigo(nodo.expresion)))];
      case "EntradaDatos":
        return [indentar(nivel, declararOAsignar(nodo.identificador, `prompt("Ingrese ${nodo.identificador}:")`))];
      case "SalidaDatos":
        return [indentar(nivel, `console.log(${expresionACodigo(nodo.expresion)});`)];
      case "CondicionalSi": {
        const lineas = [indentar(nivel, `if (${expresionACodigo(nodo.condicion)}) {`)];
        lineas.push(...generarBloque(nodo.bloqueEntonces, nivel + 1));
        if (nodo.bloqueSino.length > 0) {
          lineas.push(indentar(nivel, "} else {"));
          lineas.push(...generarBloque(nodo.bloqueSino, nivel + 1));
        }
        lineas.push(indentar(nivel, "}"));
        return lineas;
      }
      case "EstructuraSegun": {
        const lineas = [indentar(nivel, `switch (${nodo.identificador}) {`)];
        nodo.casos.forEach((caso) => {
          lineas.push(indentar(nivel + 1, `case ${expresionACodigo(caso.valor)}:`));
          lineas.push(...generarBloque(caso.bloque, nivel + 2));
          lineas.push(indentar(nivel + 2, "break;"));
        });
        if (nodo.defecto) {
          lineas.push(indentar(nivel + 1, "default:"));
          lineas.push(...generarBloque(nodo.defecto.bloque, nivel + 2));
        }
        lineas.push(indentar(nivel, "}"));
        return lineas;
      }
      case "CicloPara": {
        const pasoOriginal = nodo.paso?.valor ?? "1";
        const pasoNumerico = Number(pasoOriginal);
        const paso = pasoOriginal.startsWith("+") ? pasoOriginal.slice(1) : pasoOriginal;
        const operador = pasoNumerico < 0 ? ">=" : "<=";
        const incremento = pasoNumerico === 1
          ? `${nodo.identificador}++`
          : `${nodo.identificador} += ${paso}`;
        const inicializador = variablesDeclaradas.has(nodo.identificador)
          ? `${nodo.identificador} = ${expresionACodigo(nodo.desde)}`
          : `let ${nodo.identificador} = ${expresionACodigo(nodo.desde)}`;

        variablesDeclaradas.add(nodo.identificador);

        return [
          indentar(nivel, `for (${inicializador}; ${nodo.identificador} ${operador} ${expresionACodigo(nodo.hasta)}; ${incremento}) {`),
          ...generarBloque(nodo.bloque, nivel + 1),
          indentar(nivel, "}"),
        ];
      }
      case "CicloMientras":
        return [
          indentar(nivel, `while (${expresionACodigo(nodo.condicion)}) {`),
          ...generarBloque(nodo.bloque, nivel + 1),
          indentar(nivel, "}"),
        ];
      case "CicloHacerMientras":
        return [
          indentar(nivel, "do {"),
          ...generarBloque(nodo.bloque, nivel + 1),
          indentar(nivel, `} while (${expresionACodigo(nodo.condicion)});`),
        ];
      case "ErrorSintactico":
        return [indentar(nivel, `// Error sintactico no valido en linea ${nodo.linea}: ${nodo.instruccion}`)];
      default:
        return [];
    }
  };

  const lineas = generarBloque(arbolSintactico.hijos);
  erroresSintacticos
    .filter((error) => !error.incluidoEnCodigo)
    .forEach((error) => {
      lineas.push(`// Error sintactico ${error.numero} en linea ${error.linea}: ${error.descripcion}`);
    });

  return lineas.join("\n");
};

export function traducir(codigo) {
  const { listaTokens, tokensParser, erroresLexicos } = tokenizar(codigo);
  const parser = new ParserPseudoJS(tokensParser);
  const arbolSintactico = parser.parsePrograma();
  const erroresSintacticos = parser.errores;
  const codigoJS = generarJavaScript(arbolSintactico, erroresSintacticos);

  return {
    codigoJS,
    listaTokens,
    erroresLexicos,
    erroresSintacticos,
    arbolSintactico,
  };
}
