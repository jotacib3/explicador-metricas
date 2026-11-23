import raw from "../../data/companies.json";
import { Dataset, type Company, type MetricKey } from "./schemas";

// Validamos el JSON al cargarlo: si alguien lo edita mal, falla temprano y con mensaje claro.
const dataset = Dataset.parse(raw);

export const DISCLAIMER = dataset.disclaimer;
export const COMPANIES: Company[] = dataset.companies;

type MetricInfo = {
  label: string;
  short: string;
  unit: "x" | "%";
  /** Regla general (ilustrativa) que la IA puede usar para decir si el número es bueno o malo. */
  guide: string;
};

export const METRICS: Record<MetricKey, MetricInfo> = {
  pe: {
    label: "P/E (precio/utilidad)",
    short: "P/E",
    unit: "x",
    guide:
      "Cuántos pesos pagas por cada peso de utilidad anual. Más bajo = más 'barata' frente a lo que gana; más alto = el mercado espera crecimiento. Negativo = la empresa tuvo pérdidas. Tiene sentido compararlo dentro del mismo sector.",
  },
  netMargin: {
    label: "Margen neto",
    short: "Margen neto",
    unit: "%",
    guide:
      "De cada 100 pesos que vende, cuántos le quedan de ganancia al final. Más alto suele ser mejor. Varía mucho por sector (en autoservicio es normal que sea bajo).",
  },
  roe: {
    label: "ROE (rentabilidad sobre capital)",
    short: "ROE",
    unit: "%",
    guide:
      "Cuánto gana la empresa por cada 100 pesos que han puesto sus dueños. Más alto suele ser mejor; si viene acompañado de mucha deuda, conviene verlo con cuidado.",
  },
  debtToEquity: {
    label: "Deuda / capital",
    short: "Deuda/capital",
    unit: "x",
    guide:
      "Cuánto debe la empresa por cada peso que es de sus dueños. Más alto = más apalancada y más riesgo si las cosas van mal. En bancos es normal que sea muy alto porque su negocio es prestar dinero.",
  },
  dividendYield: {
    label: "Rendimiento por dividendo",
    short: "Dividendo",
    unit: "%",
    guide:
      "Qué porcentaje del precio de la acción regresa la empresa a sus accionistas en dividendos al año. Más alto = más efectivo para el accionista hoy, pero no garantiza nada a futuro. 0% = no reparte dividendos.",
  },
};

export function formatMetric(metric: MetricKey, value: number): string {
  const { unit } = METRICS[metric];
  const n = value.toLocaleString("es-MX", { maximumFractionDigits: 2 });
  return unit === "%" ? `${n}%` : `${n}x`;
}

export function getCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id);
}

/**
 * Bloque de datos que reciben ambas IAs. Es la ÚNICA fuente de cifras permitida:
 * el explicador no puede usar otras y el revisor verifica contra este mismo texto.
 */
export function buildDataContext(company: Company, metric: MetricKey): string {
  const info = METRICS[metric];
  const rows = [
    { name: company.name, ticker: company.ticker, value: company.metrics[metric], main: true },
    ...company.rivals.map((r) => ({ name: r.name, ticker: r.ticker, value: r.metrics[metric], main: false })),
  ];

  return [
    `Sector: ${company.sector}`,
    `Métrica: ${info.label}`,
    `Guía general de la métrica: ${info.guide}`,
    "",
    "Valores (datos de ejemplo, ficticios):",
    ...rows.map(
      (r) => `- ${r.name} (${r.ticker})${r.main ? " [EMPRESA ELEGIDA]" : " [rival]"}: ${formatMetric(metric, r.value)}`,
    ),
  ].join("\n");
}
