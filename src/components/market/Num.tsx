import { formatNumber } from "./format";

/**
 * Numero che MarketMotion fa contare fino al valore quando entra in vista.
 * Nell'HTML c'è già il valore finale, quindi si legge anche prima dell'idratazione;
 * la copia invisibile tiene la larghezza ferma mentre le cifre cambiano.
 */
export function Num({
  value,
  locale,
  decimals = 0,
  prefix = "",
  suffix = "",
}: {
  value: number;
  locale: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}) {
  const text = `${prefix}${formatNumber(value, locale, decimals)}${suffix}`;
  return (
    <span className="inline-grid tabular-nums">
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span
        className="col-start-1 row-start-1 text-right"
        data-count={value}
        data-dec={decimals}
        data-prefix={prefix}
        data-suffix={suffix}
      >
        {text}
      </span>
    </span>
  );
}
