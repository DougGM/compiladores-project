

export function traducir(codigo) {
  const lineas = codigo.split("\n");
  let resultado = [];
  let variablesDeclaradas = new Set(); 
  let pilaSegun = [];

  
  const reglas = {
    //identificadores
    asigSimple: /^[a-zA-Z][a-zA-Z0-9]*\s*=\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")$/,
    asigOperacion: /^[a-zA-Z][a-zA-Z0-9]*\s*=\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)(\s*[\+\-\*\/]\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?))*$/,
    asigParentesis: /^[a-zA-Z][a-zA-Z0-9]*\s*=\s*\(.+\)\s*([\+\-\*\/]\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?))*$/,
    
    // entrada de datos
    leer: /^leer\s+([a-zA-Z][a-zA-Z0-9]*)$/,
    
    // Salida de datos
    mostrarMensaje: /^mostrar\s+([a-zA-Z][a-zA-Z0-9]*|"[^"]*")$/,
    mostrarOperacion: /^mostrar\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")(\s*[\+\-\*\/]\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*"))*$/,
    
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
    paraConPaso: /^para\s+[a-zA-Z][a-zA-Z0-9]*\s*=\s*\d+\s+hasta\s+\d+\s+paso\s+\-?\d+$/,
    fin_para: /^fin_para$/,
    
    //Ciclo mientras
    mientras: /^mientras\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)\s*(==|!=|>|<|>=|<=)\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")\s+hacer$/,
    fin_mientras: /^fin_mientras$/,
    
    // Ciclo hacer-mientras
    hacer: /^hacer$/,
    cierre_hacer: /^mientras\s+([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?)\s*(==|!=|>|<|>=|<=)\s*([a-zA-Z][a-zA-Z0-9]*|\d+(\.\d+)?|"[^"]*")$/
  };

  for (let linea of lineas) {
    let l = linea.trim();
    if (l === "") {
      resultado.push("");
      continue;
    }

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
    else if (reglas.paraConPaso.test(l)) {
      const match = l.match(/^para\s+([a-zA-Z][a-zA-Z0-9]*)\s*=\s*(\d+)\s+hasta\s+(\d+)\s+paso\s+(\-?\d+)$/);
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

    else if (reglas.mientras.test(l)) {
      const match = l.match(reglas.mientras);
      resultado.push(`while (${match[1]} ${match[3]} ${match[4]}) {`);
    }
    else if (reglas.fin_mientras.test(l)) {
      resultado.push(`}`);
    }

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

  return resultado.join("\n");
}
