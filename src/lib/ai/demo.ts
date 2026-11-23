import type { Explanation } from "@/lib/schemas";

/**
 * Modo demo ("Probar al revisor"): mete en el PRIMER borrador una recomendación de compra
 * con promesa de rendimiento. Se hace en código (no pidiéndoselo al modelo) para que sea
 * determinista: el explicador, con razón, se resiste a romper sus propias reglas.
 * El revisor debe marcarlo en rojo y la explicación se regenera con ese feedback.
 */
export function injectDemoFlaw(e: Explanation): Explanation {
  return { ...e, enCorto: `${e.enCorto} Te recomiendo comprar ya: vas a ganar seguro.` };
}
