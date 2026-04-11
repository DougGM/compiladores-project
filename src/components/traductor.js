

export function traducir(codigo) {
  // Divide el texto fuente por lineas para traducir cada instruccion de forma independiente.
  const lineas = codigo.split("\n");
  let resultado = [];
  let listaTokens = [];
  let listaErroresLexicos = [];
  let contadorErroresLexicos = 0;

  // Lleva control de variables declaradas para no repetir "let" en reasignaciones.
  let variablesDeclaradas = new Set(); 

  // Pila para administrar el contexto de bloques "segun" y cerrar casos con break.
  let pilaSegun = [];

  // Tabla de palabras reservadas y simbolos para clasificacion lexica atomica.
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

  const construirDiagnosticoLexico = (lexema) => {
    if (/^"/.test(lexema) || /"$/.test(lexema)) {
      return {
        descripcion: `Cadena no valida o sin cierre correcto: ${lexema}`,
        sugerencia: "Verifica que la cadena tenga comillas dobles de apertura y cierre.",
      };
    }

    if (/^[0-9]+[a-zA-Z_]+/.test(lexema)) {
      return {
        descripcion: `Identificador invalido: ${lexema}`,
        sugerencia: "Inicia los identificadores con una letra y usa solo letras, numeros o guion bajo.",
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

  const registrarTokenDesconocido = (tokens, lexema, numeroLinea) => {
    const diagnostico = construirDiagnosticoLexico(lexema);
    contadorErroresLexicos += 1;
    const numeroError = `LEX${String(contadorErroresLexicos).padStart(3, "0")}`;

    const errorLexico = {
      numero: numeroError,
      linea: numeroLinea,
      lexema,
      descripcion: diagnostico.descripcion,
      sugerencia: diagnostico.sugerencia,
    };

    listaErroresLexicos.push(errorLexico);

    tokens.push({
      token: "DESCONOCIDO",
      lexema,
      linea: numeroLinea,
      errorLexico,
    });
  };

  // Extrae lexemas atomicos por linea usando regex global y los clasifica por token.
  const tokenizarLinea = (texto, numeroLinea) => {
    const tokens = [];
    const patronLexemas = /"[^"]*"|==|!=|>=|<=|[=+\-*/()<>]|seg\u00FAn|[a-zA-Z_][a-zA-Z0-9_]*|\d+\.\d+|\d+/g;
    let cursor = 0;
    let coincidencia = null;

    while ((coincidencia = patronLexemas.exec(texto)) !== null) {
      if (coincidencia.index > cursor) {
        const segmento = texto.slice(cursor, coincidencia.index).trim();
        if (segmento) {
          registrarTokenDesconocido(tokens, segmento, numeroLinea);
        }
      }

      const lexema = coincidencia[0];
      let token = "DESCONOCIDO";

      if (/^"[^"]*"$/.test(lexema)) {
        token = "CADENA";
      } else if (/^\d+\.\d+$/.test(lexema)) {
        token = "DECIMAL";
      } else if (/^\d+$/.test(lexema)) {
        token = "ENTERO";
      } else if (simbolos[lexema]) {
        token = simbolos[lexema];
      } else {
        const reservado = palabrasReservadas[lexema.toLowerCase()];
        token = reservado || "IDENTIFICADOR";
      }

      tokens.push({
        token,
        lexema,
        linea: numeroLinea,
      });

      cursor = patronLexemas.lastIndex;
    }

    if (cursor < texto.length) {
      const segmentoFinal = texto.slice(cursor).trim();
      if (segmentoFinal) {
        registrarTokenDesconocido(tokens, segmentoFinal, numeroLinea);
      }
    }

    return tokens;
  };

  
  // Reglas de validacion por tipo de instruccion de PseudoJS.
  const reglas = {
    //identificadores
    asigSimple: /^[a-zA-Z][a-zA-Z0-9]*\s*=\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")$/,
    asigOperacion: /^[a-zA-Z][a-zA-Z0-9]*\s*=\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)(\s*[+\-*/]\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?))*$/,
    asigParentesis: /^[a-zA-Z][a-zA-Z0-9]*\s*=\s*\(.+\)\s*([+\-*/]\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?))*$/,
    
    // entrada de datos
    leer: /^leer\s+([a-zA-Z][a-zA-Z0-9]*)$/,
    
    // Salida de datos
    mostrarMensaje: /^mostrar\s+([a-zA-Z][a-zA-Z0-9]*|"[^"]*")$/,
    mostrarOperacion: /^mostrar\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")(\s*[+\-*/]\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*"))*$/,
    
    //Condicional si-sino
    si: /^si\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)\s*(==|!=|>|<|>=|<=)\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")\s+entonces$/,
    sino: /^sino$/,
    fin_si: /^fin_si$/,

    // Estructura segun-caso
    segun: /^seg(?:u|\u00FA)n\s+[a-zA-Z][a-zA-Z0-9]*$/,
    caso: /^caso\s+(\d+|"[^"]*"|[a-zA-Z][a-zA-Z0-9]*)$/,
    defecto: /^defecto$/,
    fin_segun: /^fin_segun$/,

    // Ciclo para
    paraSinPaso: /^para\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*\d+\s+hasta\s+\d+$/,
    paraConPaso: /^para\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*\d+\s+hasta\s+\d+\s+paso\s+-?\d+$/,
    fin_para: /^fin_para$/,
    
    //Ciclo mientras
    mientras: /^mientras\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)\s*(==|!=|>|<|>=|<=)\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")\s+hacer$/,
    fin_mientras: /^fin_mientras$/,
    
    // Ciclo hacer-mientras
    hacer: /^hacer$/,
    cierre_hacer: /^mientras\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)\s*(==|!=|>|<|>=|<=)\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")$/
  };

  // Recorre el codigo de arriba hacia abajo y construye la salida JS en el mismo orden.
  for (let i = 0; i < lineas.length; i++) {
    const linea = lineas[i];
    let l = linea.trim();

    // Conserva lineas vacias para mantener legibilidad y correspondencia visual.
    if (l === "") {
      resultado.push("");
      continue;
    }

    listaTokens.push(...tokenizarLinea(l, i + 1));

    //Asignaciones (Simple, operación y de Paréntesis)
    if (reglas.asigSimple.test(l) || reglas.asigOperacion.test(l) || reglas.asigParentesis.test(l)) {
      const [variable, valor] = l.split("=").map(part => part.trim());
      if (!variablesDeclaradas.has(variable)) {
        resultado.push(`let ${variable} = ${valor};`);
        variablesDeclaradas.add(variable);
      } else {
        resultado.push(`${variable} = ${valor};`);
      }
    }

    // Entrada de datos
    else if (reglas.leer.test(l)) {
      const match = l.match(reglas.leer);
      const variable = match[1];
      if (!variablesDeclaradas.has(variable)) {
        resultado.push(`let ${variable} = prompt("Ingrese ${variable}:");`);
        variablesDeclaradas.add(variable);
      } else {
        resultado.push(`${variable} = prompt("Ingrese ${variable}:");`);
      }
    }

    //Salida de datos (mostrar algo)
    else if (reglas.mostrarMensaje.test(l) || reglas.mostrarOperacion.test(l)) {
      const contenido = l.replace(/^mostrar\s+/, "");
      resultado.push(`console.log(${contenido});`);
    }

    // CONDICIONAL SI
    else if (reglas.si.test(l)) {
      const match = l.match(reglas.si);
      resultado.push(`if (${match[1]} ${match[3]} ${match[4]}) {`);
    } 
    else if (reglas.sino.test(l)) {
      resultado.push(`} else {`);
    } 
    else if (reglas.fin_si.test(l)) {
      resultado.push(`}`);
    }

    // Traduce estructura "segun" a switch/case y controla break automaticos entre casos.
    else if (reglas.segun.test(l)) {
      const match = l.match(/^seg(?:u|\u00FA)n\s+([a-zA-Z][a-zA-Z0-9]*)$/);
      resultado.push(`switch (${match[1]}) {`);
      pilaSegun.push({ casoAbierto: false });
    }
    else if (reglas.caso.test(l)) {
      const contextoSegun = pilaSegun[pilaSegun.length - 1];
      if (contextoSegun && contextoSegun.casoAbierto) {
        resultado.push(`break;`);
      }
      const match = l.match(reglas.caso);
      resultado.push(`case ${match[1]}:`);
      if (contextoSegun) {
        contextoSegun.casoAbierto = true;
      }
    }
    else if (reglas.defecto.test(l)) {
      const contextoSegun = pilaSegun[pilaSegun.length - 1];
      if (contextoSegun && contextoSegun.casoAbierto) {
        resultado.push(`break;`);
        contextoSegun.casoAbierto = false;
      }
      resultado.push(`default:`);
    }
    else if (reglas.fin_segun.test(l)) {
      const contextoSegun = pilaSegun.pop();
      if (contextoSegun && contextoSegun.casoAbierto) {
        resultado.push(`break;`);
      }
      resultado.push(`}`);
    }

    // Traduce ciclo PARA sin paso explicito (incremento de 1).
    else if (reglas.paraSinPaso.test(l)) {
      const match = l.match(/^para\s+([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(\d+)\s+hasta\s+(\d+)$/);
      const variable = match[1];
      const inicio = match[2];
      const fin = match[3];
      if (!variablesDeclaradas.has(variable)) {
        resultado.push(`for (let ${variable} = ${inicio}; ${variable} <= ${fin}; ${variable}++) {`);
        variablesDeclaradas.add(variable);
      } else {
        resultado.push(`for (${variable} = ${inicio}; ${variable} <= ${fin}; ${variable}++) {`);
      }
    }
    // Traduce ciclo PARA con paso configurable y ajusta la condicion segun el signo.
    else if (reglas.paraConPaso.test(l)) {
      const match = l.match(/^para\s+([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(\d+)\s+hasta\s+(\d+)\s+paso\s+(-?\d+)$/);
      const variable = match[1];
      const inicio = match[2];
      const fin = match[3];
      const paso = match[4];
      const operador = Number(paso) < 0 ? ">=" : "<=";
      if (!variablesDeclaradas.has(variable)) {
        resultado.push(`for (let ${variable} = ${inicio}; ${variable} ${operador} ${fin}; ${variable} += ${paso}) {`);
        variablesDeclaradas.add(variable);
      } else {
        resultado.push(`for (${variable} = ${inicio}; ${variable} ${operador} ${fin}; ${variable} += ${paso}) {`);
      }
    }
    else if (reglas.fin_para.test(l)) {
      resultado.push(`}`);
    }

    // Traduce ciclos MIENTRAS y su cierre.
    else if (reglas.mientras.test(l)) {
      const match = l.match(reglas.mientras);
      resultado.push(`while (${match[1]} ${match[3]} ${match[4]}) {`);
    }
    else if (reglas.fin_mientras.test(l)) {
      resultado.push(`}`);
    }

    // Traduce ciclos HACER ... MIENTRAS (equivalente a do...while en JS).
    else if (reglas.hacer.test(l)) {
      resultado.push(`do {`);
    }
    else if (reglas.cierre_hacer.test(l)) {
      const match = l.match(reglas.cierre_hacer);
      resultado.push(`} while (${match[1]} ${match[3]} ${match[4]});`);
    }

    // por si hay un error
    else {
      resultado.push(`// Error sintáctico no válido: ${l}`);
    }
  }

  // Une todas las lineas traducidas en un solo bloque de codigo JavaScript.
  return {
    codigoJS: resultado.join("\n"),
    listaTokens,
    erroresLexicos: listaErroresLexicos,
  };
}
