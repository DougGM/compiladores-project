const translationRules = [
  {
    id: 1,
    title: "Variables y asignación",
    description:
      'Para el manejo de variables, los identificadores deben iniciar con una letra y pueden contener letras y números despues. La asignación se realiza con "=", permitiendo guardar números, textos, operaciones matemáticas o el contenido de otras variables.',
    pseudoExamples: ["a = 10", "b = 10 + 3", "c = 8 * 5", "d = (a + b) / 2"],
    jsExamples: [
      "let a = 10",
      "let b = 10 + 3",
      "let c = 8 * 5",
      "let d = (a + b) / 2",
    ],
  },
  {
    id: 2,
    title: "Entrada de datos",
    description:
      "La lectura de datos se hace con la instrucción reservada LEER para capturar información del usuario. El valor ingresado se almacena en una variable definida.",
    pseudoExamples: ["leer edad", "leer nombre"],
    jsExamples: ["let edad = prompt()", "let nombre = prompt()"],
  },
  {
    id: 3,
    title: "Salida de datos",
    description:
      'Para mostrar información en pantalla se usa la palabra reservada "mostrar", que permite desplegar mensajes, variables o resultados de operaciones.',
    pseudoExamples: ['mostrar "Resultado"', "mostrar a", "mostrar a + 5"],
    jsExamples: ['console.log("Resultado")', "console.log(a)", "console.log(a + 5)"],
  },
  {
    id: 4,
    title: "Condicional si - sino",
    description:
      "La estructura SI evalua una condición lógica y ejecuta un bloque. Puede incluir un bloque alternativo con SINO y termina con FIN_SI.",
    pseudoExamples: [
      "si a > 5 entonces",
      '    mostrar "Mayor"',
      "fin_si",
      "",
      "si a > 5 entonces",
      '    mostrar "Mayor"',
      "sino",
      '    mostrar "Menor"',
      "fin_si",
    ],
    jsExamples: [
      "if (a > 5) {",
      '    console.log("Mayor")',
      "}",
      "if (a > 5) {",
      '    console.log("Mayor")',
      "} else {",
      '    console.log("Menor")',
      "}",
    ],
  },
  {
    id: 5,
    title: "Estructura según - caso",
    description:
      "La estructura SEGúN evalua una variable o expresion y ejecuta acciones por CASO. Puede incluir DEFECTO para valores no contemplados y finaliza con FIN_SEGUN.",
    pseudoExamples: [
      "segun opcion",
      "    caso 1",
      '        mostrar "Suma"',
      "    caso 2",
      '        mostrar "Resta"',
      "    defecto",
      '        mostrar "Opcion invalida"',
      "fin_segun",
    ],
    jsExamples: [
      "switch (opcion) {",
      "    case 1:",
      '        console.log("Suma")',
      "        break",
      "    case 2:",
      '        console.log("Resta")',
      "        break",
      "    default:",
      '        console.log("Opcion invalida")',
      "}",
    ],
  },
  {
    id: 6,
    title: "Ciclo para",
    description:
      "El ciclo PARA repite instrucciones una cantidad definida de veces usando variable de control, valor inicial, valor final y opcionalmente paso.",
    pseudoExamples: [
      "para i = 1 hasta 5",
      "    mostrar i",
      "fin_para",
      "",
      "para i = 10 hasta 0 paso -2",
      "    mostrar i",
      "fin_para",
    ],
    jsExamples: [
      "for (let i = 1; i <= 5; i++) {",
      "    console.log(i)",
      "}",
      "for (let i = 10; i >= 0; i -= 2) {",
      "    console.log(i)",
      "}",
    ],
  },
  {
    id: 7,
    title: "Ciclo mientras",
    description:
      "La estructura MIENTRAS ejecuta un bloque mientras la condición sea verdadera. La condición se evalua antes de cada iteracion y termina con FIN_MIENTRAS.",
    pseudoExamples: ["mientras a < 10 hacer", "    a = a + 1", "fin_mientras"],
    jsExamples: ["while (a < 10) {", "    a++", "}"],
  },
  {
    id: 8,
    title: "Ciclo hacer - mientras",
    description:
      "Este ciclo ejecuta el bloque al menos una vez y luego evalua la condición al final para decidir si repite.",
    pseudoExamples: ["hacer", "    a = a + 1", "mientras a < 5"],
    jsExamples: ["do {", "    a++", "} while (a < 5)"],
  },
]

export const TranslationRules = () => {
  return (
    <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-800">Reglas de traducción</h2>

      </div>

      <div className="grid gap-4">
        {translationRules.map((rule) => (
          <details
            key={rule.id}
            open={rule.id === 1}
            className="rounded-xl border border-slate-200 bg-slate-50/70"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-500 text-sm font-semibold text-white">
                  {rule.id}
                </span>
                <h3 className="text-base font-semibold text-slate-800">{rule.title}</h3>
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Ver detalle
              </span>
            </summary>

            <div className="border-t border-slate-200 bg-white p-4">
              <p className="text-sm leading-relaxed text-slate-600">{rule.description}</p>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <article className="rounded-lg border border-slate-200 bg-slate-950/95 p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Ejemplos en PseudoJS
                  </h4>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                    <code>{rule.pseudoExamples.join("\n")}</code>
                  </pre>
                </article>

                <article className="rounded-lg border border-slate-200 bg-slate-950/95 p-3">
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Traduccion a JavaScript
                  </h4>
                  <pre className="overflow-x-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-100">
                    <code>{rule.jsExamples.join("\n")}</code>
                  </pre>
                </article>
              </div>
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}
