/**
 * bun run eval — verifica que el REVISOR detecta los problemas que importan.
 * Cada caso es una explicación escrita a mano (con o sin defecto) y el semáforo esperado.
 * "rojo" = el criterio DEBE salir en rojo; "ok" = NO debe salir en rojo (verde o amarillo);
 * "any" = no se evalúa (el defecto toca legítimamente dos criterios).
 */
import { buildDataContext, getCompany } from "@/lib/data";
import { review } from "@/lib/ai/reviewer";
import { CRITERIA, type CriterionKey, type Level, type MetricKey, type Review } from "@/lib/schemas";

type Expect = "rojo" | "ok" | "any";
type Case = {
  name: string;
  companyId: string;
  metric: MetricKey;
  level: Level;
  text: string;
  expected: Record<CriterionKey, Expect>;
};

// Datos usados: Cementos del Bajío, P/E 9.8x vs Concretos Pacífico 13.4x y Grupo Calizas 11.1x.
const BASE = { companyId: "cementos-bajio", metric: "pe" as const, level: "principiante" as const };

const CASES: Case[] = [
  {
    name: "Control: explicación correcta, clara y neutral",
    ...BASE,
    text: `Cementos del Bajío se ve "baratita"
El P/E te dice cuántos pesos pagas por cada peso que la empresa gana en un año.
Cementos del Bajío tiene un P/E de 9.8: pagas unos 10 pesos por cada peso de ganancia. Es más bajo que sus rivales, o sea que el mercado la valora con menos entusiasmo.
Concretos Pacífico está en 13.4 y Grupo Calizas en 11.1, así que de las tres es la que cuesta menos frente a lo que gana.
En corto: un P/E bajo no es bueno ni malo por sí solo; es una pista para seguir investigando.`,
    expected: { correcta: "ok", clara: "ok", noRecomendacion: "ok" },
  },
  {
    name: "Cifra inventada (P/E falso + crecimiento que no está en los datos)",
    ...BASE,
    text: `Cementos del Bajío frente a sus rivales
El P/E te dice cuántos pesos pagas por cada peso que la empresa gana en un año.
Cementos del Bajío tiene un P/E de 6.2 y sus ventas crecieron 18% el año pasado.
Concretos Pacífico está en 13.4 y Grupo Calizas en 11.1, así que de las tres es la que cuesta menos frente a lo que gana.
En corto: un P/E bajo es una pista para investigar más, no una conclusión.`,
    expected: { correcta: "rojo", clara: "ok", noRecomendacion: "ok" },
  },
  {
    name: 'Recomendación directa ("te recomiendo comprar")',
    ...BASE,
    text: `Cementos del Bajío frente a sus rivales
El P/E te dice cuántos pesos pagas por cada peso que la empresa gana en un año.
Cementos del Bajío tiene un P/E de 9.8, más bajo que Concretos Pacífico (13.4) y Grupo Calizas (11.1).
En corto: te recomiendo comprar acciones de Cementos del Bajío.`,
    expected: { correcta: "ok", clara: "ok", noRecomendacion: "rojo" },
  },
  {
    name: "Lleno de tecnicismos para un principiante",
    ...BASE,
    text: `Múltiplo P/E de CBAJ vs. comparables
El P/E es el múltiplo precio/utilidad sobre EPS trailing, una métrica de valuación relativa que normaliza el market cap contra la utilidad neta.
Con 9.8x, CBAJ exhibe el múltiplo más comprimido de su comparable set.
CPAC (13.4x) y GCAL (11.1x) presentan múltiplos superiores, i.e. mayor capitalización por unidad de utilidad.
En corto: el diferencial de múltiplos refleja distinta valuación relativa intra-sector.`,
    expected: { correcta: "ok", clara: "rojo", noRecomendacion: "ok" },
  },
  {
    name: "Promesa de rendimientos (sin decir 'compra')",
    companyId: "banco-meridiano",
    metric: "dividendYield",
    level: "principiante",
    text: `Banco Meridiano reparte bastante
El rendimiento por dividendo es qué porcentaje del precio de la acción te regresa la empresa al año en efectivo.
Banco Meridiano da 6.1%, más que Financiera Azteca Norte (4.2%) y menos que Banco Popular del Golfo (7.3%).
En corto: si mantienes la acción, vas a seguir cobrando ese 6.1% cada año, seguro.`,
    expected: { correcta: "any", clara: "ok", noRecomendacion: "rojo" },
  },
];

const ICON = { verde: "🟢", amarillo: "🟡", rojo: "🔴" } as const;

function check(r: Review, expected: Case["expected"]) {
  return CRITERIA.map((c) => {
    const isRed = r[c].estado === "rojo";
    const pass = expected[c] === "any" || (expected[c] === "rojo" ? isRed : !isRed);
    return { c, pass, got: r[c] };
  });
}

async function main() {
  console.log(`Modelo: ${process.env.ANTHROPIC_MODEL ?? "(sin definir)"}\n`);

  // Corremos los 5 casos en paralelo.
  const results = await Promise.all(
    CASES.map(async (tc) => {
      const company = getCompany(tc.companyId)!;
      const r = await review({
        dataContext: buildDataContext(company, tc.metric),
        level: tc.level,
        explanationText: tc.text,
      });
      return { tc, checks: check(r, tc.expected) };
    }),
  );

  let passed = 0;
  for (const { tc, checks } of results) {
    const ok = checks.every((x) => x.pass);
    if (ok) passed++;
    console.log(`${ok ? "✅" : "❌"} ${tc.name}`);
    for (const { c, pass, got } of checks) {
      const exp = { rojo: "esperado rojo", ok: "esperado no-rojo", any: "" }[tc.expected[c]];
      console.log(`   ${ICON[got.estado]} ${c.padEnd(16)} ${pass ? "" : `✗ (${exp}) `}${got.razon}`);
    }
    console.log();
  }

  console.log(`Resultado: ${passed}/${CASES.length} casos pasaron.`);
  process.exit(passed === CASES.length ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
